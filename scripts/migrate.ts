
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const migrationClient = postgres(databaseUrl, { max: 1, ssl: 'require' });

async function main() {
    console.log('Running migrations...');
    try {
        await migrate(drizzle(migrationClient), { migrationsFolder: 'lib/db/migrations' });
        console.log('Migrations complete!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

main();
