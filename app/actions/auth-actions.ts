'use server';

import { clearSSOSession } from '@/lib/sso-client';
import { redirect } from 'next/navigation';

/**
 * Wylogowanie - czyści sesję SSO
 * 
 * Działa bezpośrednio z flashcards-app - nie wymaga wchodzenia do centrum logowania.
 * Sesja w centrum pozostaje aktywna (użytkownik nadal zalogowany w centrum).
 */
export async function logout() {
    // Czyścimy sesję SSO (ciasteczko)
    await clearSSOSession();

    // Przekierowujemy na stronę logowania
    redirect('/login');
}

