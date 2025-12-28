/**
 * Skrypt migracji konfiguracji SSO z .env do bazy danych
 *
 * Użycie:
 * npx tsx scripts/migrate-sso-config.ts
 */

import postgres from "postgres";
import { config } from "dotenv";

// Załaduj zmienne środowiskowe
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

async function migrateFromEnv() {
  console.log("🔄 Rozpoczynam migrację konfiguracji SSO z .env do bazy...\n");

  const sql = postgres(connectionString, {
    ssl: "require",
  });

  try {
    // Sprawdź czy już istnieje konfiguracja w bazie
    const existing = await sql`
      SELECT id, project_slug, project_name, center_url, configured_at 
      FROM flashcards.sso_config 
      LIMIT 1
    `;

    if (existing.length > 0) {
      const config = existing[0];
      console.log("✅ Konfiguracja SSO już istnieje w bazie:");
      console.log(`   Projekt: ${config.project_name || config.project_slug}`);
      console.log(`   Slug: ${config.project_slug}`);
      console.log(`   URL: ${config.center_url}`);
      console.log(`   Skonfigurowano: ${config.configured_at}`);
      console.log("\n⚠️  Migracja pominięta (konfiguracja już istnieje)");
      await sql.end();
      return;
    }

    // Pobierz wartości z .env
    const apiKey = process.env.SSO_API_KEY;
    const projectSlug =
      process.env.SSO_CLIENT_ID || process.env.NEXT_PUBLIC_SSO_CLIENT_ID;
    const centerUrl =
      process.env.SSO_CENTER_URL || process.env.NEXT_PUBLIC_SSO_CENTER_URL;

    console.log("📋 Znalezione wartości w .env:");
    console.log(`   SSO_API_KEY: ${apiKey ? "✓ (ustawiony)" : "✗ (brak)"}`);
    console.log(`   SSO_CLIENT_ID: ${projectSlug || "(brak)"}`);
    console.log(`   SSO_CENTER_URL: ${centerUrl || "(brak)"}`);

    if (!apiKey || !projectSlug || !centerUrl) {
      console.log("\n❌ Brak pełnej konfiguracji w .env");
      console.log("   Wymagane zmienne:");
      console.log("   - SSO_API_KEY");
      console.log("   - SSO_CLIENT_ID lub NEXT_PUBLIC_SSO_CLIENT_ID");
      console.log("   - SSO_CENTER_URL lub NEXT_PUBLIC_SSO_CENTER_URL");
      await sql.end();
      process.exit(1);
    }

    // Zapisz do bazy
    console.log("\n💾 Zapisuję konfigurację do bazy danych...");

    await sql`
      INSERT INTO flashcards.sso_config (api_key, project_slug, center_url)
      VALUES (${apiKey}, ${projectSlug}, ${centerUrl})
    `;

    console.log("\n✅ Zmigrowano konfigurację z .env do bazy!");
    console.log("\n📝 Możesz teraz usunąć następujące zmienne z .env:");
    console.log("   - SSO_API_KEY");
    console.log("   - SSO_CLIENT_ID");
    console.log("   - SSO_CENTER_URL");
    console.log("   - NEXT_PUBLIC_SSO_CLIENT_ID");
    console.log("   - NEXT_PUBLIC_SSO_CENTER_URL");

    await sql.end();
  } catch (error) {
    await sql.end();
    throw error;
  }
}

migrateFromEnv()
  .then(() => {
    console.log("\n🏁 Skrypt zakończony pomyślnie");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Błąd podczas migracji:", error);
    process.exit(1);
  });
