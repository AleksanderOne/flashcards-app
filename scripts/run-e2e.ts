#!/usr/bin/env tsx
/**
 * Wrapper dla testów E2E z dynamicznym portem
 *
 * 1. Znajduje wolny port zaczynając od 3000
 * 2. Ustawia zmienną E2E_PORT
 * 3. Uruchamia Playwright
 *
 * Playwright automatycznie zabija serwer po zakończeniu testów.
 */

import detectPort from "detect-port";
import { spawnSync } from "child_process";

const START_PORT = 3000;

async function runE2E() {
  // Znajdź wolny port
  const port = await detectPort(START_PORT);

  console.log(
    `\n🚀 E2E: Znaleziono wolny port ${port} (szukano od ${START_PORT})\n`,
  );

  // Uruchom Playwright z portem jako zmienną środowiskową
  // Używamy spawnSync bez shell dla bezpieczeństwa
  const args = ["playwright", "test", ...process.argv.slice(2)];

  const result = spawnSync("npx", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_PORT: port.toString(),
    },
  });

  process.exit(result.status || 0);
}

runE2E();
