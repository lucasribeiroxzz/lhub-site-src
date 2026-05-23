import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lhubff.com.br';

export async function GET() {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${SITE_URL}/api/auth/discord/callback`;

    console.log('[Discord OAuth] Using redirect URI:', redirectUri);

    if (!clientId) {
        return NextResponse.json({ error: 'Discord OAuth não configurado' }, { status: 500 });
    }

    const scope = 'identify email';

    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);

    console.log('[Discord OAuth] Redirecting to:', authUrl.toString());

    return NextResponse.redirect(authUrl.toString());
}
