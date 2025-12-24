/**
 * Helper do rate limiting w Server Actions
 * 
 * Używany do ochrony Server Actions przed nadmiernym wywołaniem.
 * Pobiera IP z headers (dostępnych w Server Actions).
 */

import { headers } from 'next/headers';
import { checkActionsRateLimit } from './rate-limit';

/**
 * Pobiera identyfikator (IP) z Server Action context
 */
async function getActionIdentifier(): Promise<string> {
    const headersList = await headers();

    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');

    const ip = forwardedFor?.split(',')[0]?.trim()
        || realIp
        || 'anonymous';

    return ip;
}

/**
 * Sprawdza rate limit dla Server Action
 * 
 * @returns true jeśli można kontynuować, false jeśli limit przekroczony
 */
export async function checkActionRateLimit(): Promise<{
    allowed: boolean;
    error?: string;
}> {
    const identifier = await getActionIdentifier();
    const result = await checkActionsRateLimit(identifier);

    if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        return {
            allowed: false,
            error: `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter} sekund.`,
        };
    }

    return { allowed: true };
}

/**
 * Decorator do użycia w Server Actions
 * 
 * Przykład użycia:
 * ```typescript
 * export async function myAction(data: unknown) {
 *     const rateLimit = await checkActionRateLimit();
 *     if (!rateLimit.allowed) {
 *         return { success: false, error: rateLimit.error };
 *     }
 *     // ... reszta logiki
 * }
 * ```
 */
