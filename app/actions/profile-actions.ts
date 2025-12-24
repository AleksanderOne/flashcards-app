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
 * Aktualizuje email użytkownika
 * 
 * UWAGA: Zmiana emaila może powodować problemy z synchronizacją z centrum logowania.
 * Email w lokalnej bazie może się różnić od emaila w centrum.
 */
export async function updateUserEmail(email: string): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Nie jesteś zalogowany' };

    if (!email || !email.includes('@')) {
        return { success: false, error: 'Nieprawidłowy adres email' };
    }

    // Sprawdzenie czy podany email jest już zajęty
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase())
    });

    if (existingUser && existingUser.id !== session.user.id) {
        return { success: false, error: 'Ten adres email jest już używany' };
    }

    try {
        await db.update(users)
            .set({ email: email.toLowerCase() })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');

        return { success: true, message: 'Email został zaktualizowany' };
    } catch (error) {
        console.error('Błąd podczas aktualizacji emaila:', error);
        return { success: false, error: 'Nie udało się zaktualizować emaila' };
    }
}

// UWAGA: Funkcja updateUserPassword została usunięta
// Logowanie odbywa się przez SSO centrum logowania - hasła nie są przechowywane w flashcards-app
