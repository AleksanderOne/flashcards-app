import { Suspense } from 'react';
import PrintWordsClient from './_components/print-words-client';
import { PageLayout } from '@/components/page-layout';

export const metadata = {
    title: 'Drukuj Słówka | Flashcards',
    description: 'Drukuj wybrane słówka do nauki',
};

export default function PrintWordsPage() {
    return (
        <PageLayout
            title="Drukuj Słówka"
            description="Wybierz kryteria i wygeneruj listę słówek do wydrukowania"
        >
            <Suspense fallback={<div>Ładowanie...</div>}>
                <PrintWordsClient />
            </Suspense>
        </PageLayout>
    );
}
