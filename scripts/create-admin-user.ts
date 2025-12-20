import { config } from 'dotenv';
import { hash } from 'bcryptjs';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

config({ path: '.env.local' });

async function main() {
    console.log('Łączenie z bazą danych...');
    // Dynamic import to ensure env vars are loaded
    const { db } = await import('../lib/db/drizzle');

    const email = 'admin@example.com';
    const password = 'admin';
    const hashedPassword = await hash(password, 10);

    console.log(`Sprawdzanie użytkownika ${email}...`);
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (existingUser) {
        console.log('Aktualizacja istniejącego użytkownika admina...');
        await db.update(users)
            .set({
                password: hashedPassword,
                role: 'admin',
                isBlocked: false
            })
            .where(eq(users.email, email));
    } else {
        console.log('Tworzenie nowego użytkownika admina...');
        await db.insert(users).values({
            id: randomUUID(),
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'admin',
            isBlocked: false,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            createdAt: new Date(),
        });
    }

    console.log('----------------------------------------');
    console.log('✅ Dane logowania admina:');
    console.log(`Email:    ${email}`);
    console.log(`Hasło:    ${password}`);
    console.log('----------------------------------------');

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Błąd podczas tworzenia użytkownika admina:', err);
    process.exit(1);
});
