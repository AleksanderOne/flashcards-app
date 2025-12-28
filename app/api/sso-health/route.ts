/**
 * API Route: SSO Health Check
 *
 * Sprawdza czy połączenie z centrum logowania działa.
 * ZAWSZE zwraca centerUrl i projectSlug gdy konfiguracja istnieje w bazie
 * (niezależnie od wyniku health check).
 */

import { NextResponse } from "next/server";
import { getSSOConfig } from "@/lib/sso-client";

export async function GET() {
  try {
    const config = await getSSOConfig();

    // Sprawdź czy konfiguracja istnieje
    if (!config.centerUrl || !config.projectSlug || !config.apiKey) {
      return NextResponse.json({
        healthy: false,
        configured: false,
        error: "not_configured",
        message: "SSO nie jest skonfigurowane",
      });
    }

    // Konfiguracja istnieje - zawsze ją zwróć
    // Health check jest dodatkową informacją
    let healthy = false;
    let healthError: string | null = null;

    try {
      // Próba połączenia z centrum logowania (główna strona zamiast /api/v1/health)
      const response = await fetch(config.centerUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      healthy = response.ok;
    } catch (fetchError) {
      healthError =
        fetchError instanceof Error ? fetchError.message : "Unknown error";
    }

    // ZAWSZE zwracaj konfigurację gdy istnieje
    return NextResponse.json({
      healthy,
      configured: true,
      centerUrl: config.centerUrl,
      projectSlug: config.projectSlug,
      ...(healthError && { healthError }),
    });
  } catch (error) {
    console.error("[SSO Health] Error:", error);
    return NextResponse.json({
      healthy: false,
      configured: false,
      error: "internal_error",
      message: "Błąd wewnętrzny podczas sprawdzania SSO",
    });
  }
}
