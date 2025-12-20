import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Użyj DATABASE_URL z .env
const connectionString = process.env.DATABASE_URL!;

// Połączenie z bazą danych
const client = postgres(connectionString, { prepare: false, ssl: 'require' });
export const db = drizzle(client, { schema });
