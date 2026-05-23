import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from '@/lib/auth';
import { findUserByEmail, updateUser, getUsers } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lhubff.com.br';

interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
    global_name?: string;
}

async function exchangeCodeForToken(code: string): Promise<string> {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    const redirectUri = process.env.DISCORD_REDIRECT_URI || `${SITE_URL}/api/auth/discord/callback`;

    console.log('[Discord OAuth] Exchanging code with redirect URI:', redirectUri);

    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Discord OAuth] Token exchange failed:', error);
        throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data.access_token;
}

async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get Discord user');
    }

    return response.json();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        console.error('[Discord OAuth] Error:', error);
        return NextResponse.redirect(`${SITE_URL}/login?error=discord_denied`);
    }

    if (!code) {
        return NextResponse.redirect(`${SITE_URL}/login?error=no_code`);
    }

    let linkingEmail: string | null = null;
    if (state) {
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            if (stateData.action === 'link' && stateData.email) {
                linkingEmail = stateData.email;
                console.log('[Discord OAuth] Linking mode for user:', linkingEmail);
            }
        } catch (e) {
            console.error('[Discord OAuth] Failed to parse state:', e);
        }
    }

    try {

        const accessToken = await exchangeCodeForToken(code);

        const discordUser = await getDiscordUser(accessToken);
        console.log('[Discord OAuth] User:', discordUser.username, discordUser.id);

        if (linkingEmail) {
            const user = findUserByEmail(linkingEmail);

            if (!user) {
                console.log('[Discord OAuth] User not found for linking:', linkingEmail);
                return NextResponse.redirect(`${SITE_URL}/login?error=user_not_found`);
            }

            const users = getUsers();
            const existingDiscordUser = users.find(u => u.discordId === discordUser.id && u.email !== user.email);

            if (existingDiscordUser) {
                console.log('[Discord OAuth] Discord already linked to another account');
                return NextResponse.redirect(`${SITE_URL}/dashboard/perfil?error=discord_already_linked`);
            }

            updateUser(user.email, {
                discordId: discordUser.id,
                discordUsername: discordUser.global_name || discordUser.username,
                discordAvatar: discordUser.avatar || undefined
            });

            console.log('[Discord OAuth] Successfully linked Discord to user:', user.email);
            return NextResponse.redirect(`${SITE_URL}/dashboard/perfil?success=discord_linked`);
        }

        const cookieStore = await cookies();
        const existingToken = cookieStore.get('user_token')?.value;

        console.log('[Discord OAuth] Existing token found:', !!existingToken);

        if (existingToken) {
            try {
                const decoded = await verifyToken(existingToken);
                console.log('[Discord OAuth] Decoded token:', decoded);

                if (decoded && typeof decoded.email === 'string') {
                    const user = findUserByEmail(decoded.email);
                    console.log('[Discord OAuth] Found user:', user?.email);

                    if (user) {

                        const users = getUsers();
                        const existingDiscordUser = users.find(u => u.discordId === discordUser.id && u.email !== user.email);

                        if (existingDiscordUser) {
                            return NextResponse.redirect(`${SITE_URL}/dashboard/perfil?error=discord_already_linked`);
                        }

                        updateUser(user.email, {
                            discordId: discordUser.id,
                            discordUsername: discordUser.global_name || discordUser.username,
                            discordAvatar: discordUser.avatar || undefined
                        });

                        console.log('[Discord OAuth] Linked Discord to user:', user.email);
                        return NextResponse.redirect(`${SITE_URL}/dashboard/perfil?success=discord_linked`);
                    }
                }
            } catch (e) {
                console.error('[Discord OAuth] Token verify error:', e);

            }
        }

        const users = getUsers();
        const user = users.find(u => u.discordId === discordUser.id);

        if (!user) {

            console.log('[Discord OAuth] Discord not linked to any account:', discordUser.username);
            return NextResponse.redirect(`${SITE_URL}/login?error=discord_not_linked`);
        }

        console.log('[Discord OAuth] Logging in existing user:', user.email);

        const token = await signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });

        try {
            const { notifyDiscordLogin } = await import('@/lib/discord');
            await notifyDiscordLogin(user.email, user.name, discordUser.global_name || discordUser.username);
        } catch (e) {
            console.error('[Discord OAuth] Erro ao notificar webhook:', e);
        }

        const response = NextResponse.redirect(`${SITE_URL}/dashboard`);
        response.cookies.set('user_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        });

        response.cookies.set('user_session', JSON.stringify({ name: user.name, email: user.email }), {
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        });

        return response;

    } catch (error: any) {
        console.error('[Discord OAuth] Error:', error);
        return NextResponse.redirect(`${SITE_URL}/login?error=discord_failed`);
    }
}
