---
description: Konfiguracja git hooks do automatycznego sprawdzania przed commit/push
---

# Git Hooks - Automatyczne sprawdzanie jakości kodu

Projekt używa **Husky** do automatycznego uruchamiania sprawdzeń przed commitem i pushem.

## Struktura sprawdzeń

### Pre-commit (przed każdym commitem) - szybkie
Uruchamia się automatycznie przy `git commit`:

1. **ESLint** - sprawdzanie jakości kodu
2. **TypeScript** - sprawdzanie typów (`tsc --noEmit`)
3. **Testy jednostkowe** - vitest (`npm run test:unit`)

Czas: ~10-30 sekund

### Pre-push (przed pushem) - pełne
Uruchamia się automatycznie przy `git push`:

1. **Testy E2E** - Playwright (`npm run test:e2e`)
2. **Build produkcyjny** - Next.js (`npm run build`)

Czas: ~1-3 minuty

## Pliki konfiguracyjne

- `.husky/pre-commit` - hook pre-commit
- `.husky/pre-push` - hook pre-push

## Dostępne skrypty npm

```bash
# Szybkie testy (vitest)
npm run test:unit

# Testy E2E (playwright)
npm run test:e2e

# Wszystkie testy
npm run test:all

# Build produkcyjny
npm run build

# Lint
npm run lint
```

## Ręczne uruchomienie wszystkich sprawdzeń

Jeśli chcesz ręcznie uruchomić pełne sprawdzenie przed commitem:

```bash
# 1. Lint
npm run lint

# 2. TypeScript
npx tsc --noEmit

# 3. Testy jednostkowe
npm run test:unit

# 4. Testy E2E
npm run test:e2e

# 5. Build produkcyjny
npm run build
```

Lub jedno polecenie:

```bash
npm run lint && npx tsc --noEmit && npm run test:all && npm run build
```

## Pominięcie hooków (w pilnych przypadkach)

⚠️ **NIE ZALECANE** - używaj tylko w wyjątkowych sytuacjach:

```bash
# Pomiń pre-commit
git commit --no-verify -m "wiadomość"

# Pomiń pre-push
git push --no-verify
```

## Rozwiązywanie problemów

### Hook nie działa
```bash
# Reinstalacja husky
npm run prepare
```

### Błąd uprawnień
```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

## Dlaczego taka struktura?

| Hook | Sprawdzenie | Powód |
|------|-------------|-------|
| pre-commit | lint, ts, unit | Szybkie - nie blokują pracy |
| pre-push | e2e, build | Wolne ale kluczowe przed deployem |

Dzięki temu:
- Commity są szybkie (~30s)
- Push gwarantuje że kod się buduje i wszystkie testy przechodzą
- Vercel nie dostanie zepsutego kodu
