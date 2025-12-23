'use server';

import { signOut } from '@/lib/auth';
import { clearSSOSession } from '@/lib/sso-session';
import { redirect } from 'next/navigation';

/**
 * Wylogowanie - czyści zarówno NextAuth jak i SSO session
 * 
 * Działa bezpośrednio z flashcards-app - nie wymaga wchodzenia do centrum logowania.
 * Sesja w centrum pozostaje aktywna (użytkownik nadal zalogowany w centrum).
 */
export async function logout() {
    // Czyścimy sesję SSO (ciasteczko)
    await clearSSOSession();

    // Wylogowujemy z NextAuth (jeśli była taka sesja)
    try {
        await signOut({ redirect: false });
    } catch {
        // Ignorujemy błędy NextAuth (może nie być sesji)
    }

    // Przekierowujemy na stronę logowania
    redirect('/login');
}

