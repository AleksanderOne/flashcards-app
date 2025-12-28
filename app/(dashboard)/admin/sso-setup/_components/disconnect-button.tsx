"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DisconnectButton() {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sso-setup", {
        method: "DELETE",
      });

      if (response.ok) {
        // Po usunięciu konfiguracji SSO musimy wylogować użytkownika
        // Jego sesja odnosi się do nieistniejącego już projektu
        await fetch("/api/auth/sso-logout", { method: "POST" });

        // Wyczyść wszystkie lokalne dane aplikacji
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        // Przekieruj na stronę logowania (hard redirect by wyczyścić stan)
        window.location.href = "/login";
      } else {
        console.error("Failed to disconnect");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Rozłącz
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz rozłączyć?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja usunie konfigurację połączenia z Centrum Logowania.
            Użytkownicy SSO nie będą mogli się zalogować. Będziesz musiał
            ponownie skonfigurować połączenie używając Setup Code.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Rozłączanie..." : "Rozłącz"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
