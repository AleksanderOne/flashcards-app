/**
 * Test środowiska E2E - uruchamiany jako pierwszy
 *
 * Sprawdza czy:
 * 1. Serwer się poprawnie uruchomił
 * 2. Port jest dostępny
 * 3. Strona główna odpowiada
 */

import { test, expect } from "@playwright/test";

test.describe("Środowisko E2E (Setup Check)", () => {
  test("Serwer E2E powinien być uruchomiony na dynamicznym porcie", async ({
    page,
  }) => {
    // Pobierz URL bazowy z konfiguracji
    const baseURL = page.context()._options.baseURL;

    // Sprawdź czy baseURL jest ustawiony
    expect(baseURL).toBeTruthy();
    expect(baseURL).toMatch(/^http:\/\/localhost:\d+$/);

    console.log(`✅ E2E działa na: ${baseURL}`);
  });

  test("Strona główna powinna odpowiadać (health check)", async ({ page }) => {
    // Spróbuj wejść na stronę główną
    const response = await page.goto("/");

    // Sprawdź czy odpowiedź jest OK (2xx)
    expect(response).not.toBeNull();
    expect(response?.status()).toBeLessThan(400);

    console.log(
      `✅ Strona główna odpowiada ze statusem: ${response?.status()}`,
    );
  });

  test("Middleware/Proxy powinien działać - chronione trasy powinny przekierowywać", async ({
    page,
  }) => {
    // Wejdź na chronioną trasę bez logowania
    await page.goto("/learn");

    // Poczekaj na potencjalne przekierowanie
    await page.waitForLoadState("networkidle");

    // Sprawdź czy nastąpiło przekierowanie do logowania
    const url = page.url();

    // Jeśli URL zawiera /learn - middleware nie działa!
    if (url.includes("/learn") && !url.includes("login")) {
      // Dodatkowo sprawdź czy strona nie wyświetla błędu
      const content = await page.content();

      // Jeśli strona załadowała się normalnie bez przekierowania - to błąd
      if (!content.includes("Zaloguj") && !content.includes("login")) {
        throw new Error(
          `❌ KRYTYCZNY BŁĄD: Middleware/Proxy nie działa!\n` +
            `   Chroniona trasa /learn jest dostępna bez logowania.\n` +
            `   URL: ${url}\n` +
            `   Sprawdź:\n` +
            `   1. Czy plik proxy.ts istnieje w root projekcie\n` +
            `   2. Czy proxy.ts eksportuje funkcję 'proxy' i 'config'`,
        );
      }
    }

    // Powinno przekierować do logowania
    expect(url).toMatch(/\/(login|centrum-logowania)/);
    console.log(`✅ Middleware działa - przekierowano do: ${url}`);
  });
});
