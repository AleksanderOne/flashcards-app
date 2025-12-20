import { Suspense } from 'react';
import { getLearnedWordsForChallenge } from '@/actions/challenge-actions';
import ChallengeClient from './challenge-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Wyzwanie na Czas | Flashcards App',
    description: 'Sprawdź swoją wiedzę w wyzwaniu na czas.',
};

export default async function ChallengePage() {
    const words = await getLearnedWordsForChallenge();

    return (
        <div className="flex flex-col h-full w-full py-8 px-4">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Ładowanie...</div>}>
                <ChallengeClient availableWords={words} />
            </Suspense>
        </div>
    );
}
