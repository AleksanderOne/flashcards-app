'use server';

const PIXABAY_API_URL = 'https://pixabay.com/api/';

interface PixabayHit {
    id: number;
    webformatURL: string;
    largeImageURL: string;
    tags: string;
}

interface PixabayResponse {
    total: number;
    totalHits: number;
    hits: PixabayHit[];
}

export async function getImageForWord(word: string): Promise<string | null> {
    const apiKey = process.env.PIXABAY_API_KEY;

    // Zapasowy obrazek w przypadku braku klucza API lub błędu
    const fallbackUrl = `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(word)}`;

    if (!apiKey) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Brak klucza PIXABAY_API_KEY. Używanie obrazków zastępczych.');
        }
        return fallbackUrl;
    }

    try {
        // Cache'owanie zapytań można dodać później (np. w Vercel KV lub bazie)
        const response = await fetch(
            `${PIXABAY_API_URL}?key=${apiKey}&q=${encodeURIComponent(word)}&lang=en&image_type=photo&per_page=3`,
            { next: { revalidate: 3600 * 24 } } // Cache na 24h
        );

        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.statusText}`);
        }

        const data: PixabayResponse = await response.json();

        if (data.hits && data.hits.length > 0) {
            return data.hits[0].webformatURL;
        }

        return fallbackUrl;
    } catch (error) {
        console.error('Błąd podczas pobierania obrazka z Pixabay:', error);
        return fallbackUrl;
    }
}
