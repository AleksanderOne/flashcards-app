import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db/drizzle";
import { CheckCircle2, XCircle, Database, FileCode2 } from "lucide-react";
import { DisconnectButton } from "./disconnect-button";

export async function SSOStatusCard() {
  // Pobierz konfigurację z bazy
  const config = await db.query.ssoConfig.findFirst();

  // Sprawdź czy jest konfiguracja z .env
  const envProjectSlug =
    process.env.SSO_CLIENT_ID || process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "";
  const envCenterUrl =
    process.env.SSO_CENTER_URL || process.env.NEXT_PUBLIC_SSO_CENTER_URL || "";
  const envHasApiKey = !!process.env.SSO_API_KEY;

  const hasEnvConfig = !!(envProjectSlug && envCenterUrl && envHasApiKey);
  const isConfigured = !!config || hasEnvConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Status połączenia
          {isConfigured ? (
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Skonfigurowane
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Nie skonfigurowane
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Aktualna konfiguracja połączenia z Centrum Logowania
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigured && (
          <div className="flex justify-end mb-4">
            <DisconnectButton />
          </div>
        )}
        {config ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Źródło:</span>
              <Badge variant="secondary">Baza danych</Badge>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projekt:</span>
                <span className="font-medium">
                  {config.projectName || config.projectSlug}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {config.projectSlug}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL Centrum:</span>
                <span className="text-xs truncate max-w-[200px]">
                  {config.centerUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skonfigurowano:</span>
                <span className="text-xs">
                  {config.configuredAt.toLocaleDateString("pl-PL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : hasEnvConfig ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Źródło:</span>
              <Badge variant="outline">Zmienne środowiskowe (.env)</Badge>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client ID:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {envProjectSlug}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL Centrum:</span>
                <span className="text-xs truncate max-w-[200px]">
                  {envCenterUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Key:</span>
                <span className="text-xs text-green-600">✓ Ustawiony</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Możesz przeprowadzić migrację do bazy danych używając Setup Code z
              Centrum Logowania.
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              SSO nie jest skonfigurowane. Użyj formularza obok, aby połączyć
              się z Centrum Logowania.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
