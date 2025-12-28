"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [setupCode, setSetupCode] = useState("");
  const [centerUrl, setCenterUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setupCode: setupCode.trim(),
          centerUrl: centerUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Wystąpił błąd konfiguracji");
      }

      setSuccess(true);
      // Przekierowanie po chwili
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-green-800 dark:text-green-200">
              Konfiguracja zakończona!
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Aplikacja została połączona z Centrum Logowania.
              <br />
              Za chwilę nastąpi przekierowanie...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-xl">Flashcards App</span>
          </div>
          <CardTitle className="text-2xl">Konfiguracja Startowa</CardTitle>
          <CardDescription>
            Twoja aplikacja nie jest jeszcze połączona z Centrum Logowania.
            Wprowadź Setup Code, aby rozpocząć.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="setupCode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Setup Code
              </label>
              <Input
                id="setupCode"
                placeholder="setup_abc123..."
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value)}
                disabled={loading}
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="centerUrl"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                URL Centrum Logowania
              </label>
              <Input
                id="centerUrl"
                placeholder="https://centrum-logowania.twoja-domena.com"
                value={centerUrl}
                onChange={(e) => setCenterUrl(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Pełny adres URL Twojej instancji Centrum Logowania
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !setupCode.trim() || !centerUrl.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Łączenie...
                </>
              ) : (
                <>
                  Połącz i Rozpocznij
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="pt-4 border-t text-xs text-center text-muted-foreground">
              Nie masz kodu? Wygeneruj go w panelu projektu Centrum Logowania.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
