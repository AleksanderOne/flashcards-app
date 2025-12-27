import { test, expect } from "@playwright/test";

test.describe("Aplikacja Flashcards (E2E Basic)", () => {
  test("Strona główna powinna być dostępna publicznie (landing page)", async ({
    page,
  }) => {
    await page.goto("/");
    // Strona główna jest publiczna - wyświetla landing page
    await expect(page).toHaveURL(/\/$/);
    // Sprawdzamy że to landing page - zawiera nagłówek
    await expect(page.locator("text=Ucz się angielskiego")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Próba wejścia na chronioną trasę (/learn) powinna przekierować do logowania", async ({
    page,
  }) => {
    await page.goto("/learn");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("Strona logowania powinna zawierać przycisk SSO", async ({ page }) => {
    await page.goto("/login");
    // Czekamy na załadowanie formularza (client-side rendering)
    // await page.waitForLoadState('networkidle');
    // Sprawdzamy przycisk logowania przez centrum (SSO)
    await expect(page.locator("text=Zaloguj przez Centrum")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Strona logowania powinna wyświetlać informację o bezpieczeństwie", async ({
    page,
  }) => {
    await page.goto("/login");
    // await page.waitForLoadState('networkidle');
    // Sprawdzamy informację o bezpiecznym logowaniu
    await expect(page.locator("text=Bezpieczne logowanie")).toBeVisible({
      timeout: 10000,
    });
  });
});
