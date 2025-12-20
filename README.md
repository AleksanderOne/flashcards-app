# 🎓 Flashcards - Aplikacja do Nauki Angielskiego

Profesjonalna platforma edukacyjna do nauki języka angielskiego, wykorzystująca zaawansowany algorytm powtórek (Spaced Repetition), poziomy CEFR (A1-C1) oraz elementy grywalizacji.

## ✨ Główne Funkcjonalności

### 🧠 Inteligentna Nauka
- **Algorytm SM-2**: Optymalizacja procesu zapamiętywania poprzez inteligentne planowanie powtórek (Spaced Repetition).
- **Poziomy CEFR**: Słówka podzielone na poziomy trudności od A1 do C1.
- **Różnorodne Tryby Nauki**:
  - ✍️ **Pisanie**: Ćwiczenie pisowni (PL ↔ EN).
  - 🧩 **Skojarzenia**: Nauka z wykorzystaniem obrazów (integracja z Pixabay).
  - 🗣️ **Wymowa**: Ćwiczenie wymowy z wykorzystaniem Web Speech API.

### 📊 Analityka i Postępy
- **Statystyki**: Szczegółowe wykresy postępów, czasu nauki i opanowanego materiału.
- **Daily Streak**: Motywujący system ciągłości nauki.
- **Osiągnięcia**: System odznak nagradzający regularność i wyniki.

### 🛡️ Bezpieczeństwo i Technologia
- **Autentykacja**: Bezpieczne logowanie przez Email/Hasło lub Google OAuth.
- **Wydajność**: Zoptymalizowana baza danych i caching po stronie serwera.
- **Responsywność**: Pełne wsparcie dla urządzeń mobilnych i desktopowych (PWA ready).
- **Dostępność**: Tryb jasny i ciemny (Dark Mode).

---

## 🛠️ Stack Technologiczny

Projekt zbudowany w oparciu o nowoczesne standardy webowe:

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI)
- **Backend / API**: Next.js Server Actions
- **Baza Danych**: PostgreSQL (Vercel Postgres), Drizzle ORM
- **Autentykacja**: NextAuth.js v5
- **Inne**: Recharts, Zod, React Hook Form

---

## 🚀 Instalacja i Konfiguracja

### 1. Wymagania wstępne
- Node.js 18+
- Baza danych PostgreSQL (lokalna lub w chmurze, np. Vercel/Neon)

### 2. Instalacja zależności

```bash
git clone https://github.com/twoj-login/flashcards-app.git
cd flashcards-app
npm install
```

### 3. Konfiguracja zmiennych środowiskowych

Utwórz plik `.env.local` w głównym katalogu projektu i uzupełnij go według wzoru:

```bash
# Baza Danych
DATABASE_URL="postgres://uzytkownik:haslo@host:5432/nazwa_bazy"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="wygeneruj_komenda_openssl_rand_base64_32"

# Google OAuth (Opcjonalne)
GOOGLE_CLIENT_ID="twoj_client_id"
GOOGLE_CLIENT_SECRET="twoj_client_secret"

# Integracje (Opcjonalne)
PIXABAY_API_KEY="twoj_klucz_pixabay"
```

### 4. Inicjalizacja bazy danych

Wykonaj migracje, aby utworzyć schemat bazy danych:

```bash
npm run db:push
```

### 5. Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktura Projektu

- `/app` - Główny katalog aplikacji (Next.js App Router).
  - `(auth)` - Logika logowania i rejestracji.
  - `(dashboard)` - Część chroniona aplikacji (nauka, statystyki, panel admina).
- `/lib` - Biblioteki pomocnicze (konfiguracja DB, Auth, algorytmy).
  - `db/schema.ts` - Definicja schematu bazy danych.
  - `spaced-repetition.ts` - Implementacja algorytmu SM-2.
- `/components` - Komponenty interfejsu (UI).
- `/data` - Pliki seedujące i dane statyczne.

---

## 🤝 Rozwój (Development)

Aplikacja jest gotowa do łatwej rozbudowy. Główne obszary do dalszego rozwoju to:

- Dodawanie nowych zestawów słówek (poprzez Panel Admina lub pliki seed).
- Rozbudowa modułu statystyk.
- Implementacja trybu multiplayer/wyzwań.

---

## 📄 Licencja

Projekt udostępniony na licencji MIT.
