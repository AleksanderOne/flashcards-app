import { test, expect } from '@playwright/test';

test.describe('Aplikacja Flashcards (E2E Basic)', () => {

    test('Strona główna powinna być dostępna publicznie', async ({ page }) => {
        await page.goto('/');
        // Sprawdzamy czy nie ma przekierowania do login
        expect(page.url()).not.toContain('/login');
        // Sprawdzamy tytuł (nawet częściowy)
        // await expect(page).toHaveTitle(/Flashcards/i); 
    });

    test('Próba wejścia na chronioną trasę (/learn) powinna przekierować do logowania', async ({ page }) => {
        await page.goto('/learn');
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Strona logowania powinna zawierać formularz', async ({ page }) => {
        await page.goto('/login');
        // Sprawdź obecność pól hasła i email
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        // Sprawdź przycisk
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
});
