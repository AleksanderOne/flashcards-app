'use client';

/**
 * Global Error Boundary
 * 
 * Obsługuje błędy na poziomie root layout (gdy nawet layout się nie załaduje).
 * Musi zawierać własny <html> i <body> ponieważ zastępuje cały layout.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="pl">
            <body className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                    {/* Ikona błędu */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-6">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Wystąpił poważny błąd
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Przepraszamy, aplikacja napotkała nieoczekiwany problem.
                        Spróbuj odświeżyć stronę lub zalogować się ponownie.
                    </p>

                    {/* Digest dla supportu */}
                    {error.digest && (
                        <p className="text-xs text-gray-400 mb-6">
                            Kod błędu: {error.digest}
                        </p>
                    )}

                    {/* Przyciski akcji */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={reset}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all"
                        >
                            Spróbuj ponownie
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Zaloguj się
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Strona główna
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
