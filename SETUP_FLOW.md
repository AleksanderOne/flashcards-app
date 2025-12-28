# Flashcards App - Setup & Bootstrap Flow

## 1. Problem First Run (Jajko i Kura)

Aby zalogować się do aplikacji (i wejść do panelu admina), aplikacja musi być połączona z Centrum Logowania (SSO).
Jednak nowa instancja aplikacji nie ma jeszcze konfiguracji (API Key, Project Slug, URL), więc logowanie nie zadziała.

## 2. Rozwiązanie: Publiczny Setup (/setup)

Wdrożyliśmy mechanizm "Bootstrap", który wykrywa nie skonfigurowaną aplikację i pozwala na jej inicjalizację.

### Flow Użytkownika

1. **Wejście na stronę główną (`/`)**:
   - Aplikacja sprawdza, czy istnieje konfiguracja SSO (w bazie danych).
   - Jeśli **TAK**: Wyświetla stronę główną / logowanie.
   - Jeśli **NIE**: Automatycznie przekierowuje na `/setup`.

2. **Strona `/setup`**:
   - Jest to publiczna strona dostępna tylko dla nieskonfigurowanych aplikacji.
   - Użytkownik widzi formularz proszący o **Setup Code**.
   - Setup Code generuje się w panelu **Centrum Logowania** (w ustawieniach projektu).

3. **Konfiguracja**:
   - Użytkownik wkleja kod i klika "Połącz".
   - Aplikacja w tle łączy się z Centrum Logowania (`POST /api/v1/projects/claim`).
   - Otrzymuje `apiKey`, `projectSlug` i `centerUrl`.
   - Zapisuje te dane w bazie (`sso_config`).

4. **Koniec Setupu**:
   - Po sukcesie, użytkownik jest przekierowywany na stronę główną (`/`).
   - Teraz mechanizm SSO działa, można się zalogować.

## 3. Zarządzanie Konfiguracją (Admin)

Po zalogowaniu jako Administrator:

- Dostępna jest zakładka **Konfiguracja SSO** (`/admin/sso-setup`).
- Można tam podejrzeć status połączenia.
- Dostępny jest przycisk **Rozłącz**, który usuwa konfigurację z bazy (przywracając stan "nieskonfigurowany").
  - Po rozłączeniu aplikacja przestanie działać dla użytkowników (błąd logowania) i przy próbie wejścia przekieruje admina na `/setup`.

## 4. Bezpieczeństwo

- Endpoint `/api/setup` blokuje próbę nadpisania konfiguracji, jeśli ta już istnieje (można ją zmienić tylko z panelu admina po uwierzytelnieniu).
- Endpoint `/api/admin/sso-setup` (DELETE/POST) wymaga sesji administratora.
- Middleware i hooki dbają o przekierowania.
