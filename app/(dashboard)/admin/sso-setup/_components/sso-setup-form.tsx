"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Link2, CheckCircle2, AlertCircle } from "lucide-react";

interface SetupResult {
  success: boolean;
  message: string;
  projectName?: string;
  projectSlug?: string;
}

export function SSOSetupForm() {
  const [setupCode, setSetupCode] = useState("");
  const [centerUrl, setCenterUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/sso-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupCode: setupCode.trim(),
          centerUrl: centerUrl.trim() || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setSetupCode("");
        setCenterUrl("");
        // Odśwież stronę po 2 sekundach żeby pokazać nowy status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch {
      setResult({
        success: false,
        message: "Nie udało się połączyć z serwerem",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Nowe połączenie
        </CardTitle>
        <CardDescription>
          Wklej Setup Code wygenerowany w Centrum Logowania
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setupCode">Setup Code</Label>
            <Input
              id="setupCode"
              placeholder="setup_abc123..."
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerUrl">
              URL Centrum Logowania{" "}
              <span className="text-muted-foreground">(opcjonalnie)</span>
            </Label>
            <Input
              id="centerUrl"
              placeholder="https://centrum-logowania.example.com"
              value={centerUrl}
              onChange={(e) => setCenterUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Zostaw puste, aby użyć domyślnego URL z konfiguracji
            </p>
          </div>

          <Button type="submit" disabled={loading || !setupCode.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Łączenie...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Połącz z Centrum
              </>
            )}
          </Button>

          {result && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                result.success
                  ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.projectName && (
                  <p className="text-sm opacity-80">
                    Projekt: {result.projectName} ({result.projectSlug})
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
