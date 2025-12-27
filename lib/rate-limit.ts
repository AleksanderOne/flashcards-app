/**
 * Rate Limiting - hybrydowe rozwiązanie
 *
 * Używa Upstash Redis gdy skonfigurowany (produkcja),
 * lub in-memory fallback (development/brak Redis).
 *
 * Wymagane zmienne środowiskowe dla Upstash:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ============================================================================
// KONFIGURACJA
// ============================================================================

const RATE_LIMIT_CONFIG = {
  // Limity dla różnych endpointów (requests per window)
  auth: { requests: 10, window: "1m" as const }, // 10 req/min - logowanie
  api: { requests: 100, window: "1m" as const }, // 100 req/min - API
  actions: { requests: 30, window: "1m" as const }, // 30 req/min - Server Actions
};

// ============================================================================
// IN-MEMORY FALLBACK (dla development / brak Redis)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Przechowuje liczniki per IP (czyści się przy restarcie serwera)
const inMemoryStore = new Map<string, RateLimitEntry>();

// Interwał czyszczenia starych wpisów (5 minut)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Czyszczenie starych wpisów
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetAt < now) {
        inMemoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * In-memory rate limiter (fallback)
 */
function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Nowy wpis lub wygasły
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (entry.count >= limit) {
    // Limit przekroczony
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  // Zwiększ licznik
  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

// ============================================================================
// UPSTASH REDIS RATE LIMITER
// ============================================================================

// Sprawdzenie czy Upstash jest skonfigurowany
const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Lazy initialization Redis (tylko gdy potrzebne)
let redis: Redis | null = null;
let authLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;
let actionsLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis && hasUpstash) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis!;
}

function getAuthLimiter(): Ratelimit {
  if (!authLimiter && hasUpstash) {
    authLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.auth.requests,
        RATE_LIMIT_CONFIG.auth.window,
      ),
      analytics: true,
      prefix: "ratelimit:auth",
    });
  }
  return authLimiter!;
}

function getApiLimiter(): Ratelimit {
  if (!apiLimiter && hasUpstash) {
    apiLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.api.requests,
        RATE_LIMIT_CONFIG.api.window,
      ),
      analytics: true,
      prefix: "ratelimit:api",
    });
  }
  return apiLimiter!;
}

function getActionsLimiter(): Ratelimit {
  if (!actionsLimiter && hasUpstash) {
    actionsLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_CONFIG.actions.requests,
        RATE_LIMIT_CONFIG.actions.window,
      ),
      analytics: true,
      prefix: "ratelimit:actions",
    });
  }
  return actionsLimiter!;
}

// ============================================================================
// PUBLICZNE API
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Konwertuje string window na milisekundy
 */
function windowToMs(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60000; // domyślnie 1 minuta

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

/**
 * Rate limiting dla endpointów auth (logowanie, callback)
 */
export async function checkAuthRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const result = await getAuthLimiter().limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fallback in-memory
  const { requests, window } = RATE_LIMIT_CONFIG.auth;
  return inMemoryRateLimit(`auth:${identifier}`, requests, windowToMs(window));
}

/**
 * Rate limiting dla API routes
 */
export async function checkApiRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const result = await getApiLimiter().limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fallback in-memory
  const { requests, window } = RATE_LIMIT_CONFIG.api;
  return inMemoryRateLimit(`api:${identifier}`, requests, windowToMs(window));
}

/**
 * Rate limiting dla Server Actions
 */
export async function checkActionsRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const result = await getActionsLimiter().limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fallback in-memory
  const { requests, window } = RATE_LIMIT_CONFIG.actions;
  return inMemoryRateLimit(
    `actions:${identifier}`,
    requests,
    windowToMs(window),
  );
}

/**
 * Sprawdza czy Upstash Redis jest skonfigurowany
 */
export function isUpstashConfigured(): boolean {
  return hasUpstash;
}

/**
 * Eksport konfiguracji (dla informacji)
 */
export { RATE_LIMIT_CONFIG };
