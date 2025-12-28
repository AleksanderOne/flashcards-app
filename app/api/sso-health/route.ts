/**
 * API Route: SSO Health Check
 *
 * Sprawdza czy połączenie z centrum logowania działa.
 * Używane na stronie logowania aby wykryć problemy z konfiguracją SSO.
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
        error: "not_configured",
        message: "SSO nie jest skonfigurowane",
      });
    }

    // Próba połączenia z centrum logowania (health endpoint lub authorize)
    const healthUrl = `${config.centerUrl}/api/v1/health`;

    try {
      const response = await fetch(healthUrl, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (response.ok) {
        return NextResponse.json({
          healthy: true,
          centerUrl: config.centerUrl,
          projectSlug: config.projectSlug,
        });
      }

      // Centrum nie odpowiada poprawnie
      return NextResponse.json({
        healthy: false,
        error: "center_error",
        message: "Centrum logowania nie odpowiada poprawnie",
        status: response.status,
      });
    } catch (fetchError) {
      // Błąd połączenia z centrum
      return NextResponse.json({
        healthy: false,
        error: "connection_error",
        message: "Nie można połączyć się z centrum logowania",
        details:
          fetchError instanceof Error ? fetchError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("[SSO Health] Error:", error);
    return NextResponse.json({
      healthy: false,
      error: "internal_error",
      message: "Błąd wewnętrzny podczas sprawdzania SSO",
    });
  }
}
