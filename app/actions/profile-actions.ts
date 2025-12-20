'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';

/**
 * Aktualizuje nazwę użytkownika
 */
export async function updateUserName(name: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    if (!name || name.trim().length === 0) {
        throw new Error('Nazwa nie może być pusta');
    }

    try {
        await db.update(users)
            .set({ name: name.trim() })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');

        return { success: true, message: 'Nazwa została zaktualizowana' };
    } catch (error) {
        console.error('Błąd podczas aktualizacji nazwy:', error);
        throw new Error('Nie udało się zaktualizować nazwy');
    }
}

/**
 * Aktualizuje email użytkownika
 */
export async function updateUserEmail(email: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    if (!email || !email.includes('@')) {
        throw new Error('Nieprawidłowy adres email');
    }

    // Sprawdzenie czy podany email jest już zajęty
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase())
    });

    if (existingUser && existingUser.id !== session.user.id) {
        throw new Error('Ten adres email jest już używany');
    }

    try {
        await db.update(users)
            .set({ email: email.toLowerCase() })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');

        return { success: true, message: 'Email został zaktualizowany' };
    } catch (error) {
        console.error('Błąd podczas aktualizacji emaila:', error);
        throw new Error('Nie udało się zaktualizować emaila');
    }
}

/**
 * Zmienia hasło użytkownika
 */
export async function updateUserPassword(data: { currentPassword: string; newPassword: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const { currentPassword, newPassword } = data;

    if (!newPassword || newPassword.length < 8) {
        throw new Error('Nowe hasło musi mieć minimum 8 znaków');
    }

    // Pobranie danych użytkownika wraz z hasłem
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { id: true, password: true }
    });

    if (!user) {
        throw new Error('Użytkownik nie znaleziony');
    }

    // Weryfikacja starego hasła (jeśli użytkownik nie korzysta wyłącznie z logowania społecznościowego)
    if (user.password) {
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            throw new Error('Aktualne hasło jest nieprawidłowe');
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
        throw new Error('Nie udało się zmienić hasła');
    }
}
