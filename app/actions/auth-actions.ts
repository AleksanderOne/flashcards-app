"use server";

import { clearSSOSession } from "@/lib/sso-client";
import { redirect } from "next/navigation";

/**
 * Wylogowanie - czyści sesję SSO
 *
 * Działa bezpośrednio z flashcards-app - nie wymaga wchodzenia do centrum logowania.
 * Sesja w centrum pozostaje aktywna (użytkownik nadal zalogowany w centrum).
 */
export async function logout() {
  console.log("[AUTH-ACTION] logout() wywołane");

  // Czyścimy sesję SSO (ciasteczko)
  await clearSSOSession();

  console.log("[AUTH-ACTION] clearSSOSession() zakończone, przekierowuję...");

  // Przekierowujemy na stronę logowania
  redirect("/login");
}
