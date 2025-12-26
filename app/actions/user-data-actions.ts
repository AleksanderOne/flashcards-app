'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { learningSessions, wordProgress, achievements, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Pobiera kontekst autoryzacji z sesji.
 * Rola jest przechowywana w JWT tokenie (patrz: lib/auth.ts callbacks.jwt),
 * więc nie potrzebujemy zapytania do bazy danych.
 */
async function getAuthContext() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return {
        userId: session.user.id,
        isAdmin: session.user.role === 'admin',
    };
}

// Funkcja pomocnicza weryfikująca uprawnienia administratora
async function checkAdmin() {
    const ctx = await getAuthContext();
    if (!ctx.isAdmin) throw new Error('Forbidden');
    return true;
}

// Funkcja pomocnicza pobierająca ID aktualnie zalogowanego użytkownika
async function getCurrentUserId() {
    const ctx = await getAuthContext();
    return ctx.userId;
}

/**
 * Usuwa pełną historię i statystyki użytkownika.
 * Standardowy użytkownik ma dostęp tylko do swoich danych.
 * Administrator może usuwać dane dowolnego użytkownika.
 */
export async function deleteUserData(targetUserId?: string) {
    const currentUserId = await getCurrentUserId();

    // Weryfikacja uprawnień administracyjnych w przypadku operacji na koncie innego użytkownika
    if (targetUserId && targetUserId !== currentUserId) {
        await checkAdmin();
    }

    // Ustalenie docelowego ID użytkownika
    const userIdToDelete = targetUserId || currentUserId;

    try {
        // Wykonanie wszystkich operacji usuwania w ramach jednej transakcji bazy danych
        await db.transaction(async (tx) => {
            // 1. Usunięcie historii sesji nauki
            await tx.delete(learningSessions)
                .where(eq(learningSessions.userId, userIdToDelete));

            // 2. Usunięcie postępów w nauce słówek (algorytm powtórek)
            await tx.delete(wordProgress)
                .where(eq(wordProgress.userId, userIdToDelete));

            // 3. Usunięcie zdobytych osiągnięć
            await tx.delete(achievements)
                .where(eq(achievements.userId, userIdToDelete));

            // 4. Reset statystyk użytkownika (zerowanie zamiast usuwania rekordu)
            const existingStats = await tx.query.userStats.findFirst({
                where: eq(userStats.userId, userIdToDelete)
            });

            if (existingStats) {
                await tx.update(userStats)
                    .set({
                        currentStreak: 0,
                        longestStreak: 0,
                        totalWordsLearned: 0,
                        totalTimeMs: 0,
                        lastActiveDate: null,
                        updatedAt: new Date()
                    })
                    .where(eq(userStats.userId, userIdToDelete));
            }
        });

        // Odświeżenie ścieżek aplikacji wyświetlających zmodyfikowane dane
        revalidatePath('/statistics');
        revalidatePath('/learn');
        revalidatePath('/achievements');
        revalidatePath('/admin/users');

        return { success: true, message: 'Dane zostały pomyślnie usunięte' };
    } catch (error) {
        console.error('Błąd podczas usuwania danych użytkownika:', error);
        throw new Error('Nie udało się usunąć danych');
    }
}

/**
 * Usuwa wyłącznie historię sesji nauki, zachowując postępy i statystyki.
 */
export async function deleteUserHistory(targetUserId?: string) {
    const currentUserId = await getCurrentUserId();

    if (targetUserId && targetUserId !== currentUserId) {
        await checkAdmin();
    }

    const userIdToDelete = targetUserId || currentUserId;

    try {
        await db.delete(learningSessions)
            .where(eq(learningSessions.userId, userIdToDelete));

        revalidatePath('/statistics');
        revalidatePath('/admin/users');

        return { success: true, message: 'Historia została pomyślnie usunięta' };
    } catch (error) {
        console.error('Błąd podczas usuwania historii użytkownika:', error);
        throw new Error('Nie udało się usunąć historii');
    }
}

/**
 * Resetuje postępy algorytmu powtórek, zachowując historię sesji.
 */
export async function resetUserProgress(targetUserId?: string) {
    const currentUserId = await getCurrentUserId();

    if (targetUserId && targetUserId !== currentUserId) {
        await checkAdmin();
    }

    const userIdToDelete = targetUserId || currentUserId;

    try {
        await db.delete(wordProgress)
            .where(eq(wordProgress.userId, userIdToDelete));

        revalidatePath('/statistics');
        revalidatePath('/learn');
        revalidatePath('/admin/users');

        return { success: true, message: 'Postępy zostały pomyślnie zresetowane' };
    } catch (error) {
        console.error('Błąd podczas resetowania postępów użytkownika:', error);
        throw new Error('Nie udało się zresetować postępów');
    }
}
