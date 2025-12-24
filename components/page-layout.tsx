import { ReactNode } from 'react';

interface PageLayoutProps {
    children: ReactNode;
    /** Tytuł strony wyświetlany w nagłówku */
    title?: string;
    /** Opis pod tytułem */
    description?: string;
    /** Dodatkowe elementy w prawej części nagłówka (np. przyciski) */
    actions?: ReactNode;
    /** Maksymalna szerokość kontentu (domyślnie: pełna szerokość) */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

/**
 * Uniwersalny layout dla stron dashboardu.
 * Zapewnia spójne marginesy, centrowanie i strukturę nagłówka.
 */
export function PageLayout({
    children,
    title,
    description,
    actions,
    maxWidth = 'full'
}: PageLayoutProps) {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        full: ''
    };

    return (
        <div className={`container mx-auto px-8 py-8 flex flex-col flex-1 h-full min-h-screen relative ${maxWidthClasses[maxWidth]}`}>
            {/* Nagłówek strony - opcjonalny */}
            {(title || actions) && (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    {title && (
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-muted-foreground">{description}</p>
                            )}
                        </div>
                    )}
                    {actions && (
                        <div className="flex gap-2 flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {/* Treść strony */}
            <div className="flex-1 space-y-8 pb-4">
                {children}
            </div>

            {/* Footer - Fixed na całą szerokość */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-md md:left-72">
                <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-xs text-muted-foreground/80">
                    <span>© {new Date().getFullYear()} Flashcards</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>Wykonano z pasji przez AleksanderOne ❤️</span>
                </div>
            </footer>
            {/* Padding dla fixed footera */}
            <div className="h-10" />
        </div>
    );
}
