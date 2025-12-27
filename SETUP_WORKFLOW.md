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

## 8. Automatyzacja Wersjonowania (CI/CD)

Wersjonowanie (Semantic Release) działa w pełni automatycznie, ale **WYMAGA serwera CI**, który uruchomi proces po zmergowaniu zmian do `main`. Samo zainstalowanie bibliotek lokalnie nie wystarczy.

Skonfiguruj **GitHub Actions**, tworząc plik `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run unit tests
        run: npm run test:unit

      - name: Build
        env:
          AUTH_SECRET: "dummy-secret-for-build-only"
          NEXTAUTH_SECRET: "dummy-secret-for-build-only"
          AUTH_TRUST_HOST: "true"
        run: npm run build

      - name: Run E2E tests
        env:
          AUTH_SECRET: "dummy-secret-for-build-only"
          NEXTAUTH_SECRET: "dummy-secret-for-build-only"
          AUTH_TRUST_HOST: "true"
        run: npm run test:e2e

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          HUSKY: "0"
        run: npx semantic-release
```

### Jak to działa?

1.  Programista robi Push do PR.
2.  Review i Merge do `main`.
3.  GitHub Actions uruchamia workflow `release.yml`.
4.  Uruchamiane są testy i build (dla pewności).
5.  `semantic-release` analizuje historię commitów (np. `feat: nowe logowanie` = minor bump, `fix: literówka` = patch bump).
6.  Tworzony jest Git Tag, Release na GitHubie oraz aktualizowany plik `CHANGELOG.md`.

To jest **jedyny** moment, kiedy wersja jest podbijana. Lokalnie wersja w `package.json` się nie zmienia.

## 9. Konfiguracja Lintowania i Formatowania

Aby kod był spójny i bezpieczny, zastosuj następujące konfiguracje.

### `eslint.config.mjs`

Zwróć uwagę na reguły `no-var`, `eqeqeq` oraz `prefer-const`.

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier, // Wyłącza reguły konfliktujące z Prettier
  {
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-empty": ["error", { allowEmptyCatch: false }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  globalIgnores([".next/**", "coverage/**", "test-results/**"]),
]);

export default eslintConfig;
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `tsconfig.json`

Kluczowe: `strict: true`.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

## 10. Przydatne Skrypty (Opcjonalne)

W katalogu `scripts/` warto trzymać pomocnicze narzędzia:

- `test-db.ts`: Sprawdza połączenie z bazą danych (Postgres).
- `setup-db.ts`: Tworzy wymagane schematy SQL przed startem aplikacji.

## 11. Rekomendacje Dodatkowe (Dla Zwiększenia Bezpieczeństwa)

Poniższe elementy nie występują domyślnie w każdej aplikacji, ale znacznie podnoszą standard bezpieczeństwa i jakość pracy (tzw. "Industry Best Practices").

### 1. Walidacja Zmiennych Środowiskowych (Type-safe Env)

Nigdy nie używaj `process.env.SECRET` bezpośrednio w kodzie. Jeśli zapomnisz dodać zmiennej w `.env`, aplikacja wybuchnie w losowym momencie.
Użyj biblioteki `zod` lub `@t3-oss/env-nextjs`, aby zwalidować środowisko przy starcie.

**Przykład pliku `src/env.mjs`:**

```javascript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
```

Dzięki temu masz pewność, że jeśli aplikacja wstała, to jest bezpieczna konfiguracyjnie.

### 2. Szablony Pull Request (Code Review Standards)

Aby wymusić na programistach sprawdzanie własnego kodu przed oddaniem do review, utwórz plik `.github/pull_request_template.md`.

**Przykładowa zawartość:**

```markdown
## Opis zmian

Co zostało zmienione i dlaczego?

## Checklist

- [ ] Testy jednostkowe przechodzą (npm run test:unit)
- [ ] Testy E2E przechodzą lokalnie
- [ ] Nowe funkcje mają dodane testy
- [ ] Zmienne środowiskowe zostały zaktualizowane (jeśli dotyczy)
- [ ] Brak sekretów/kluczy w kodzie
```

### 3. Automatyczne aktualizacje zależności

Skonfiguruj **Dependabot** lub **Renovate**, aby automatycznie podbijał wersje bibliotek (szczególnie tych z łatkami bezpieczeństwa).
