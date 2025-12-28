import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { ssoConfig } from "@/lib/db/schema";
import { invalidateSSOConfigCache } from "@/lib/sso-client";

// Interfejs odpowiedzi z Centrum Logowania (claim)
interface ClaimResponse {
  success: boolean;
  project: {
    slug: string;
    name: string;
    apiKey: string;
  };
  centerUrl: string;
}

/**
 * POST /api/setup
 * Publiczny endpoint do konfiguracji startowej (BOOTSTRAP)
 * Działa tylko gdy w bazie NIE MA jeszcze konfiguracji.
 */
export async function POST(request: NextRequest) {
  try {
    // 0. Sprawdź czy konfiguracja już istnieje (SECURITY)
    // Nie pozwalamy na nadpisanie konfiguracji przez publiczny endpoint
    const existingConfig = await db.query.ssoConfig.findFirst();
    if (existingConfig) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aplikacja jest już skonfigurowana. Użyj panelu admina do zmian.",
        },
        { status: 403 },
      );
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

    const claimData: ClaimResponse = await claimResponse.json();

    // 3. Zapisz w bazie
    await db.insert(ssoConfig).values({
      apiKey: claimData.project.apiKey,
      projectSlug: claimData.project.slug,
      centerUrl: claimData.centerUrl || centerUrl,
      projectName: claimData.project.name,
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
