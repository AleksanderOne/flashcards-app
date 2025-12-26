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

Skonfiguruj `vitest.config.ts` w zależności od frameworka (np. React/Next.js).

## 6. Weryfikacja

1. Spróbuj zrobić commit ze złą wiadomością (np. "fix sth") -> powinno zostać odrzucone przez `commitlint`.
2. Spróbuj zrobić commit z poprawną wiadomością (np. "fix: poprawa logowania") -> powinny uruchomić się testy jednostkowe.
3. Spróbuj zrobić push -> powinny uruchomić się testy coverage, build i e2e.
