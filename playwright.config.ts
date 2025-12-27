import { defineConfig, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SERVER_INFO_FILE = path.join(__dirname, "e2e", ".server-info.json");

function getBaseURL(): string {
  try {
    if (fs.existsSync(SERVER_INFO_FILE)) {
      const info = JSON.parse(fs.readFileSync(SERVER_INFO_FILE, "utf-8"));
      return `http://localhost:${info.port}`;
    }
  } catch {
    // Ignoruj błędy odczytu
  }
  return process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: getBaseURL(),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
