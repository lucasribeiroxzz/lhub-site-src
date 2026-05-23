import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lhubff.com.br';

export async function GET() {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${SITE_URL}/api/auth/discord/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Discord OAuth não configurado' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
        console.log('[Discord Link] No token found, redirecting to login');
        return NextResponse.redirect(`${SITE_URL}/login?error=not_logged_in`);
    }

    try {
        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.email !== 'string') {
            return NextResponse.redirect(`${SITE_URL}/login?error=invalid_token`);
        }

        const user = findUserByEmail(decoded.email);
        if (!user) {
            return NextResponse.redirect(`${SITE_URL}/login?error=user_not_found`);
        }

        console.log('[Discord Link] User wants to link Discord:', user.email);

        const stateData = {
            action: 'link',
            email: user.email,
            timestamp: Date.now()
        };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

        const scope = 'identify email';

        const authUrl = new URL('https://discord.com/api/oauth2/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('state', state);

        console.log('[Discord Link] Redirecting to Discord with state');

        return NextResponse.redirect(authUrl.toString());

    } catch (error) {
        console.error('[Discord Link] Error:', error);
        return NextResponse.redirect(`${SITE_URL}/login?error=auth_error`);
    }
}
