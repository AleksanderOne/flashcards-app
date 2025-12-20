'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';

// Typ dla ujednoliconego zwracania wyników akcji
export type ActionResult<T = void> =
    | { success: true; data?: T; message?: string }
    | { success: false; error: string };

/**
 * Aktualizuje nazwę użytkownika
 */
export async function updateUserName(name: string): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Nie jesteś zalogowany' };

    if (!name || name.trim().length === 0) {
        return { success: false, error: 'Nazwa nie może być pusta' };
    }

    try {
        await db.update(users)
            .set({ name: name.trim() })
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

/**
 * Zmienia hasło użytkownika
 */
export async function updateUserPassword(data: { currentPassword: string; newPassword: string }): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Nie jesteś zalogowany' };

    const { currentPassword, newPassword } = data;

    if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'Nowe hasło musi mieć minimum 8 znaków' };
    }

    // Pobranie danych użytkownika wraz z hasłem
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { id: true, password: true }
    });

    if (!user) {
        return { success: false, error: 'Użytkownik nie znaleziony' };
    }

    // Weryfikacja starego hasła (jeśli użytkownik nie korzysta wyłącznie z logowania społecznościowego)
    if (user.password) {
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return { success: false, error: 'Aktualne hasło jest nieprawidłowe' };
        }
    }

    try {
        const hashedPassword = await hash(newPassword, 10);

        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');

        return { success: true, message: 'Hasło zostało zmienione' };
    } catch (error) {
        console.error('Błąd podczas aktualizacji hasła:', error);
        return { success: false, error: 'Nie udało się zmienić hasła' };
    }
}
