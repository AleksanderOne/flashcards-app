'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WordsFilterProps {
    categories: string[];
    levels: string[];
}

export function WordsFilter({ categories, levels }: WordsFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get('category') || 'all';
    const currentLevel = searchParams.get('level') || 'all';

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1'); // Reset to first page on filter change
        router.push(`/all-words?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('category');
        params.delete('level');
        params.set('page', '1');
        router.push(`/all-words?${params.toString()}`);
    };

    const hasFilters = currentCategory !== 'all' || currentLevel !== 'all';

    // Kolory dla poziomów - takie same jak w page.tsx
    const levelColors: Record<string, { bg: string; text: string; border: string }> = {
        'A1': { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
        'A2': { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
        'B1': { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
        'B2': { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
        'C1': { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
    };

    // Kolory dla kategorii - takie same jak w page.tsx
    const categoryColorPalette = [
        { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
        { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
        { bg: 'bg-pink-100 dark:bg-pink-950', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
        { bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
        { bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
        { bg: 'bg-teal-100 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
        { bg: 'bg-lime-100 dark:bg-lime-950', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-700' },
        { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
        { bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
        { bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
    ];

    const getCategoryColor = (category: string) => {
        let hash = 0;
        for (let i = 0; i < category.length; i++) {
            hash = ((hash << 5) - hash) + category.charCodeAt(i);
            hash = hash & hash;
        }
        const index = Math.abs(hash) % categoryColorPalette.length;
        return categoryColorPalette[index];
    };

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <Select
                value={currentCategory}
                onValueChange={(value) => handleFilterChange('category', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Wszystkie kategorie</SelectItem>
                    {categories.map((category) => {
                        const colors = getCategoryColor(category);
                        return (
                            <SelectItem key={category} value={category}>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
                                    {category}
                                </span>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>

            <Select
                value={currentLevel}
                onValueChange={(value) => handleFilterChange('level', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Wszystkie poziomy</SelectItem>
                    {levels.map((level) => {
                        const colors = levelColors[level];
                        return (
                            <SelectItem key={level} value={level}>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors?.bg || 'bg-secondary'} ${colors?.text || 'text-secondary-foreground'} ${colors?.border || 'border-transparent'} border`}>
                                    {level}
                                </span>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFilters}
                    title="Wyczyść filtry"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
