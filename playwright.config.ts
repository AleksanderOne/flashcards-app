import { defineConfig, devices } from "@playwright/test";

// Port dla E2E - ustawiany przez scripts/run-e2e.ts (domyślnie 3000)
const E2E_PORT = parseInt(process.env.E2E_PORT || "3000");
const BASE_URL = `http://localhost:${E2E_PORT}`;

// Zmienne środowiskowe dla testów E2E
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test-secret-for-e2e-tests-only";
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "test-secret-for-e2e-tests-only";
process.env.AUTH_TRUST_HOST = "true";

/**
 * Konfiguracja Playwright z dynamicznym portem
 *
 * Port jest ustawiany przez scripts/run-e2e.ts który:
 * 1. Znajduje wolny port zaczynając od 3000
 * 2. Ustawia E2E_PORT i uruchamia Playwright
 *
 * Serwer jest automatycznie zabijany przez Playwright po testach.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${E2E_PORT}`,
    url: BASE_URL,
    // Zawsze uruchamiaj świeży serwer - gwarantuje aktualny middleware
    reuseExistingServer: false,
    timeout: 120 * 1000,
    // Playwright automatycznie zabija serwer po testach
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET || "test-secret-for-e2e-tests-only",
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || "test-secret-for-e2e-tests-only",
      AUTH_TRUST_HOST: "true",
    },
  },
});
