
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { deleteWord } from '@/actions/words-actions';
import { EditWordDialog } from '@/components/edit-word-dialog';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { WordRow } from './word-row';

interface Word {
    id: string;
    english: string;
    polish: string;
    level: string;
    category: string;
    creatorName?: string | null;
    imageUrl?: string | null;
}

interface WordsTableInfiniteProps {
    initialWords: Word[];
    isAdmin?: boolean;
    disableInfiniteScroll?: boolean;
}

export function WordsTableInfinite({
    initialWords,
    isAdmin = false,
    disableInfiniteScroll = false
}: WordsTableInfiniteProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<Word[]>(initialWords);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(!disableInfiniteScroll && initialWords.length === 20);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [editDialog, setEditDialog] = useState<{ open: boolean; word: Word | null }>({ open: false, word: null });

    // Reset gdy zmienią się filtry (parametry URL)
    useEffect(() => {
        setWords(initialWords);
        setPage(1);
        setHasMore(!disableInfiniteScroll && initialWords.length === 20);
    }, [searchParams, initialWords, disableInfiniteScroll]);

    // Funkcja do ładowania kolejnej strony
    const loadMore = useCallback(async () => {
        if (loading || !hasMore || disableInfiniteScroll) return;

        setLoading(true);
        try {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', String(page + 1));
            params.set('infiniteScroll', 'true');

            const response = await fetch(`/api/words?${params.toString()}`);
            const data = await response.json();

            if (data.words && data.words.length > 0) {
                setWords(prev => [...prev, ...data.words]);
                setPage(prev => prev + 1);
                setHasMore(data.words.length === 20);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania kolejnych słówek:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, searchParams, disableInfiniteScroll]);

    // Intersection Observer
    useEffect(() => {
        if (disableInfiniteScroll) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [loadMore, hasMore, loading, disableInfiniteScroll]);

    // Scroll to top handler
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (wordId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć to słówko?')) return;

        setActionLoading(wordId);
        try {
            const result = await deleteWord(wordId);
            if (result.success) {
                toast.success('Słówko zostało usunięte');
                // Usuń lokalnie z listy
                setWords(prev => prev.filter(w => w.id !== wordId));
                router.refresh();
            } else {
                toast.error(result.error || 'Błąd usuwania');
            }
        } catch (_error) {
            toast.error('Wystąpił błąd');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <div className="rounded-md border bg-white dark:bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Angielski</TableHead>
                            <TableHead>Polski</TableHead>
                            <TableHead>Poziom</TableHead>
                            <TableHead>Kategoria</TableHead>
                            <TableHead>Autor</TableHead>
                            {isAdmin && <TableHead className="text-right">Akcje</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {words.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                                    Brak wyników.
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
                                <WordRow
                                    key={word.id}
                                    word={word}
                                    isAdmin={isAdmin}
                                    onEdit={(w) => setEditDialog({ open: true, word: w })}
                                    onDelete={handleDelete}
                                    isDeleting={actionLoading === word.id}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Observer target dla infinite scroll */}
            {!disableInfiniteScroll && hasMore && (
                <div ref={observerTarget} className="flex justify-center py-4">
                    {loading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Ładowanie...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Scroll to top button */}
            {showScrollTop && (
                <Button
                    onClick={scrollToTop}
                    size="icon"
                    className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50"
                    title="Przewiń do góry"
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}

            <EditWordDialog
                open={editDialog.open}
                word={editDialog.word ? {
                    ...editDialog.word,
                    imageUrl: editDialog.word.imageUrl || null
                } : null}
                onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </>
    );
}
