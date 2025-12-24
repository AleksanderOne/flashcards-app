
'use server';

import { db } from '@/lib/db/drizzle';
import { words, customWords, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or, sql, inArray, ilike, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { LevelType, LEVELS } from '@/lib/constants';
import {
    wordDataSchema,
    wordDataArraySchema,
    wordUpdateSchema,
    wordIdSchema,
    type WordDataInput
} from '@/lib/validations/word';

/**
 * Escapuje znaki specjalne w LIKE pattern (%, _, \) dla bezpieczeństwa.
 * Zapobiega SQL injection przez znaki specjalne w wyszukiwaniu.
 */
function escapeLikePattern(pattern: string): string {
    return pattern
        .replace(/\\/g, '\\\\')  // backslash musi być pierwszy
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

// Współdzielone definicje typów - używamy typu z walidacji
export type WordData = WordDataInput;

// ========== AKCJE DLA UŻYTKOWNIKÓW ==========

/**
 * Dodaje nowe słówko zgłoszone przez użytkownika do kolejki akceptacji.
 * Dane wejściowe są walidowane przez schemat Zod.
 */
export async function submitWordForApproval(rawData: unknown) {
    try {
        // Walidacja danych wejściowych
        const validationResult = wordDataSchema.safeParse(rawData);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return { success: false, error: firstError?.message || 'Nieprawidłowe dane' };
        }
        const wordData = validationResult.data;

        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return { success: false, error: 'Musisz być zalogowany' };
        }

        // Weryfikacja czy słówko już istnieje w bazie (bez uwzględniania wielkości liter)
        const existingWord = await db
            .select()
            .from(words)
            .where(
                and(
                    sql`LOWER(${words.english}) = LOWER(${wordData.english})`,
                    sql`LOWER(${words.polish}) = LOWER(${wordData.polish})`
                )
            )
            .limit(1);

        if (existingWord.length > 0) {
            return { success: false, error: 'To słówko już istnieje w bazie' };
        }

        // Automatyczne zatwierdzenie jeśli użytkownik jest administratorem
        const isApproved = session.user.role === 'admin';

        await db.insert(words).values({
            ...wordData,
            createdBy: session.user.id,
            isApproved: isApproved,
        });

        // Dodanie słówka do prywatnej kolekcji użytkownika, aby było widoczne w sekcji "Moje słówka"
        await db.insert(customWords).values({
            ...wordData,
            userId: session.user.id,
        });

        revalidatePath('/my-words');
        revalidatePath('/all-words');

        return { success: true };
    } catch (error) {
        console.error('Błąd podczas dodawania słówka:', error);
        return { success: false, error: 'Wystąpił błąd podczas dodawania słówka' };
    }
}

/**
 * Masowe dodawanie wielu słówek jednocześnie.
 * Implementacja zoptymalizowana w celu uniknięcia problemu N+1 zapytań.
 * Dane wejściowe są walidowane przez schemat Zod.
 */
export async function submitMultipleWordsForApproval(rawData: unknown) {
    try {
        // Walidacja danych wejściowych (tablica słówek)
        const validationResult = wordDataArraySchema.safeParse(rawData);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return { success: false, error: firstError?.message || 'Nieprawidłowe dane' };
        }
        const wordsData = validationResult.data;

        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return { success: false, error: 'Musisz być zalogowany' };
        }

        // Pobranie wszystkich potencjalnych duplikatów (gdzie "english" pokrywa się z nowymi słówkami)
        // jednym zapytaniem SQL, co znacznie ogranicza zbiór do sprawdzenia w pamięci.
        const newEnglishWords = wordsData.map(w => w.english.toLowerCase());

        // Obsługa podziału na mniejsze porcje danych przy dużej liczbie rekordów (ograniczenia SQL).
        // Wykorzystanie inArray dla efektywnego pobierania.
        const existingCandidates = await db
            .select({
                english: words.english,
                polish: words.polish
            })
            .from(words)
            .where(
                inArray(sql`LOWER(${words.english})`, newEnglishWords)
            );

        const validWords: WordData[] = [];
        const skippedWords: string[] = [];

        // Utworzenie zbioru (Set) dla szybkiej weryfikacji istnienia par angielski-polski w pamięci
        const existingSet = new Set(
            existingCandidates.map(w => `${w.english.toLowerCase()}|${w.polish.toLowerCase()}`)
        );

        for (const word of wordsData) {
            const key = `${word.english.toLowerCase()}|${word.polish.toLowerCase()}`;
            if (existingSet.has(key)) {
                skippedWords.push(`${word.english} (duplikat)`);
            } else {
                validWords.push(word);
                // Aktualizacja zbioru lokalnego, aby uniknąć duplikatów w ramach bieżącego importu
                existingSet.add(key);
            }
        }

        if (validWords.length === 0) {
            return { success: false, error: 'Wszystkie słówka już istnieją w bazie lub lista jest pusta.' };
        }

        const isApproved = session.user.role === 'admin';

        // Grupowe wstawianie rekordów do tabeli 'words'
        await db.insert(words).values(
            validWords.map(word => ({
                ...word,
                createdBy: session.user.id,
                isApproved: isApproved,
            }))
        );

        // Grupowe wstawianie rekordów do tabeli 'customWords'.
        // Uwaga: Można rozważyć pominięcie tego kroku, aby nie obciążać kolekcji prywatnych przy imporcie administracyjnym.
        await db.insert(customWords).values(
            validWords.map(word => ({
                ...word,
                userId: session.user.id,
            }))
        );

        revalidatePath('/my-words');
        revalidatePath('/all-words');

        return {
            success: true,
            count: validWords.length,
            skipped: skippedWords.length,
            message: `Dodano ${validWords.length} słówek. Pominięto ${skippedWords.length}.`
        };
    } catch (error) {
        console.error('Błąd podczas masowego dodawania słówek:', error);
        return { success: false, error: 'Wystąpił błąd podczas importu słówek' };
    }
}

/**
 * Pobiera listę słówek dostępnych dla użytkownika (systemowe zatwierdzone oraz prywatne).
 * Filtrowanie danych realizowane bezpośrednio w zapytaniu SQL.
 */
export async function getUserWords(userId: string, filters?: {
    level?: string;
    category?: string;
    search?: string;
}) {
    try {
        const conditions = [
            or(
                eq(words.isApproved, true),
                eq(words.createdBy, userId)
            )
        ];

        if (filters?.level && LEVELS.includes(filters.level as LevelType)) {
            conditions.push(eq(words.level, filters.level as LevelType));
        }

        if (filters?.category) {
            conditions.push(eq(words.category, filters.category));
        }

        if (filters?.search) {
            // Sanityzacja znaków specjalnych LIKE dla bezpieczeństwa
            const sanitizedSearch = escapeLikePattern(filters.search);
            const searchPattern = `%${sanitizedSearch}%`;
            conditions.push(
                or(
                    ilike(words.english, searchPattern),
                    ilike(words.polish, searchPattern)
                )
            );
        }

        const results = await db
            .select({
                id: words.id,
                english: words.english,
                polish: words.polish,
                level: words.level,
                category: words.category,
                imageUrl: words.imageUrl,
                createdBy: words.createdBy,
                createdAt: words.createdAt,
                creatorName: users.name,
                creatorEmail: users.email,
            })
            .from(words)
            .leftJoin(users, eq(words.createdBy, users.id))
            .where(and(...conditions))
            .orderBy(desc(words.createdAt)); // Domyślne sortowanie: od najnowszych

        return results;
    } catch (error) {
        console.error('Błąd podczas pobierania słówek:', error);
        return [];
    }
}

// ========== AKCJE DLA ADMINÓW ==========

/**
 * Weryfikacja uprawnień administratora.
 * Rola jest przechowywana w JWT tokenie sesji (patrz: lib/auth.ts callbacks.jwt),
 * więc nie potrzebujemy dodatkowego zapytania do bazy danych.
 */
async function checkIsAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { isAdmin: false, userId: null };
    }

    return {
        isAdmin: session.user.role === 'admin',
        userId: session.user.id
    };
}

/**
 * Pobiera listę słówek oczekujących na zatwierdzenie przez administratora.
 */
export async function getPendingWords() {
    try {
        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) {
            return { success: false, error: 'Brak uprawnień' };
        }

        const pendingWords = await db
            .select({
                id: words.id,
                english: words.english,
                polish: words.polish,
                level: words.level,
                category: words.category,
                imageUrl: words.imageUrl,
                createdBy: words.createdBy,
                createdAt: words.createdAt,
                creatorName: users.name,
                creatorEmail: users.email,
            })
            .from(words)
            .leftJoin(users, eq(words.createdBy, users.id))
            .where(eq(words.isApproved, false))
            .orderBy(words.createdAt);

        return { success: true, words: pendingWords };
    } catch (error) {
        console.error('Błąd podczas pobierania oczekujących słówek:', error);
        return { success: false, error: 'Błąd podczas pobierania słówek' };
    }
}

export async function approveWord(rawWordId: unknown) {
    try {
        // Walidacja ID słówka
        const validationResult = wordIdSchema.safeParse(rawWordId);
        if (!validationResult.success) {
            return { success: false, error: 'Nieprawidłowy identyfikator słówka' };
        }
        const wordId = validationResult.data;

        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) return { success: false, error: 'Brak uprawnień' };

        await db
            .update(words)
            .set({ isApproved: true })
            .where(eq(words.id, wordId));

        revalidatePath('/admin/words');
        revalidatePath('/all-words');

        return { success: true };
    } catch (error) {
        console.error('Błąd podczas zatwierdzania słówka:', error);
        return { success: false, error: 'Błąd zatwierdzania' };
    }
}

export async function rejectWord(rawWordId: unknown) {
    try {
        // Walidacja ID słówka
        const validationResult = wordIdSchema.safeParse(rawWordId);
        if (!validationResult.success) {
            return { success: false, error: 'Nieprawidłowy identyfikator słówka' };
        }
        const wordId = validationResult.data;

        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) return { success: false, error: 'Brak uprawnień' };

        await db.delete(words).where(eq(words.id, wordId));
        revalidatePath('/admin/words');
        return { success: true };
    } catch (error) {
        console.error('Błąd podczas odrzucania słówka:', error);
        return { success: false, error: 'Błąd odrzucania' };
    }
}

export async function updateWord(rawWordId: unknown, rawWordData: unknown) {
    try {
        // Walidacja ID słówka
        const idValidation = wordIdSchema.safeParse(rawWordId);
        if (!idValidation.success) {
            return { success: false, error: 'Nieprawidłowy identyfikator słówka' };
        }
        const wordId = idValidation.data;

        // Walidacja danych aktualizacji (częściowa)
        const dataValidation = wordUpdateSchema.safeParse(rawWordData);
        if (!dataValidation.success) {
            const firstError = dataValidation.error.issues[0];
            return { success: false, error: firstError?.message || 'Nieprawidłowe dane' };
        }
        const wordData = dataValidation.data;

        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) return { success: false, error: 'Brak uprawnień' };

        await db
            .update(words)
            .set(wordData)
            .where(eq(words.id, wordId));

        revalidatePath('/admin/words');
        revalidatePath('/all-words');
        return { success: true };
    } catch (error) {
        console.error('Błąd podczas aktualizacji słówka:', error);
        return { success: false, error: 'Błąd aktualizacji' };
    }
}

export async function deleteWord(rawWordId: unknown) {
    try {
        // Walidacja ID słówka
        const validationResult = wordIdSchema.safeParse(rawWordId);
        if (!validationResult.success) {
            return { success: false, error: 'Nieprawidłowy identyfikator słówka' };
        }
        const wordId = validationResult.data;

        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) return { success: false, error: 'Brak uprawnień' };

        await db.delete(words).where(eq(words.id, wordId));

        revalidatePath('/admin/words');
        revalidatePath('/all-words');
        return { success: true };
    } catch (error) {
        console.error('Błąd podczas usuwania słówka:', error);
        return { success: false, error: 'Błąd usuwania' };
    }
}

/**
 * Pobiera pełną listę słówek z uwzględnieniem filtrów administracyjnych (realizowane po stronie SQL).
 */
export async function getAllWordsForAdmin(filters?: {
    level?: string;
    category?: string;
    search?: string;
    status?: 'all' | 'approved' | 'pending';
}) {
    try {
        const { isAdmin } = await checkIsAdmin();
        if (!isAdmin) {
            return { success: false, error: 'Brak uprawnień' };
        }

        const conditions = [];

        if (filters?.status === 'approved') {
            conditions.push(eq(words.isApproved, true));
        } else if (filters?.status === 'pending') {
            conditions.push(eq(words.isApproved, false));
        }

        if (filters?.level && LEVELS.includes(filters.level as LevelType)) {
            conditions.push(eq(words.level, filters.level as LevelType));
        }

        if (filters?.category) {
            conditions.push(eq(words.category, filters.category));
        }

        if (filters?.search) {
            // Sanityzacja znaków specjalnych LIKE dla bezpieczeństwa
            const sanitizedSearch = escapeLikePattern(filters.search);
            const searchPattern = `%${sanitizedSearch}%`;
            conditions.push(
                or(
                    ilike(words.english, searchPattern),
                    ilike(words.polish, searchPattern)
                )
            );
        }

        const filteredWords = await db
            .select({
                id: words.id,
                english: words.english,
                polish: words.polish,
                level: words.level,
                category: words.category,
                imageUrl: words.imageUrl,
                createdBy: words.createdBy,
                isApproved: words.isApproved,
                createdAt: words.createdAt,
                creatorName: users.name,
                creatorEmail: users.email,
            })
            .from(words)
            .leftJoin(users, eq(words.createdBy, users.id))
            .where(and(...conditions))
            .orderBy(desc(words.createdAt));

        return { success: true, words: filteredWords };
    } catch (error) {
        console.error('Błąd podczas pobierania słówek:', error);
        return { success: false, error: 'Błąd podczas pobierania słówek' };
    }
}
