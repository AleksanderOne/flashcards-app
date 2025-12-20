import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Walidacja danych wejściowych
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Wszystkie pola są wymagane' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Hasło musi mieć minimum 8 znaków' },
                { status: 400 }
            );
        }

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
