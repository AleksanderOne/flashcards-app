import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
console.log('Testowanie połączenia z:', url?.replace(/:[^:]*@/, ':****@'));

const sql = postgres(url!, { ssl: 'require' });

async function test() {
    try {
        const result = await sql`select 1`;
        console.log('Sukces:', result);
    } catch (e) {
        console.error('Błąd:', e);
    } finally {
        await sql.end();
    }
}

test();
