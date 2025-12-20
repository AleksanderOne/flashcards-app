import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { registerSchema } from '@/lib/schemas';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Walidacja danych wejściowych za pomocą Zod (safeParse)
        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password } = validationResult.data;

        // Weryfikacja czy użytkownik już istnieje
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Użytkownik z tym adresem email już istnieje' },
                { status: 400 }
            );
        }

        // Haszowanie hasła
        const hashedPassword = await bcrypt.hash(password, 12);

        // Utworzenie nowego rekordu użytkownika
        const userId = randomUUID();
        await db.insert(users).values({
            id: userId,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date(),
        });

        return NextResponse.json(
            { success: true, message: 'Konto zostało utworzone' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        return NextResponse.json(
            { error: 'Wystąpił błąd podczas rejestracji' },
            { status: 500 }
        );
    }
}
