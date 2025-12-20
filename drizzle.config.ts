import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Załaduj zmienne środowiskowe z .env.local
config({ path: '.env.local' });

export default defineConfig({
    schema: './lib/db/schema.ts',
    out: './lib/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: `${process.env.DATABASE_URL!}?sslmode=require`,
    },
});
