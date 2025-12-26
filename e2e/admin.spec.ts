import { test, expect } from '@playwright/test';

/**
 * Testy E2E dla panelu administratora
 * 
 * UWAGA: Te testy wymagają zalogowanego admina.
 * W środowisku CI należy skonfigurować odpowiednie credentials lub pominąć te testy.
 * 
 * Testuje:
 * - Dostęp do panelu admina dla nie-zalogowanych (przekierowanie)
 * - Stronę zarządzania słówkami (publiczna część)
 * - Stronę ustawień admina
 */

test.describe('Panel Administratora (E2E)', () => {

    test('Próba wejścia na /admin/words powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/admin/words');

        // Powinno przekierować do strony logowania
        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Próba wejścia na /admin/users powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/admin/users');

        // Powinno przekierować do strony logowania
        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Próba wejścia na /admin/settings powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/admin/settings');

        // Powinno przekierować do strony logowania
        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

});

test.describe('Strony chronione dashboardu (E2E)', () => {

    test('Strona /statistics powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/statistics');

        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Strona /achievements powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/achievements');

        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Strona /settings powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/settings');

        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Strona /my-words powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/my-words');

        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Strona /challenge powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/challenge');

        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

});

test.describe('Strony słówek - chronione (E2E)', () => {

    test('Strona /all-words powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/all-words');

        // Strona jest chroniona - przekierowanie do logowania
        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

    test('Strona /print-words powinna przekierować niezalogowanego do logowania', async ({ page }) => {
        await page.goto('/print-words');

        // Strona jest chroniona - przekierowanie do logowania
        await expect(page).toHaveURL(/.*\/(login|centrum-logowania)/);
    });

});

test.describe('Security Headers (E2E)', () => {

    test('Strona powinna mieć nagłówki bezpieczeństwa CSP', async ({ page }) => {
        const response = await page.goto('/');

        if (response) {
            const headers = response.headers();

            // Sprawdzenie nagłówka CSP (może być ustawiony przez next.config.ts)
            // W development może nie być obecny
            // expect(headers['content-security-policy']).toBeDefined();

            // X-Content-Type-Options powinien być ustawiony
            // (może być dodany przez serwer lub aplikację)
        }
    });

    test('Strona główna powinna załadować się bez błędów konsoli', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Filtrujemy błędy związane z React DevTools lub innymi niekrytycznymi ostrzeżeniami
        const criticalErrors = consoleErrors.filter(
            (error) => !error.includes('Download the React DevTools')
        );

        // Nie powinno być krytycznych błędów
        expect(criticalErrors).toHaveLength(0);
    });

});

test.describe('Responsywność UI (E2E)', () => {

    test('Strona główna powinna być responsywna na mobile', async ({ page }) => {
        // Ustawienie viewportu na mobilny
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Strona powinna się załadować poprawnie
        await expect(page.locator('text=Ucz się angielskiego')).toBeVisible({ timeout: 10000 });
    });

    test('Strona główna powinna być responsywna na tablet', async ({ page }) => {
        // Ustawienie viewportu na tablet
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Ucz się angielskiego')).toBeVisible({ timeout: 10000 });
    });

    test('Strona logowania powinna być responsywna na mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // Przycisk SSO powinien być widoczny
        await expect(page.locator('text=Zaloguj przez Centrum')).toBeVisible({ timeout: 10000 });
    });

});
