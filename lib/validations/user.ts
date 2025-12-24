/**
 * Schematy walidacji Zod dla użytkowników
 * 
 * Centralna definicja schematów używanych w Server Actions.
 * Zapewnia bezpieczną walidację danych wejściowych.
 */

import { z } from 'zod';

// Role użytkowników jako stała tablica
const USER_ROLES = ['user', 'admin'] as const;

// Schema dla tworzenia użytkownika (panel admina)
export const createUserSchema = z.object({
    name: z.string()
        .min(2, 'Nazwa musi mieć minimum 2 znaki')
        .max(100, 'Nazwa może mieć maksymalnie 100 znaków')
        .trim(),
    email: z.string()
        .email('Nieprawidłowy adres email')
        .max(255, 'Email może mieć maksymalnie 255 znaków')
        .transform(val => val.toLowerCase()),
    role: z.enum(USER_ROLES, {
        message: 'Rola musi być "user" lub "admin"'
    }),
});

// Typ wynikowy ze schematu
export type CreateUserInput = z.infer<typeof createUserSchema>;

// Schema dla aktualizacji nazwy użytkownika
export const updateNameSchema = z.object({
    name: z.string()
        .min(2, 'Nazwa musi mieć minimum 2 znaki')
        .max(100, 'Nazwa może mieć maksymalnie 100 znaków')
        .trim(),
});

// Schema dla ID użytkownika
export const userIdSchema = z.string()
    .min(1, 'ID użytkownika jest wymagane')
    .max(255, 'Nieprawidłowy identyfikator użytkownika');

// Schema dla roli użytkownika
export const userRoleSchema = z.enum(USER_ROLES, {
    message: 'Nieprawidłowa rola użytkownika'
});

export type UserRole = z.infer<typeof userRoleSchema>;
