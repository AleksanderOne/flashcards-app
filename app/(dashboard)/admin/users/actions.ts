'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
    deleteUserData as deleteUserDataAction,
    deleteUserHistory as deleteUserHistoryAction,
    resetUserProgress as resetUserProgressAction
} from '@/app/actions/user-data-actions';

// Helper check
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

export async function toggleBlockUser(userId: string, currentStatus: boolean) {
    await checkAdmin();
    await db.update(users)
        .set({ isBlocked: !currentStatus })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

export async function toggleUserRole(userId: string, currentRole: 'user' | 'admin') {
    await checkAdmin();
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await db.update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

export async function deleteUser(userId: string) {
    await checkAdmin();
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

export async function resetUserPassword(userId: string, newPassword: string) {
    await checkAdmin();
    const hashedPassword = await hash(newPassword, 10);
    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
    revalidatePath('/admin/users');
}

export async function createUser(data: { name: string; email: string; password: string; role: 'user' | 'admin' }) {
    await checkAdmin();

    // Check if exists
    const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email)
    });

    if (existing) {
        throw new Error('User with this email already exists');
    }

    const hashedPassword = await hash(data.password, 10);

    await db.insert(users).values({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword,
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
