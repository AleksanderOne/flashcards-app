'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
    deleteUserData as deleteUserDataAction,
    deleteUserHistory as deleteUserHistoryAction,
    resetUserProgress as resetUserProgressAction
} from '@/app/actions/user-data-actions';

/**
 * Sprawdza czy aktualny użytkownik jest adminem
 */
async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
        columns: { role: true }
    });

    if (user?.role !== 'admin') throw new Error('Forbidden');
    return true;
}

/**
 * Blokuje/odblokowuje użytkownika
 */
export async function toggleBlockUser(userId: string, currentStatus: boolean) {
    await checkAdmin();
    await db.update(users)
        .set({ isBlocked: !currentStatus })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Zmienia rolę użytkownika (user <-> admin)
 */
export async function toggleUserRole(userId: string, currentRole: 'user' | 'admin') {
    await checkAdmin();
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await db.update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Usuwa użytkownika z bazy danych
 */
export async function deleteUser(userId: string) {
    await checkAdmin();
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Tworzy nowego użytkownika w lokalnej bazie
 * 
 * UWAGA: Użytkownik utworzony tą metodą będzie mógł się zalogować
 * tylko jeśli posiada konto w centrum logowania z tym samym emailem.
 * Hasła nie są przechowywane - logowanie tylko przez SSO.
 */
export async function createUser(data: { name: string; email: string; role: 'user' | 'admin' }) {
    await checkAdmin();

    // Sprawdzenie czy użytkownik już istnieje
    const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase())
    });

    if (existing) {
        throw new Error('Użytkownik z tym adresem email już istnieje');
    }

    await db.insert(users).values({
        id: randomUUID(),
        name: data.name,
        email: data.email.toLowerCase(),
        // Brak hasła - logowanie tylko przez SSO centrum
        role: data.role,
        isBlocked: false,
        createdAt: new Date(),
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
    });
    revalidatePath('/admin/users');
}

// Funkcje do zarządzania danymi użytkownika (dla admina)
export async function deleteUserData(userId: string) {
    await checkAdmin();
    return deleteUserDataAction(userId);
}

export async function deleteUserHistory(userId: string) {
    await checkAdmin();
    return deleteUserHistoryAction(userId);
}

export async function resetUserProgress(userId: string) {
    await checkAdmin();
    return resetUserProgressAction(userId);
}

// UWAGA: Funkcja resetUserPassword została usunięta
// Logowanie odbywa się przez SSO centrum logowania - zmiana hasła musi być wykonana w centrum
