"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Shield, LogIn, Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Pobieranie wartości ciasteczka po stronie klienta
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

/**
 * Wewnętrzny komponent logowania, który używa useSearchParams
 * Musi być owinięty w Suspense boundary (wymagane przez Next.js 16)
 */
function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ssoHealthy, setSsoHealthy] = useState<boolean | null>(null);
  const [showReconfigure, setShowReconfigure] = useState(false);
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV === "development";

  // Stan dla inputa portu dev
  const [devPort, setDevPort] = useState("");

  useEffect(() => {
    // Inicjalizacja portu z ciasteczka
    const port = getCookie("dev-sso-port");
    if (port) setDevPort(port);
  }, []);

  // Sprawdzenie health SSO przy ładowaniu strony
  useEffect(() => {
    async function checkSSOHealth() {
      try {
        const response = await fetch("/api/sso-health");
        const data = await response.json();
        setSsoHealthy(data.healthy);
        // Pokaż przycisk rekonfiguracji jeśli SSO nie działa
        if (!data.healthy) {
          setShowReconfigure(true);
        }
      } catch {
        setSsoHealthy(false);
        setShowReconfigure(true);
      }
    }
    checkSSOHealth();
  }, []);

  // Obsługa błędów z callbacku SSO
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_code: "Brak kodu autoryzacji. Spróbuj ponownie.",
        invalid_code: "Kod autoryzacji jest nieprawidłowy lub wygasł.",
        blocked: "Twoje konto zostało zablokowane.",
        server_error: "Błąd serwera. Spróbuj ponownie później.",
        project_not_found: "Projekt nie istnieje w centrum logowania.",
      };
      setError(errorMessages[errorParam] || "Wystąpił nieznany błąd.");
      // Pokaż przycisk rekonfiguracji przy błędzie
      setShowReconfigure(true);
    }
  }, [searchParams]);

  const handleSSOLogin = () => {
    setIsLoading(true);
    setError("");

    // Przekierowanie do centrum logowania
    const baseUrl = window.location.origin;

    // Sprawdzamy czy jest callbackUrl w parametrach (np. z middleware)
    // albo używamy pathname przed logowaniem, albo domyślnie /learn
    const returnTo = searchParams.get("callbackUrl") || "/learn";

    // Zapisujemy stronę docelową w ciasteczku (API route może je odczytać)
    document.cookie = `sso-return-url=${encodeURIComponent(returnTo)}; path=/; max-age=300; SameSite=Lax`;

    const callbackUrl = encodeURIComponent(`${baseUrl}/api/auth/sso-callback`);

    // Pobieramy konfigurację
    let centerUrl =
      process.env.NEXT_PUBLIC_SSO_CENTER_URL ||
      "https://centrum-logowania-app-y7gt.vercel.app";
    const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "flashcards-uk61";

    // DEV: Nadpisanie URL jeśli zdefiniowano port w ciasteczku
    if (isDev) {
      const devPortCookie = getCookie("dev-sso-port");
      if (devPortCookie) {
        centerUrl = `http://localhost:${devPortCookie}`;
      }
    }

    const ssoUrl = `${centerUrl}/authorize?client_id=${clientId}&redirect_uri=${callbackUrl}`;
    console.log("Redirecting to SSO:", ssoUrl);

    window.location.href = ssoUrl;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <Card className="border-0 shadow-2xl">
        <CardHeader className="space-y-1 relative">
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4">
              <span className="text-4xl">🎓</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            Witaj ponownie!
          </CardTitle>
          <CardDescription className="text-center text-base">
            Zaloguj się, aby kontynuować naukę
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Główny przycisk logowania SSO */}
          <Button
            type="button"
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/30 dark:shadow-violet-900/30"
            onClick={handleSSOLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Przekierowuję...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Zaloguj przez Centrum
              </>
            )}
          </Button>

          {/* Informacja o bezpieczeństwie */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-muted">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Bezpieczne logowanie
              </p>
              <p>
                Logowanie odbywa się przez Centrum Logowania z wykorzystaniem
                uwierzytelniania Google. Twoje hasło nigdy nie jest
                przechowywane w tej aplikacji.
              </p>
            </div>
          </div>

          {/* Przycisk rekonfiguracji SSO - widoczny gdy problemy z połączeniem */}
          {showReconfigure && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Problemy z logowaniem?
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                {ssoHealthy === false
                  ? "Nie można połączyć się z centrum logowania. Możesz skonfigurować połączenie ponownie."
                  : "Jeśli logowanie nie działa, możesz zrekonfigurować połączenie SSO."}
              </p>
              <Link href="/setup" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Rekonfiguruj SSO
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel deweloperski do zmiany portu */}
      {isDev && (
        <Card className="border-dashed border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-mono text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
              🛠️ Developer Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 pt-0">
            <form
              action={async (formData) => {
                // Dynamiczny import akcji serwerowej, aby uniknąć problemów w buildzie produkcyjnym
                const { setDevSSOPort } =
                  await import("@/app/actions/dev-actions");
                await setDevSSOPort(formData);
              }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">
                  Lokalny Port Centrum Logowania
                </label>
                <input
                  type="number"
                  name="port"
                  placeholder="np. 3001"
                  defaultValue={devPort}
                  className="w-full text-sm px-3 py-2 rounded-md border bg-background"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="mt-5"
              >
                Zapisz
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2">
              Wpisz port lokalnego centrum (np. 3001). Puste pole przywraca ENV.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Fallback podczas ładowania (Suspense boundary)
 */
function LoginFallback() {
  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4">
            <span className="text-4xl">🎓</span>
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
          Witaj ponownie!
        </CardTitle>
        <CardDescription className="text-center text-base">
          Ładowanie...
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </CardContent>
    </Card>
  );
}

/**
 * Strona logowania przez SSO (Centrum Logowania)
 *
 * Flow:
 * 1. Użytkownik klika "Zaloguj przez Centrum"
 * 2. Redirect do centrum-logowania/authorize
 * 3. Centrum loguje przez Google
 * 4. Centrum przekierowuje z tokenem do /api/auth/sso-callback
 * 5. Callback weryfikuje token i tworzy lokalną sesję
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
