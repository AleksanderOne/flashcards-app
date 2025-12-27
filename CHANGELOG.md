# [1.2.0](https://github.com/AleksanderOne/flashcards-app/compare/v1.1.0...v1.2.0) (2025-12-27)


### Bug Fixes

* **lint:** naprawienie wszystkich ESLint warnings ([aadf166](https://github.com/AleksanderOne/flashcards-app/commit/aadf1669a94b9c814db201d3fec29fef9b068dc4))


### Features

* **e2e:** automatyczne wykrywanie wolnego portu przez globalSetup ([7c557db](https://github.com/AleksanderOne/flashcards-app/commit/7c557dbedf745a09b109850c8176e307c7ada62f))

# [1.1.0](https://github.com/AleksanderOne/flashcards-app/compare/v1.0.0...v1.1.0) (2025-12-27)


### Features

* **e2e:** dynamiczny port dla testów E2E z automatycznym wykrywaniem ([763c00d](https://github.com/AleksanderOne/flashcards-app/commit/763c00de1654d9f9f6036c5587b5fb8e41fa33a0))
* **security:** dodanie walidacji Zod dla akcji nauki ([cf94fb3](https://github.com/AleksanderOne/flashcards-app/commit/cf94fb3258e98b510aec4e69d9fc2dfd1c0a2fdb))


### Performance Improvements

* **db:** optymalizacja bazy danych i usunięcie pola password ([c77565c](https://github.com/AleksanderOne/flashcards-app/commit/c77565cdc49c963ad74a98ee78b505b20d0c87f8))

# 1.0.0 (2025-12-27)


### Bug Fixes

* **build:** naprawa błędów typowania, charts i problemów z buildem ([15c578d](https://github.com/AleksanderOne/flashcards-app/commit/15c578d268e937753fec3a4e225709c2afa7b0bb))
* **build:** obsługa braku bazy danych podczas budowania aplikacji (graceful degradation) ([7b5a4da](https://github.com/AleksanderOne/flashcards-app/commit/7b5a4dac9568fc4c21928665431f23102f123230))
* **db:** dodanie brakującego pola totalSessions do statystyk i migracja ([7474904](https://github.com/AleksanderOne/flashcards-app/commit/747490424c798607ad2ac9638812a61557f53b0f))
* dodano walidację parametru quality (0-5) w algorytmie SM-2 dla bezpieczeństwa ([3704ed2](https://github.com/AleksanderOne/flashcards-app/commit/3704ed2328f58410a24f573ae9a0a0003ce674ff))
* **eslint:** systematyczna naprawa błędów ESLint i typowania ([dc61cf9](https://github.com/AleksanderOne/flashcards-app/commit/dc61cf9445aabbe2d89d4ecfa4d6b79def905c05))
* naprawa błędów ESLint i TypeScript ([0ff3e5b](https://github.com/AleksanderOne/flashcards-app/commit/0ff3e5bdfdea45a2961f68e17a967f60e17add97))
* naprawiono ERR_TOO_MANY_REDIRECTS na Vercel - split config dla Edge Runtime (proxy bez adaptera bazodanowego) ([b49e43b](https://github.com/AleksanderOne/flashcards-app/commit/b49e43b41a6e6891f3a693f8d3cd08ece9ce86a7))
* naprawiono SelectItem empty value po aktualizacji radix-ui, zaktualizowano testy e2e i konfigurację playwright ([d4bff20](https://github.com/AleksanderOne/flashcards-app/commit/d4bff2087a86d046177d34a20fa16512bfc8688c))
* **security:** Zablokowanie zmiany emaila lokalnie (synchronizacja z SSO) ([4970f97](https://github.com/AleksanderOne/flashcards-app/commit/4970f974baf1e43b5dd0457b04c38dad1746d587))
* usunięcie hardcoded secret aby umożliwić autowykrywanie AUTH_SECRET na Vercel ([89cbad5](https://github.com/AleksanderOne/flashcards-app/commit/89cbad5b14b5cf82eb699042a42472312b0a090c))
* usunięcie odnośników do rejestracji ([f04d5fe](https://github.com/AleksanderOne/flashcards-app/commit/f04d5fef4624c883cf6577cebdb6a8cee819160d))


### Features

* **admin:** dodanie panelu administratora i zarządzania użytkownikami ([f7e2210](https://github.com/AleksanderOne/flashcards-app/commit/f7e2210c22880a6b039aecbfb242bcf25dbcfa19))
* **auth:** implementacja Kill Switch - wylogowanie ze wszystkich urządzeń ([efd17de](https://github.com/AleksanderOne/flashcards-app/commit/efd17de89ee2db9d4400786488407efbfd595c1a))
* **auth:** integracja SSO z Centrum Logowania ([08d3e2b](https://github.com/AleksanderOne/flashcards-app/commit/08d3e2b2357536c923483b500cdff7fcd7e24073))
* **auth:** przekierowanie na stronę docelową po zalogowaniu SSO ([ccf5ac1](https://github.com/AleksanderOne/flashcards-app/commit/ccf5ac10a2fb528e3090a7e94a860efb352b12c0))
* **auth:** zunifikowana funkcja auth() dla NextAuth i SSO ([df5b286](https://github.com/AleksanderOne/flashcards-app/commit/df5b286f77ce847076020879d5f76b41acbc50e2))
* **db:** rozszerzenie schematu bazy danych o statystyki i osiągnięcia ([5f4d432](https://github.com/AleksanderOne/flashcards-app/commit/5f4d432334a4d5953f618e5e5ac669182845be66))
* dodanie dynamicznego favicoana (Next.js ImageResponse) ([3f612c4](https://github.com/AleksanderOne/flashcards-app/commit/3f612c4a57c3824604213cd4826289fe113e7fa1))
* **learn:** wdrożenie nowego modułu nauki i powtórek ([5754d07](https://github.com/AleksanderOne/flashcards-app/commit/5754d0790e7550f67621353be97c32585d0dab60))
* migracja z NextAuth na autoryzację SSO ([f9f32ae](https://github.com/AleksanderOne/flashcards-app/commit/f9f32ae2702bd57ebc9f8688d475e98265323d4b))
* **security:** Dodanie autoryzacji do API /api/words ([eb3c7e8](https://github.com/AleksanderOne/flashcards-app/commit/eb3c7e820373742ad0f57c201dae58ae4ae88e8f))
* **security:** Dodanie CSP i security headers ([71c4315](https://github.com/AleksanderOne/flashcards-app/commit/71c4315c56cb3a589119c7e3f36be1f755fc6805))
* **security:** Dodanie walidacji Zod do Server Actions ([6416c3d](https://github.com/AleksanderOne/flashcards-app/commit/6416c3dd1af2da026776e7ae3966fc92c95e2437))
* **security:** Fail-closed dla krytycznych operacji admina ([e2a652d](https://github.com/AleksanderOne/flashcards-app/commit/e2a652d6cb213d86fb39b95d6e6fb2546065ce84))
* **security:** Implementacja Rate Limiting (hybrydowe rozwiązanie) ([3cc972c](https://github.com/AleksanderOne/flashcards-app/commit/3cc972c48548d2d1f610ac7054f6f5e2e3f9221b))
* **settings:** dodanie ustawień profilu i formularza kontaktowego ([71f037c](https://github.com/AleksanderOne/flashcards-app/commit/71f037ca916673bcea7d9162a6b3f03045c26078))
* **stats:** dodanie wykresów statystyk i systemu osiągnięć ([e265225](https://github.com/AleksanderOne/flashcards-app/commit/e2652255455d924595537f09f191dc31a8b9ca77))
* **ui:** dodanie numeru wersji v0.1.0 do stopki ([dcc2217](https://github.com/AleksanderOne/flashcards-app/commit/dcc221715ecac5f659a52294d6764f71b5923da9))
* **ui:** implementacja spójnego layoutu aplikacji i loadera ([7415fb4](https://github.com/AleksanderOne/flashcards-app/commit/7415fb40aeaa92b3252035689c3d6cb88173b236))
* **words:** implementacja nieskończonego przewijania listy słówek ([0915c2f](https://github.com/AleksanderOne/flashcards-app/commit/0915c2f9e30810421375427092c520675808cfe6))


### Performance Improvements

* dodano indeksy bazy danych na tabeli words (level, category, isApproved, english) dla szybszego wyszukiwania ([21773a8](https://github.com/AleksanderOne/flashcards-app/commit/21773a8a51c80f6559c3918a10011b15576bf145))
* uproszczenie checkIsAdmin() - usunięto zbędne zapytanie do bazy (rola jest w JWT tokenie) ([095589c](https://github.com/AleksanderOne/flashcards-app/commit/095589c5e1f68da7b85aa8525277901371ec3add))
