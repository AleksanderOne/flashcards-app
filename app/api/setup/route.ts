import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { ssoConfig } from "@/lib/db/schema";
import { invalidateSSOConfigCache } from "@/lib/sso-client";

/**
 * Sprawdza czy centrum logowania odpowiada
 */
async function checkSSOHealth(centerUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${centerUrl}/api/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/setup
 * Publiczny endpoint do konfiguracji startowej (BOOTSTRAP)
 * Działa gdy:
 * - W bazie NIE MA jeszcze konfiguracji
 * - LUB istniejąca konfiguracja nie działa (health check fail)
 */
export async function POST(request: NextRequest) {
  try {
    // 0. Sprawdź czy konfiguracja już istnieje
    const existingConfig = await db.query.ssoConfig.findFirst();

    if (existingConfig) {
      // Konfiguracja istnieje - sprawdź czy działa
      const isHealthy = await checkSSOHealth(existingConfig.centerUrl);

      if (isHealthy) {
        // SSO działa - blokuj rekonfigurację przez publiczny endpoint
        return NextResponse.json(
          {
            success: false,
            message:
              "Aplikacja jest już skonfigurowana i działa poprawnie. Użyj panelu admina do zmian.",
          },
          { status: 403 },
        );
      }

      // SSO nie działa - pozwól na rekonfigurację
      console.log(
        "[Setup Bootstrap] SSO nie działa - zezwalam na rekonfigurację",
      );
      // Usuń starą konfigurację
      await db.delete(ssoConfig);
    }

    // 1. Pobierz dane
    const body = await request.json();
    const { setupCode, centerUrl: providedCenterUrl } = body;

    if (!setupCode || typeof setupCode !== "string") {
      return NextResponse.json(
        { success: false, message: "Brak Setup Code" },
        { status: 400 },
      );
    }

    // URL centrum - musi być podany przez użytkownika lub z .env
    const centerUrl =
      providedCenterUrl ||
      process.env.SSO_CENTER_URL ||
      process.env.NEXT_PUBLIC_SSO_CENTER_URL;

    if (!centerUrl) {
      return NextResponse.json(
        { success: false, message: "Wymagany jest URL Centrum Logowania" },
        { status: 400 },
      );
    }

    // 2. Wyślij request do CLA
    const claimResponse = await fetch(`${centerUrl}/api/v1/projects/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setupCode }),
    });

    if (!claimResponse.ok) {
      const errorData = await claimResponse.json().catch(() => ({}));
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

    // Debug: loguj odpowiedź z CLA
    console.log(
      "[Setup Bootstrap] ClaimData:",
      JSON.stringify(claimData, null, 2),
    );

    // Walidacja struktury odpowiedzi
    // CLA zwraca płaską strukturę: { apiKey, slug, centerUrl, projectName }
    if (!claimData.apiKey || !claimData.slug) {
      console.error(
        "[Setup Bootstrap] Nieprawidłowa struktura odpowiedzi:",
        claimData,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Nieprawidłowa odpowiedź z Centrum Logowania. Sprawdź wersję CLA.",
          debug: claimData,
        },
        { status: 500 },
      );
    }

    // 3. Zapisz w bazie (używamy płaskiej struktury z CLA)
    await db.insert(ssoConfig).values({
      apiKey: claimData.apiKey,
      projectSlug: claimData.slug,
      centerUrl: claimData.centerUrl || centerUrl,
      projectName: claimData.projectName,
      // configuredBy: null - bo to bootstrap, nie mamy jeszcze usera
    });

    // 4. Invaliduj cache
    invalidateSSOConfigCache();

    return NextResponse.json({
      success: true,
      message: "Konfiguracja zakończona pomyślnie",
    });
  } catch (error) {
    console.error("[Setup Bootstrap] Error:", error);
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
