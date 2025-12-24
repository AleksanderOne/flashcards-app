/**
 * Schematy walidacji Zod dla słówek
 * 
 * Centralna definicja schematów używanych w Server Actions.
 * Zapewnia bezpieczną walidację danych wejściowych.
 */

import { z } from 'zod';

// Poziomy trudności jako stała tablica
const LEVEL_VALUES = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

// Schema dla pojedynczego słówka
export const wordDataSchema = z.object({
    english: z.string()
        .min(1, 'Słówko angielskie jest wymagane')
        .max(200, 'Słówko angielskie może mieć maksymalnie 200 znaków')
        .trim(),
    polish: z.string()
        .min(1, 'Tłumaczenie polskie jest wymagane')
        .max(200, 'Tłumaczenie może mieć maksymalnie 200 znaków')
        .trim(),
    level: z.enum(LEVEL_VALUES, {
        message: 'Nieprawidłowy poziom trudności'
    }),
    category: z.string()
        .min(1, 'Kategoria jest wymagana')
        .max(50, 'Kategoria może mieć maksymalnie 50 znaków')
        .trim(),
    imageUrl: z.string().url('Nieprawidłowy URL obrazu').nullable().optional(),
});

// Typ wynikowy ze schematu
export type WordDataInput = z.infer<typeof wordDataSchema>;

// Schema dla tablicy słówek (import masowy)
export const wordDataArraySchema = z.array(wordDataSchema)
    .min(1, 'Lista musi zawierać minimum 1 słówko')
    .max(500, 'Lista może zawierać maksymalnie 500 słówek');

// Schema dla aktualizacji słówka (częściowa)
export const wordUpdateSchema = wordDataSchema.partial();

// Schema dla ID słówka (UUID)
export const wordIdSchema = z.string().uuid('Nieprawidłowy identyfikator słówka');

// Schema dla filtrów wyszukiwania słówek
export const wordFiltersSchema = z.object({
    level: z.string().optional(),
    category: z.string().optional(),
    search: z.string().max(100, 'Wyszukiwanie max 100 znaków').optional(),
    status: z.enum(['all', 'approved', 'pending'] as const).optional(),
}).optional();
