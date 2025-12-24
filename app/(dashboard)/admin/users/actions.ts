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
import { createUserSchema, userIdSchema, userRoleSchema } from '@/lib/validations/user';
import { z } from 'zod';
import { requireAdminStrict } from '@/lib/auth-admin-strict';

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
 * Blokuje/odblokowuje użytkownika.
 * Dane wejściowe są walidowane przez schemat Zod.
 */
export async function toggleBlockUser(rawUserId: unknown, rawCurrentStatus: unknown) {
    // Walidacja danych wejściowych
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    const statusResult = z.boolean().safeParse(rawCurrentStatus);
    if (!statusResult.success) {
        throw new Error('Nieprawidłowy status blokady');
    }
    const currentStatus = statusResult.data;

    await checkAdmin();
    await db.update(users)
        .set({ isBlocked: !currentStatus })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Zmienia rolę użytkownika (user <-> admin).
 * Dane wejściowe są walidowane przez schemat Zod.
 * 
 * KRYTYCZNA OPERACJA - używa fail-closed (requireAdminStrict)
 * W przypadku błędu połączenia z centrum SSO - odmowa dostępu.
 */
export async function toggleUserRole(rawUserId: unknown, rawCurrentRole: unknown) {
    // Walidacja danych wejściowych
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    const roleResult = userRoleSchema.safeParse(rawCurrentRole);
    if (!roleResult.success) {
        throw new Error('Nieprawidłowa rola użytkownika');
    }
    const currentRole = roleResult.data;

    // Fail-closed: weryfikacja z centrum SSO
    await requireAdminStrict();

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await db.update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Usuwa użytkownika z bazy danych.
 * Dane wejściowe są walidowane przez schemat Zod.
 * 
 * KRYTYCZNA OPERACJA - używa fail-closed (requireAdminStrict)
 * W przypadku błędu połączenia z centrum SSO - odmowa dostępu.
 */
export async function deleteUser(rawUserId: unknown) {
    // Walidacja danych wejściowych
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    // Fail-closed: weryfikacja z centrum SSO
    await requireAdminStrict();

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

/**
 * Tworzy nowego użytkownika w lokalnej bazie.
 * Dane wejściowe są walidowane przez schemat Zod.
 * 
 * UWAGA: Użytkownik utworzony tą metodą będzie mógł się zalogować
 * tylko jeśli posiada konto w centrum logowania z tym samym emailem.
 * Hasła nie są przechowywane - logowanie tylko przez SSO.
 */
export async function createUser(rawData: unknown) {
    // Walidacja danych wejściowych
    const validationResult = createUserSchema.safeParse(rawData);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new Error(firstError?.message || 'Nieprawidłowe dane użytkownika');
    }
    const data = validationResult.data;

    await checkAdmin();

    // Sprawdzenie czy użytkownik już istnieje
    const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email)
    });

    if (existing) {
        throw new Error('Użytkownik z tym adresem email już istnieje');
    }

    await db.insert(users).values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        // Brak hasła - logowanie tylko przez SSO centrum
        role: data.role,
        isBlocked: false,
        createdAt: new Date(),
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
    });
    revalidatePath('/admin/users');
}

// Funkcje do zarządzania danymi użytkownika (dla admina)
export async function deleteUserData(rawUserId: unknown) {
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    await checkAdmin();
    return deleteUserDataAction(userId);
}

export async function deleteUserHistory(rawUserId: unknown) {
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    await checkAdmin();
    return deleteUserHistoryAction(userId);
}

export async function resetUserProgress(rawUserId: unknown) {
    const userIdResult = userIdSchema.safeParse(rawUserId);
    if (!userIdResult.success) {
        throw new Error('Nieprawidłowy identyfikator użytkownika');
    }
    const userId = userIdResult.data;

    await checkAdmin();
    return resetUserProgressAction(userId);
}

// UWAGA: Funkcja resetUserPassword została usunięta
// Logowanie odbywa się przez SSO centrum logowania - zmiana hasła musi być wykonana w centrum

