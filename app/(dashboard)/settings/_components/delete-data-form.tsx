'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Trash2, History, RotateCcw } from 'lucide-react';
import { deleteUserData, deleteUserHistory, resetUserProgress } from '@/app/actions/user-data-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
            toast.error(error instanceof Error ? error.message : 'Nie udało się usunąć danych');
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
            toast.error(error instanceof Error ? error.message : 'Nie udało się usunąć historii');
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
            toast.error(error instanceof Error ? error.message : 'Nie udało się zresetować postępów');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Strefa niebezpieczna</CardTitle>
                <CardDescription>
                    Zarządzaj swoimi danymi nauki. Te akcje są nieodwracalne.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Usuń tylko historię */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-orange-500" />
                            <h3 className="font-semibold">Usuń historię sesji</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Usuń wszystkie zapisane sesje nauki. Twoje postępy (spaced repetition) i statystyki pozostaną nienaruszone.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="ml-4 border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950"
                                disabled={isLoading}
                            >
                                <History className="h-4 w-4 mr-2" />
                                Usuń historię
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz usunąć historię?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta akcja usunie wszystkie zapisane sesje nauki. Twoje postępy w nauce słówek
                                    (algorytm spaced repetition) i ogólne statystyki pozostaną nienaruszone.
                                    <br /><br />
                                    <strong>Ta akcja jest nieodwracalna.</strong>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteHistory}
                                    className="bg-orange-500 hover:bg-orange-600"
                                >
                                    Tak, usuń historię
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Resetuj postępy */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold">Resetuj postępy nauki</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Zresetuj wszystkie postępy nauki słówek (spaced repetition). Historia sesji i ogólne statystyki pozostaną.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="ml-4 border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                                disabled={isLoading}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Resetuj
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz zresetować postępy?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta akcja zresetuje wszystkie Twoje postępy w nauce słówek (algorytm spaced repetition).
                                    Będziesz musiał/a zacząć naukę od początku. Historia sesji i ogólne statystyki pozostaną.
                                    <br /><br />
                                    <strong>Ta akcja jest nieodwracalna.</strong>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleResetProgress}
                                    className="bg-yellow-500 hover:bg-yellow-600"
                                >
                                    Tak, zresetuj postępy
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Usuń wszystkie dane */}
                <div className="flex items-start justify-between p-4 border rounded-lg border-red-200 dark:border-red-900">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-500" />
                            <h3 className="font-semibold text-red-600 dark:text-red-400">Usuń wszystkie dane</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Usuń całą historię, postępy, osiągnięcia i zresetuj statystyki. Zaczynasz od zera.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="ml-4"
                                disabled={isLoading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Usuń wszystko
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz usunąć wszystkie dane?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta akcja usunie:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Całą historię sesji nauki</li>
                                        <li>Wszystkie postępy w nauce słówek</li>
                                        <li>Wszystkie osiągnięcia</li>
                                        <li>Zresetuje statystyki do zera</li>
                                    </ul>
                                    <br />
                                    <strong className="text-red-600 dark:text-red-400">
                                        Ta akcja jest całkowicie nieodwracalna i nie można jej cofnąć!
                                    </strong>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAllData}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Tak, usuń wszystkie dane
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
