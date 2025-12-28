"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Trash2,
  History,
  RotateCcw,
  AlertTriangle,
  Loader2,
  UserX,
} from "lucide-react";
import {
  deleteUserData,
  deleteUserHistory,
  resetUserProgress,
  deleteMyAccount,
} from "@/app/actions/user-data-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteDataForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDeleteAllData = async () => {
    setIsLoading(true);
    try {
      const result = await deleteUserData();
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nie udało się usunąć danych",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    setIsLoading(true);
    try {
      const result = await deleteUserHistory();
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć historii",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProgress = async () => {
    setIsLoading(true);
    try {
      const result = await resetUserProgress();
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udało się zresetować postępów",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const result = await deleteMyAccount();
      toast.success(result.message);
      // Przekierowanie na stronę logowania po usunięciu konta
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nie udało się usunąć konta",
      );
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-error/30 overflow-hidden !py-0">
      <CardHeader className="bg-gradient-to-r from-error-muted to-accent-orange-muted border-b border-error/20 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-muted flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div>
            <CardTitle className="text-lg text-error-foreground">
              Strefa niebezpieczna
            </CardTitle>
            <CardDescription className="text-error-foreground/70">
              Zarządzaj swoimi danymi nauki. Te akcje są nieodwracalne.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Usuń tylko historię */}
          <div className="p-5 rounded-xl border-2 border-accent-orange/30 bg-accent-orange-muted space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                <History className="h-5 w-5 text-accent-orange" />
              </div>
              <h3 className="font-semibold text-accent-orange-foreground">
                Usuń historię sesji
              </h3>
            </div>
            <p className="text-sm text-accent-orange-foreground/80">
              Usuwa wszystkie zapisane sesje nauki. Postępy i statystyki
              pozostaną.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-accent-orange/50 text-accent-orange-foreground hover:bg-accent-orange/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <History className="h-4 w-4 mr-2" />
                  )}
                  Usuń historię
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Czy na pewno chcesz usunąć historię?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja usunie wszystkie zapisane sesje nauki. Twoje
                    postępy w nauce słówek i ogólne statystyki pozostaną
                    nienaruszone.
                    <br />
                    <br />
                    <strong>Ta akcja jest nieodwracalna.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteHistory}
                    className="bg-accent-orange hover:bg-accent-orange/90"
                  >
                    Tak, usuń historię
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Resetuj postępy */}
          <div className="p-5 rounded-xl border-2 border-warning/30 bg-warning-muted space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-warning" />
              </div>
              <h3 className="font-semibold text-warning-foreground">
                Resetuj postępy
              </h3>
            </div>
            <p className="text-sm text-warning-foreground/80">
              Resetuje wszystkie postępy nauki słówek (spaced repetition).
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-warning/50 text-warning-foreground hover:bg-warning/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Resetuj postępy
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Czy na pewno chcesz zresetować postępy?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja zresetuje wszystkie Twoje postępy w nauce słówek.
                    Będziesz musiał/a zacząć naukę od początku.
                    <br />
                    <br />
                    <strong>Ta akcja jest nieodwracalna.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetProgress}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    Tak, zresetuj postępy
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Usuń wszystkie dane */}
          <div className="p-5 rounded-xl border-2 border-error/30 bg-error-muted space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-error" />
              </div>
              <h3 className="font-semibold text-error-foreground">
                Usuń wszystko
              </h3>
            </div>
            <p className="text-sm text-error-foreground/80">
              Usuwa całą historię, postępy, osiągnięcia i statystyki.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Usuń wszystkie dane
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Czy na pewno chcesz usunąć wszystkie dane?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja usunie:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Całą historię sesji nauki</li>
                      <li>Wszystkie postępy w nauce słówek</li>
                      <li>Wszystkie osiągnięcia</li>
                      <li>Zresetuje statystyki do zera</li>
                    </ul>
                    <br />
                    <strong className="text-error">
                      Ta akcja jest całkowicie nieodwracalna!
                    </strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllData}
                    className="bg-error hover:bg-error/90"
                  >
                    Tak, usuń wszystkie dane
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Sekcja usuwania konta - wydzielona, pełna szerokość */}
        <div className="mt-6 pt-6 border-t border-error/20">
          <div className="p-5 rounded-xl border-2 border-red-600/50 bg-red-950/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/30 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-red-400">Usuń konto</h3>
                <p className="text-sm text-red-300/70">
                  Całkowicie usuwa Twoje konto i wszystkie dane z tej aplikacji.
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Usuń moje konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    Czy na pewno chcesz usunąć swoje konto?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja <strong>TRWALE USUNIE</strong> Twoje konto z tej
                    aplikacji:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Twój profil użytkownika</li>
                      <li>Całą historię nauki</li>
                      <li>Wszystkie postępy i osiągnięcia</li>
                      <li>Własne słówka</li>
                    </ul>
                    <br />
                    <strong className="text-red-600">
                      Tej akcji NIE MOŻNA COFNĄĆ! Po usunięciu zostaniesz
                      wylogowany.
                    </strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Tak, usuń moje konto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
