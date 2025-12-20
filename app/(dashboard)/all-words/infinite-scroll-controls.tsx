'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function InfiniteScrollControls() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const infiniteScroll = searchParams.get('infiniteScroll') === 'true';

    const handleToggleInfiniteScroll = (checked: boolean) => {
        const params = new URLSearchParams(searchParams);
        if (checked) {
            params.set('infiniteScroll', 'true');
            params.delete('page'); // Usuń paginację gdy włączamy infinite scroll
        } else {
            params.delete('infiniteScroll');
            params.set('page', '1'); // Wróć do strony 1
        }
        router.push(`/all-words?${params.toString()}`);
    };

    return (
        <div className="flex items-center space-x-2">
            <Checkbox
                id="infinite-scroll"
                checked={infiniteScroll}
                onCheckedChange={handleToggleInfiniteScroll}
            />
            <Label
                htmlFor="infinite-scroll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
                ALL
            </Label>
        </div>
    );
}
