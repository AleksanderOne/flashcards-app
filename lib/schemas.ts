import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
});
