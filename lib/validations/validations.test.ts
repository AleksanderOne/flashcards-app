/**
 * Testy dla walidacji danych wejściowych (Zod)
 */

import { describe, it, expect } from 'vitest';
import {
    wordDataSchema,
    wordDataArraySchema,
    wordIdSchema
} from '@/lib/validations/word';
import {
    createUserSchema,
    updateNameSchema,
    userRoleSchema
} from '@/lib/validations/user';

describe('Walidacja Zod - Słówka', () => {
    describe('wordDataSchema', () => {
        it('powinien zaakceptować poprawne dane słówka', () => {
            const validWord = {
                english: 'apple',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food'
            };

            const result = wordDataSchema.safeParse(validWord);
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić puste słówko angielskie', () => {
            const invalidWord = {
                english: '',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food'
            };

            const result = wordDataSchema.safeParse(invalidWord);
            expect(result.success).toBe(false);
        });

        it('powinien odrzucić nieprawidłowy poziom', () => {
            const invalidWord = {
                english: 'apple',
                polish: 'jabłko',
                level: 'X1', // nieprawidłowy
                category: 'Food'
            };

            const result = wordDataSchema.safeParse(invalidWord);
            expect(result.success).toBe(false);
        });

        it('powinien zaakceptować opcjonalny imageUrl', () => {
            const wordWithImage = {
                english: 'apple',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food',
                imageUrl: 'https://example.com/image.jpg'
            };

            const result = wordDataSchema.safeParse(wordWithImage);
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić nieprawidłowy URL obrazka', () => {
            const wordWithBadImage = {
                english: 'apple',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food',
                imageUrl: 'not-a-url'
            };

            const result = wordDataSchema.safeParse(wordWithBadImage);
            expect(result.success).toBe(false);
        });

        it('powinien przycinać białe znaki (trim)', () => {
            const wordWithSpaces = {
                english: '  apple  ',
                polish: '  jabłko  ',
                level: 'A1',
                category: '  Food  '
            };

            const result = wordDataSchema.safeParse(wordWithSpaces);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.english).toBe('apple');
                expect(result.data.polish).toBe('jabłko');
                expect(result.data.category).toBe('Food');
            }
        });
    });

    describe('wordDataArraySchema', () => {
        it('powinien zaakceptować tablicę poprawnych słówek', () => {
            const validWords = [
                { english: 'apple', polish: 'jabłko', level: 'A1', category: 'Food' },
                { english: 'banana', polish: 'banan', level: 'A1', category: 'Food' }
            ];

            const result = wordDataArraySchema.safeParse(validWords);
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić pustą tablicę', () => {
            const result = wordDataArraySchema.safeParse([]);
            expect(result.success).toBe(false);
        });

        it('powinien odrzucić tablicę z nieprawidłowym słówkiem', () => {
            const mixedWords = [
                { english: 'apple', polish: 'jabłko', level: 'A1', category: 'Food' },
                { english: '', polish: 'banan', level: 'A1', category: 'Food' } // nieprawidłowe
            ];

            const result = wordDataArraySchema.safeParse(mixedWords);
            expect(result.success).toBe(false);
        });
    });

    describe('wordIdSchema', () => {
        it('powinien zaakceptować prawidłowy UUID', () => {
            const validUuid = '550e8400-e29b-41d4-a716-446655440000';
            const result = wordIdSchema.safeParse(validUuid);
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić nieprawidłowy UUID', () => {
            const invalidUuid = 'not-a-uuid';
            const result = wordIdSchema.safeParse(invalidUuid);
            expect(result.success).toBe(false);
        });

        it('powinien odrzucić pusty string', () => {
            const result = wordIdSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });
});

describe('Walidacja Zod - Użytkownicy', () => {
    describe('createUserSchema', () => {
        it('powinien zaakceptować poprawne dane użytkownika', () => {
            const validUser = {
                name: 'Jan Kowalski',
                email: 'jan@example.com',
                role: 'user'
            };

            const result = createUserSchema.safeParse(validUser);
            expect(result.success).toBe(true);
        });

        it('powinien zaakceptować rolę admin', () => {
            const adminUser = {
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin'
            };

            const result = createUserSchema.safeParse(adminUser);
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić zbyt krótką nazwę', () => {
            const invalidUser = {
                name: 'J', // za krótka
                email: 'jan@example.com',
                role: 'user'
            };

            const result = createUserSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
        });

        it('powinien odrzucić nieprawidłowy email', () => {
            const invalidUser = {
                name: 'Jan Kowalski',
                email: 'not-an-email',
                role: 'user'
            };

            const result = createUserSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
        });

        it('powinien odrzucić nieprawidłową rolę', () => {
            const invalidUser = {
                name: 'Jan Kowalski',
                email: 'jan@example.com',
                role: 'superadmin' // nieprawidłowa
            };

            const result = createUserSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
        });

        it('powinien konwertować email na małe litery', () => {
            const userWithUpperEmail = {
                name: 'Jan Kowalski',
                email: 'JAN@EXAMPLE.COM',
                role: 'user'
            };

            const result = createUserSchema.safeParse(userWithUpperEmail);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('jan@example.com');
            }
        });
    });

    describe('updateNameSchema', () => {
        it('powinien zaakceptować poprawną nazwę', () => {
            const result = updateNameSchema.safeParse({ name: 'Nowa Nazwa' });
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić zbyt krótką nazwę', () => {
            const result = updateNameSchema.safeParse({ name: 'A' });
            expect(result.success).toBe(false);
        });
    });

    describe('userRoleSchema', () => {
        it('powinien zaakceptować user', () => {
            const result = userRoleSchema.safeParse('user');
            expect(result.success).toBe(true);
        });

        it('powinien zaakceptować admin', () => {
            const result = userRoleSchema.safeParse('admin');
            expect(result.success).toBe(true);
        });

        it('powinien odrzucić nieprawidłową rolę', () => {
            const result = userRoleSchema.safeParse('moderator');
            expect(result.success).toBe(false);
        });
    });
});
