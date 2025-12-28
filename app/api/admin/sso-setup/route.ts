import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { ssoConfig, users } from "@/lib/db/schema";
import { getSSOSession, invalidateSSOConfigCache } from "@/lib/sso-client";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/sso-setup
 * Konfiguracja SSO przez Setup Code z Centrum Logowania
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Sprawdź czy user jest adminem
    const session = await getSSOSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Brak autoryzacji" },
        { status: 401 },
      );
    }

    // Sprawdź rolę użytkownika w bazie
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Brak uprawnień administratora" },
        { status: 403 },
      );
    }

    // 2. Pobierz Setup Code z body
    const body = await request.json();
    const { setupCode, centerUrl: providedCenterUrl } = body;

    if (!setupCode || typeof setupCode !== "string") {
      return NextResponse.json(
        { success: false, message: "Brak Setup Code" },
        { status: 400 },
      );
    }

    // URL centrum (może być podany lub z .env)
    const centerUrl =
      providedCenterUrl ||
      process.env.SSO_CENTER_URL ||
      process.env.NEXT_PUBLIC_SSO_CENTER_URL;

    if (!centerUrl) {
      return NextResponse.json(
        { success: false, message: "Brak URL Centrum Logowania" },
        { status: 400 },
      );
    }

    // 3. Wyślij request do CLA: POST /api/v1/projects/claim
    const claimResponse = await fetch(`${centerUrl}/api/v1/projects/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setupCode }),
    });

    if (!claimResponse.ok) {
      const errorData = await claimResponse.json().catch(() => ({}));
      console.error("[SSO Setup] Claim failed:", errorData);
      return NextResponse.json(
        {
          success: false,
          message:
            errorData.error ||
            "Nie udało się połączyć z Centrum Logowania. Sprawdź czy kod jest poprawny.",
        },
        { status: 400 },
      );
    }

    const claimData = await claimResponse.json();

    // Walidacja - CLA zwraca płaską strukturę: { apiKey, slug, centerUrl, projectName }
    if (!claimData.apiKey || !claimData.slug) {
      console.error(
        "[SSO Setup] Nieprawidłowa struktura odpowiedzi:",
        claimData,
      );
      return NextResponse.json(
        {
          success: false,
          message: "Nieprawidłowa odpowiedź z Centrum Logowania",
        },
        { status: 500 },
      );
    }

    // 4. Zapisz odpowiedź w tabeli ssoConfig
    // Najpierw usuń starą konfigurację (singleton)
    await db.delete(ssoConfig);

    // Dodaj nową konfigurację (używamy płaskiej struktury z CLA)
    await db.insert(ssoConfig).values({
      apiKey: claimData.apiKey,
      projectSlug: claimData.slug,
      centerUrl: claimData.centerUrl || centerUrl,
      projectName: claimData.projectName,
      configuredBy: session.userId,
    });

    // 5. Invaliduj cache SSO config
    invalidateSSOConfigCache();

    // 6. Zwróć sukces
    return NextResponse.json({
      success: true,
      message: `Połączono z projektem: ${claimData.projectName}`,
      projectName: claimData.projectName,
      projectSlug: claimData.slug,
    });
  } catch (error) {
    console.error("[SSO Setup] Error:", error);
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/sso-setup
 * Pobiera aktualną konfigurację SSO
 */
export async function GET() {
  try {
    // Sprawdź czy user jest adminem
    const session = await getSSOSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Brak autoryzacji" },
        { status: 401 },
      );
    }

    // Sprawdź rolę użytkownika w bazie
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Brak uprawnień administratora" },
        { status: 403 },
      );
    }

    // Pobierz konfigurację z bazy
    const config = await db.query.ssoConfig.findFirst();

    if (!config) {
      // Sprawdź czy jest konfiguracja z .env
      const envConfig = {
        projectSlug:
          process.env.SSO_CLIENT_ID ||
          process.env.NEXT_PUBLIC_SSO_CLIENT_ID ||
          "",
        centerUrl:
          process.env.SSO_CENTER_URL ||
          process.env.NEXT_PUBLIC_SSO_CENTER_URL ||
          "",
        hasApiKey: !!process.env.SSO_API_KEY,
      };

      if (envConfig.projectSlug && envConfig.centerUrl && envConfig.hasApiKey) {
        return NextResponse.json({
          success: true,
          configured: true,
          source: "env",
          projectSlug: envConfig.projectSlug,
          centerUrl: envConfig.centerUrl,
        });
      }

      return NextResponse.json({
        success: true,
        configured: false,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      source: "database",
      projectSlug: config.projectSlug,
      projectName: config.projectName,
      centerUrl: config.centerUrl,
      configuredAt: config.configuredAt,
    });
  } catch (error) {
    console.error("[SSO Setup] GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/sso-setup
 * Usuwa konfigurację SSO (Rozłącz)
 */
export async function DELETE() {
  try {
    // 1. Sprawdź czy user jest adminem
    const session = await getSSOSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Brak autoryzacji" },
        { status: 401 },
      );
    }

    // Sprawdź rolę
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Brak uprawnień administratora" },
        { status: 403 },
      );
    }

    // 2. Usuń konfigurację z bazy
    await db.delete(ssoConfig);

    // 3. Invaliduj cache
    invalidateSSOConfigCache();

    return NextResponse.json({
      success: true,
      message: "Rozłączono z Centrum Logowania",
    });
  } catch (error) {
    console.error("[SSO Setup] DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
