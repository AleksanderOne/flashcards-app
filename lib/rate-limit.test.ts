/**
 * Testy dla Rate Limiting (in-memory fallback)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    checkAuthRateLimit,
    checkApiRateLimit,
    checkActionsRateLimit,
    isUpstashConfigured,
    RATE_LIMIT_CONFIG
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
    beforeEach(() => {
        // Reset dla każdego testu
        vi.clearAllMocks();
    });

    describe('isUpstashConfigured', () => {
        it('powinien zwrócić false gdy brak zmiennych środowiskowych', () => {
            // W testach nie mamy UPSTASH zmiennych
            const result = isUpstashConfigured();
            expect(result).toBe(false);
        });
    });

    describe('RATE_LIMIT_CONFIG', () => {
        it('powinien mieć skonfigurowane limity dla auth', () => {
            expect(RATE_LIMIT_CONFIG.auth).toBeDefined();
            expect(RATE_LIMIT_CONFIG.auth.requests).toBeGreaterThan(0);
            expect(RATE_LIMIT_CONFIG.auth.window).toBe('1m');
        });

        it('powinien mieć skonfigurowane limity dla api', () => {
            expect(RATE_LIMIT_CONFIG.api).toBeDefined();
            expect(RATE_LIMIT_CONFIG.api.requests).toBeGreaterThan(0);
        });

        it('powinien mieć skonfigurowane limity dla actions', () => {
            expect(RATE_LIMIT_CONFIG.actions).toBeDefined();
            expect(RATE_LIMIT_CONFIG.actions.requests).toBeGreaterThan(0);
        });
    });

    describe('In-memory Rate Limiting (fallback)', () => {
        it('powinien zezwolić na pierwsze zapytanie', async () => {
            const result = await checkAuthRateLimit('test-ip-1');

            expect(result.success).toBe(true);
            expect(result.remaining).toBeLessThan(result.limit);
        });

        it('powinien zwrócić poprawne wartości limit/remaining', async () => {
            const result = await checkApiRateLimit('test-ip-2');

            expect(result.limit).toBe(RATE_LIMIT_CONFIG.api.requests);
            expect(result.remaining).toBe(RATE_LIMIT_CONFIG.api.requests - 1);
            expect(result.reset).toBeGreaterThan(Date.now());
        });

        it('powinien zmniejszać remaining przy kolejnych zapytaniach', async () => {
            const ip = 'test-ip-3';

            const result1 = await checkActionsRateLimit(ip);
            const result2 = await checkActionsRateLimit(ip);

            expect(result2.remaining).toBeLessThan(result1.remaining);
        });

        it('powinien blokować po przekroczeniu limitu', async () => {
            const ip = 'test-ip-block';
            const limit = RATE_LIMIT_CONFIG.auth.requests;

            // Wykonaj limit zapytań
            for (let i = 0; i < limit; i++) {
                await checkAuthRateLimit(ip);
            }

            // Następne powinno być zablokowane
            const result = await checkAuthRateLimit(ip);
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('powinien śledzić różne IP osobno', async () => {
            const ip1 = 'test-ip-a';
            const ip2 = 'test-ip-b';

            // Zużyj cały limit dla ip1
            for (let i = 0; i < RATE_LIMIT_CONFIG.auth.requests; i++) {
                await checkAuthRateLimit(ip1);
            }

            // ip2 powinien nadal mieć dostęp
            const result = await checkAuthRateLimit(ip2);
            expect(result.success).toBe(true);
        });
    });
});
