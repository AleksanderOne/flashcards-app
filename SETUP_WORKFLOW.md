# TODO: Konfiguracja Workflow (Testy, CI/CD, Wersjonowanie)

Ten dokument opisuje kroki potrzebne do skonfigurowania środowiska deweloperskiego zgodnego ze standardami `centrum-logowania-app`.

## 1. Instalacja Zależności

Zainstaluj wymagane biblioteki deweloperskie:

```bash
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional \
  semantic-release @semantic-release/changelog @semantic-release/git \
  vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom \
  @playwright/test prettier eslint-components-config
```

> **Uwaga:** Upewnij się, że masz już `eslint`, `prettier` i `typescript`.

## 2. Aktualizacja `package.json`

Dodaj lub zaktualizuj sekcję `scripts` w `package.json`:

```json
"scripts": {
  "predev": "git pull --rebase origin main || echo 'Nie udało się pobrać zmian - kontynuuję...'",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:unit": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "validate": "npm run typecheck && npm run lint && npm run test:unit && npm run build",
  "prepare": "husky"
}
```

## 3. Konfiguracja Plików

Utwórz następujące pliki konfiguracyjne w głównym katalogu projektu:

### `.lintstagedrc.json`

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,scss}": ["prettier --write"]
}
```

### `.releaserc.json`

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/npm", { "npmPublish": false }],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "package-lock.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

### `commitlint.config.js`

```javascript
module.exports = { extends: ["@commitlint/config-conventional"] };
```

## 4. Konfiguracja Husky (Git Hooks)

Zainicjuj Husky i utwórz hooki:

```bash
npx husky init
```

### Edytuj `.husky/pre-commit`

```sh
#!/bin/sh
# Uruchamia lint-staged oraz testy jednostkowe na zmienionych plikach lub wszystkich
echo "🔍 Uruchamiam lint-staged..."
npx lint-staged

echo "🧪 Uruchamiam testy jednostkowe..."
npm run test:unit
```

### Utwórz/Edytuj `.husky/pre-push`

```sh
#!/bin/sh
# Sprawdza coverage, build i testy e2e przed wysłaniem zmian

echo "📊 Sprawdzam pokrycie kodu..."
npm run test:coverage
if [ $? -ne 0 ]; then
  echo "❌ Coverage error! Push zablokowany."
  exit 1
fi

echo "🔨 Sprawdzam build..."
npm run build

echo "🎭 Uruchamiam testy e2e..."
npm run test:e2e
```

### Utwórz/Edytuj `.husky/commit-msg`

```sh
#!/bin/sh
npx --no -- commitlint --edit "$1"
```

## 5. Inicjalizacja Playwright i Vitest (Jeśli nie skonfigurowane)

```bash
npx playwright install
```

### `vitest.config.ts`

> **Ważne:** Zwróć uwagę na sekcję `exclude` w `coverage`. W `centrum-logowania-app` wyłączone z testów jednostkowych (coverage) są pliki Next.js (`page.tsx`, `layout.tsx`), konfiguracja UI (`components/ui`), API oraz baza danych. Dzięki temu wymaganie 100% pokrycia dotyczy tylko logiki biznesowej i użytecznych komponentów, a nie boilerplate'u frameworka.

```typescript
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    exclude: [...configDefaults.exclude, "tests/**"],

    coverage: {
      provider: "v8",
      enabled: false, // Włączane flagą --coverage
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",

      // Progi pokrycia - 100% dla wszystkich metryk!
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        perFile: true, // Wymagaj 100% dla KAŻDEGO pliku z osobna
      },

      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/tests/**",
        "**/*.config.{ts,tsx}",
        "**/schemas/**",
        "**/types/**",
        "**/layout.tsx",
        "**/loading.tsx",
        "**/error.tsx",
        "**/not-found.tsx",
        "**/global-error.tsx",
        "**/app/**/page.tsx", // Strony testowane przez E2E
        "**/app/page.tsx",
        "**/actions/**",
        "**/auth.ts",
        "**/auth.config.ts",
        "**/middleware.ts",
        "**/proxy.ts",
        "**/components/ui/**", // Komponenty Shadcn UI
        "**/theme-provider.tsx",
        "**/mode-toggle.tsx",
        "**/api/**", // API route'y
        "**/db/**", // Konfiguracja bazy danych
      ],
      skipFull: false,
      clean: true,
    },
  },
});
```

### `vitest.setup.ts`

```typescript
import "@testing-library/jest-dom";
```

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

// Zmienne środowiskowe dla testów E2E
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test-secret-for-e2e-tests-only";
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "test-secret-for-e2e-tests-only";
process.env.AUTH_TRUST_HOST = "true";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET || "test-secret-for-e2e-tests-only",
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || "test-secret-for-e2e-tests-only",
      AUTH_TRUST_HOST: "true",
    },
  },
});
```

## 7. Alternatywny Workflow: PLATYNOWY STANDARD (High Security)

Jeśli projekt wymaga najwyższego poziomu bezpieczeństwa i niezawodności (jak w przypadku systemów logowania), samo pokrycie kodu (Coverage 100%) to za mało. Możesz mieć testy, które pokrywają kod, ale niczego nie sprawdzają.

Rozwiązaniem jest **Testowanie Mutacyjne (Mutation Testing)** oraz automatyczny **Audyt Bezpieczeństwa**.

### 1. Zainstaluj dodatkowe narzędzia

```bash
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner eslint-plugin-security eslint-plugin-no-secrets
```

### 2. Skonfiguruj `stryker.config.json`

Stryker celowo wprowadza błędy w kodzie (mutanty), aby sprawdzić, czy twoje testy je wykryją (zabiją).

```json
{
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker/master/packages/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "vitest",
  "reporters": ["html", "clear-text", "progress"],
  "htmlReporter": { "fileName": "reports/mutation/html/index.html" },
  "mutate": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.{ts,tsx}",
    "!src/components/ui/**",
    "!src/app/**/page.tsx",
    "!src/api/**"
  ],
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

### 3. Zaktualizuj `.husky/pre-push`

W wersji "Platinum" przed wypchnięciem kodu sprawdzamy nie tylko testy, ale też bezpieczeństwo pakietów.

```sh
#!/bin/sh
echo "🛡️ Skanowanie podatności (npm audit)..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
    echo "❌ Znaleziono luki bezpieczeństwa! Zaktualizuj pakiety."
    exit 1
fi

echo "📊 Uruchamiam testy i coverage..."
npm run test:coverage

echo "🔨 Budowanie aplikacji..."
npm run build
```

### 4. Kiedy stosować ten standard?

Ten workflow jest bardziej czasochłonny (npm audit i testy trwają dłużej), ale niezbędny w projektach:

1.  Przetwarzających dane osobowe (RODO/GDPR).
2.  Obsługujących płatności.
3.  Będących centralnymi punktami uwierzytelniania (jak `centrum-logowania-app`).
