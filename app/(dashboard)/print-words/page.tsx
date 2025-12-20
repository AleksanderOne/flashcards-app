import { Suspense } from 'react';
import PrintWordsClient from './_components/print-words-client';

export const metadata = {
    title: 'Drukuj Słówka | Flashcards',
    description: 'Drukuj wybrane słówka do nauki',
};

export default function PrintWordsPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Drukuj Słówka</h1>
                <p className="text-muted-foreground mt-2">
                    Wybierz kryteria i wygeneruj listę słówek do wydrukowania
                </p>
            </div>

            <Suspense fallback={<div>Ładowanie...</div>}>
                <PrintWordsClient />
            </Suspense>
        </div>
    );
}
