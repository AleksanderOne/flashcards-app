/**
 * Skrypt do uruchomienia migracji tabeli sso_config
 *
 * Użycie:
 * npx tsx scripts/run-sso-migration.ts
 */

import postgres from "postgres";
import { config } from "dotenv";

// Załaduj zmienne środowiskowe
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

async function runMigration() {
  console.log("🔄 Uruchamiam migrację tabeli sso_config...\n");

  const sql = postgres(connectionString, {
    ssl: "require",
  });

  try {
    // Sprawdź czy tabela już istnieje
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'flashcards' 
        AND table_name = 'sso_config'
      );
    `;

    if (tableExists[0].exists) {
      console.log("✅ Tabela flashcards.sso_config już istnieje");
      await sql.end();
      return;
    }

    // Utwórz tabelę
    await sql`
      CREATE TABLE "flashcards"."sso_config" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "api_key" text NOT NULL,
        "project_slug" varchar(255) NOT NULL,
        "center_url" text NOT NULL,
        "project_name" text,
        "configured_at" timestamp DEFAULT now() NOT NULL,
        "configured_by" varchar(255)
      );
    `;

    console.log("✅ Utworzono tabelę flashcards.sso_config");

    // Dodaj klucz obcy
    await sql`
      ALTER TABLE "flashcards"."sso_config" 
      ADD CONSTRAINT "sso_config_configured_by_users_id_fk" 
      FOREIGN KEY ("configured_by") 
      REFERENCES "flashcards"."users"("id") 
      ON DELETE set null 
      ON UPDATE no action;
    `;

    console.log("✅ Dodano constraint klucza obcego");

    await sql.end();
    console.log("\n🏁 Migracja zakończona pomyślnie!");
  } catch (error) {
    console.error("❌ Błąd podczas migracji:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
