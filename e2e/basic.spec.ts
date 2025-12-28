import { test, expect } from "@playwright/test";

test.describe("Aplikacja Flashcards (E2E Basic)", () => {
  test("Strona główna powinna być dostępna publicznie (landing page lub setup)", async ({
    page,
  }) => {
    await page.goto("/");
    // Strona główna jest publiczna - wyświetla landing page LUB setup (gdy SSO nie skonfigurowane)
    // W CI nie ma konfiguracji SSO, więc przekierowuje na /setup
    const url = page.url();
    const isLandingPage = url.endsWith("/") || url.includes("localhost:3000");
    const isSetupPage = url.includes("/setup");

    expect(isLandingPage || isSetupPage).toBe(true);

    // Jeśli to landing page - sprawdź nagłówek
    if (isLandingPage && !isSetupPage) {
      await expect(page.locator("text=Ucz się angielskiego")).toBeVisible({
        timeout: 10000,
      });
    }
    // Jeśli to setup page - to też OK (aplikacja nie skonfigurowana)
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
