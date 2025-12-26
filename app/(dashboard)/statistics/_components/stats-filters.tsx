'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TIME_RANGES = [
    { value: '1', label: '1 dzień' },
    { value: '3', label: '3 dni' },
    { value: '7', label: '7 dni' },
    { value: '30', label: '30 dni' },
    { value: '90', label: '90 dni' },
    { value: '365', label: 'Rok' },
    { value: 'all', label: 'Wszystko' },
] as const;

export function StatsFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentRange = searchParams.get('range') || '30';

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('range', range);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {TIME_RANGES.map((range) => (
                <Button
                    key={range.value}
                    variant={currentRange === range.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRangeChange(range.value)}
                    className={cn(
                        "transition-all",
                        currentRange === range.value && "shadow-md"
                    )}
                >
                    {range.label}
                </Button>
            ))}
        </div>
    );
}

