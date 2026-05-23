import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    sanitizeString,
    detectSQLInjection,
    detectXSS,
    logSecurityEvent,
    getClientIP,
    checkLoginRateLimit
} from '@/lib/security';

export async function POST(req: Request) {
    try {
        const ip = getClientIP(req);

        const rateLimit = checkLoginRateLimit(`admin:${ip}`);
        if (!rateLimit.allowed) {
            logSecurityEvent('RATE_LIMIT', ip, '/api/admin/login', 'Tentativas de login admin excedidas');
            return NextResponse.json({
                success: false,
                message: 'Muitas tentativas. Tente novamente em 5 minutos.'
            }, { status: 429 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({
                success: false,
                message: 'Invalid request body'
            }, { status: 400 });
        }

        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({
                success: false,
                message: 'Credenciais obrigatórias'
            }, { status: 400 });
        }

        if (detectSQLInjection(username) || detectXSS(username)) {
            logSecurityEvent('SQL_INJECTION', ip, '/api/admin/login', `Ataque no username: ${username.slice(0, 30)}`);
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        if (detectSQLInjection(password) || detectXSS(password)) {
            logSecurityEvent('SQL_INJECTION', ip, '/api/admin/login', 'Ataque na senha');
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        const sanitizedUsername = sanitizeString(username).slice(0, 50);

        if (
            process.env.ADMIN_USER &&
            process.env.ADMIN_PASS &&
            sanitizedUsername === process.env.ADMIN_USER &&
            password === process.env.ADMIN_PASS
        ) {
            const token = await signToken({ userId: 'admin-env', role: 'ADMIN' });

            const cookieStore = await cookies();
            cookieStore.set('admin_token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7
            });

            console.log(`[Admin Login] Login bem-sucedido via ENV - IP: ${ip}`);

            return NextResponse.json({
                success: true,
                data: encryptData({ message: 'Login successful' })
            });
        }

        const emailToCheck = sanitizedUsername === 'admin' ? 'admin@admin.com' : sanitizedUsername;

        const user = await prisma.user.findUnique({
            where: { email: emailToCheck }
        });

        if (user && user.role === 'ADMIN' && user.password === password) {
            const token = await signToken({ userId: user.id, role: user.role });

            const cookieStore = await cookies();
            cookieStore.set('admin_token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7
            });

            console.log(`[Admin Login] Login bem-sucedido via DB - IP: ${ip} - User: ${emailToCheck}`);

            return NextResponse.json({
                success: true,
                data: encryptData({ message: 'Login successful' })
            });
        }

        logSecurityEvent('SUSPICIOUS', ip, '/api/admin/login', `Tentativa de login admin falhou: ${sanitizedUsername}`);

        return NextResponse.json({
            success: false,
            message: 'Invalid credentials'
        }, { status: 401 });
    } catch (error) {
        console.error('[Admin Login] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
