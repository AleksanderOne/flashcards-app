'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateNameSchema } from '@/lib/validations/user';

// Typ dla ujednoliconego zwracania wyników akcji
export type ActionResult<T = void> =
    | { success: true; data?: T; message?: string }
    | { success: false; error: string };

/**
 * Aktualizuje nazwę użytkownika.
 * Dane wejściowe są walidowane przez schemat Zod.
 */
export async function updateUserName(rawName: unknown): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Nie jesteś zalogowany' };

    // Walidacja danych wejściowych
    const validationResult = updateNameSchema.safeParse({ name: rawName });
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        return { success: false, error: firstError?.message || 'Nieprawidłowa nazwa' };
    }
    const { name } = validationResult.data;

    try {
        await db.update(users)
            .set({ name })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');

        return { success: true, message: 'Nazwa została zaktualizowana' };
    } catch (error) {
        console.error('Błąd podczas aktualizacji nazwy:', error);
        return { success: false, error: 'Nie udało się zaktualizować nazwy' };
    }
}

/**
 * Aktualizacja email jest ZABLOKOWANA.
 * 
 * Email jest synchronizowany z centrum logowania SSO.
 * Zmiana emaila musi być wykonana w centrum logowania, a następnie
 * zostanie automatycznie zsynchronizowana przy następnym logowaniu.
 * 
 * Powód: SSO callback szuka użytkowników po emailu. Gdyby email
 * mógł być zmieniony lokalnie, użytkownik straciłby dostęp
 * do swojego konta po ponownym zalogowaniu przez SSO.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateUserEmail(_rawEmail: string): Promise<ActionResult> {
    return {
        success: false,
        error: 'Zmiana adresu email jest możliwa tylko w centrum logowania. Po zmianie w centrum, email zostanie automatycznie zaktualizowany przy następnym logowaniu.'
    };
}

// UWAGA: Funkcja updateUserPassword została usunięta
// Logowanie odbywa się przez SSO centrum logowania - hasła nie są przechowywane w flashcards-app

