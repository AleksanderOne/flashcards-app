/**
 * Hook do zarządzania wersją aplikacji
 *
 * Sprawdza czy wersja aplikacji się zmieniła i czyści lokalne dane
 * jeśli potrzeba (po deploy nowej wersji).
 */

import { useEffect, useState } from "react";

// Wersja z package.json (build time)
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
const STORAGE_KEY = "app-version";

interface VersionCheckResult {
  currentVersion: string;
  previousVersion: string | null;
  wasUpdated: boolean;
}

/**
 * Hook sprawdzający wersję aplikacji.
 * Przy zmianie wersji automatycznie czyści localStorage i sessionStorage.
 */
export function useAppVersion(): VersionCheckResult {
  const [result, setResult] = useState<VersionCheckResult>({
    currentVersion: APP_VERSION,
    previousVersion: null,
    wasUpdated: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousVersion = localStorage.getItem(STORAGE_KEY);

    // Wersja się zmieniła lub pierwsza wizyta
    if (previousVersion && previousVersion !== APP_VERSION) {
      console.log(
        `[App Version] Wykryto aktualizację: ${previousVersion} -> ${APP_VERSION}`,
      );

      // Wyczyść lokalne dane (ale nie sso-session - to ciasteczko)
      const keysToPreserve = ["theme", "sidebar-state", "cookie-consent"];
      const preservedData: Record<string, string | null> = {};

      // Zachowaj ważne ustawienia
      keysToPreserve.forEach((key) => {
        preservedData[key] = localStorage.getItem(key);
      });

      // Wyczyść wszystko
      localStorage.clear();
      sessionStorage.clear();

      // Przywróć zachowane ustawienia
      keysToPreserve.forEach((key) => {
        const value = preservedData[key];
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      // Zapisz nową wersję
      localStorage.setItem(STORAGE_KEY, APP_VERSION);

      setResult({
        currentVersion: APP_VERSION,
        previousVersion,
        wasUpdated: true,
      });
    } else if (!previousVersion) {
      // Pierwsza wizyta - zapisz wersję
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      setResult({
        currentVersion: APP_VERSION,
        previousVersion: null,
        wasUpdated: false,
      });
    }
  }, []);

  return result;
}

/**
 * Komponent do inicjalizacji sprawdzania wersji w root layout
 */
export function AppVersionCheck() {
  const { wasUpdated, previousVersion, currentVersion } = useAppVersion();

  useEffect(() => {
    if (wasUpdated) {
      console.log(
        `[App Version] Dane lokalne zostały wyczyszczone po aktualizacji z ${previousVersion} do ${currentVersion}`,
      );
    }
  }, [wasUpdated, previousVersion, currentVersion]);

  return null;
}
