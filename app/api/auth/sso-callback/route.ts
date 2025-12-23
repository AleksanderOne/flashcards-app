import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForUser, SSO_CONFIG } from '@/lib/sso';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * SSO Callback - odbiera kod autoryzacyjny z centrum i tworzy lokalną sesję
 * 
 * Flow OAuth2 Authorization Code:
 * 1. Centrum logowania przekierowuje tu z ?code=AUTHORIZATION_CODE
 * 2. Wymieniamy kod na dane użytkownika przez API /api/v1/token
 * 3. Tworzymy/aktualizujemy użytkownika w lokalnej bazie
 * 4. Ustawiamy własne ciasteczko sesji
 * 5. Przekierowujemy do /learn
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const baseUrl = request.nextUrl.origin;

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
    }

    // Wymiana kodu na dane użytkownika przez API centrum
    const redirectUri = SSO_CONFIG.getCallbackUrl(baseUrl);
    const tokenResult = await exchangeCodeForUser(code, redirectUri);

    if (!tokenResult) {
        return NextResponse.redirect(new URL('/login?error=invalid_code', baseUrl));
    }

    const { user: ssoUser } = tokenResult;

    try {
        // Szukamy użytkownika w lokalnej bazie
        let localUser = await db.query.users.findFirst({
            where: eq(users.email, ssoUser.email),
        });

        if (!localUser) {
            // Tworzymy nowego użytkownika w lokalnej bazie
            // ID jest wymagane - generujemy UUID
            const newUserId = crypto.randomUUID();
            const [newUser] = await db.insert(users).values({
                id: newUserId,
                email: ssoUser.email,
                name: ssoUser.name,
                image: ssoUser.image,
                role: 'user', // Lokalnie zawsze user, admina można zmienić ręcznie
                // Brak hasła - logowanie tylko przez SSO
            }).returning();
            localUser = newUser;
        } else {
            // Aktualizujemy dane użytkownika (imię, avatar mogły się zmienić)
            await db.update(users)
                .set({
                    name: ssoUser.name,
                    image: ssoUser.image,
                })
                .where(eq(users.id, localUser.id));
        }

        // Sprawdzamy czy użytkownik nie jest zablokowany lokalnie
        if (localUser.isBlocked) {
            return NextResponse.redirect(new URL('/login?error=blocked', baseUrl));
        }

        // Ustawiamy ciasteczko sesji SSO (przechowuje ID użytkownika)
        const cookieStore = await cookies();
        const sessionData = {
            userId: localUser.id,
            email: ssoUser.email,
            name: ssoUser.name,
            role: localUser.role,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 dni
        };

        cookieStore.set('sso-session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 dni
            path: '/',
        });

        // Sukces - przekierowanie do aplikacji
        return NextResponse.redirect(new URL('/learn', baseUrl));

    } catch (error) {
        console.error('SSO callback error:', error);
        return NextResponse.redirect(new URL('/login?error=server_error', baseUrl));
    }
}

