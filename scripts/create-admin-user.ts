import { config } from 'dotenv';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

config({ path: '.env.local' });

/**
 * Skrypt do tworzenia/aktualizacji użytkownika admina w lokalnej bazie danych.
 * 
 * UWAGA: Użytkownik będzie mógł się zalogować tylko przez SSO (Centrum Logowania).
 * Musi posiadać konto Google powiązane z tym samym adresem email w centrum.
 */
async function main() {
    console.log('Łączenie z bazą danych...');
    // Dynamic import to ensure env vars are loaded
    const { db } = await import('../lib/db/drizzle');

    const email = 'admin@example.com';

    console.log(`Sprawdzanie użytkownika ${email}...`);
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (existingUser) {
        console.log('Aktualizacja istniejącego użytkownika na admina...');
        await db.update(users)
            .set({
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
            // Brak hasła - logowanie tylko przez SSO
            role: 'admin',
            isBlocked: false,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            createdAt: new Date(),
        });
    }

    console.log('----------------------------------------');
    console.log('✅ Użytkownik admin utworzony/zaktualizowany:');
    console.log(`Email: ${email}`);
    console.log('');
    console.log('UWAGA: Aby się zalogować, użytkownik musi posiadać');
    console.log('konto Google z tym emailem w Centrum Logowania.');
    console.log('----------------------------------------');

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Błąd podczas tworzenia użytkownika admina:', err);
    process.exit(1);
});
