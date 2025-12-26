---
description: Konfiguracja git hooks do automatycznego sprawdzania przed commit/push
---

# Git Hooks - Automatyczne sprawdzanie jakości kodu

Projekt używa **Husky** do automatycznego uruchamiania sprawdzeń przed commitem i pushem.

## Struktura sprawdzeń

### Pre-commit (przed każdym commitem) - szybkie

Uruchamia się automatycznie przy `git commit`:

1. **Lint-staged** - uruchamia `eslint --fix` i `prettier --write` tylko na zmienionych plikach.
2. **Testy jednostkowe** - vitest (`npm run test:unit`)

Czas: ~10-30 sekund (zależy od ilości zmian)

### Commit-msg (weryfikacja wiadomości)

Sprawdza czy wiadomość commita jest zgodna ze standardem **Conventional Commits**.
Przykłady: `feat: dodanie logowania`, `fix: naprawa błędu`, `chore: aktualizacja bibliotek`.

### Pre-push (przed pushem) - pełne

Uruchamia się automatycznie przy `git push`:

1. **Test Coverage** - sprawdza pokrycie kodu testami.
2. **Build produkcyjny** - Next.js (`npm run build`).
3. **Testy E2E** - Playwright (`npm run test:e2e`).

Czas: ~1-3 minuty

## Pliki konfiguracyjne

- `.husky/pre-commit`
- `.husky/pre-push`
- `.husky/commit-msg`
- `.lintstagedrc.json` - konfiguracja lint-staged
- `commitlint.config.js` - konfiguracja commitlint (Conventional Commits)
- `.releaserc.json` - konfiguracja semantic-release

## Dostępne skrypty npm

```bash
# Szybkie testy (vitest)
npm run test:unit

# Test coverage
npm run test:coverage

# Testy E2E (playwright)
npm run test:e2e

# Pełna walidacja (typecheck + lint + unit + build)
npm run validate

# Formatowanie kodu
npm run format

# Lintowanie z automatyczną naprawą
npm run lint:fix
```

## Jak to działa w praktyce?

1. **Piszesz kod** -> `git add .`
2. **Robisz commit** -> `git commit -m "feat: nowa funkcja"`
   - Uruchamia się `pre-commit`: formatuje kod, sprawdza linter, puszcza testy unit.
   - Uruchamia się `commit-msg`: sprawdza czy "feat: ..." jest poprawne.
3. **Wypychasz zmiany** -> `git push`
   - Uruchamia się `pre-push`: sprawdza coverage, robi build, puszcza testy E2E.

To zapewnia, że do repozytorium trafia tylko czysty, przetestowany i działający kod.
