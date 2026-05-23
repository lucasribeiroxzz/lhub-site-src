import { NextResponse } from "next/server";
import { findUserByEmail, updateUser } from "@/lib/db";
import { rateLimiter } from "@/lib/utils";
import {
    sanitizeEmail,
    isValidEmail,
    isValidPassword,
    detectSQLInjection,
    detectXSS,
    logSecurityEvent,
    getClientIP
} from "@/lib/security";

export async function POST(request: Request) {
    console.log('[ResetPassword] Iniciando requisição');

    try {
        const ip = getClientIP(request);

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Requisição inválida" },
                { status: 400 }
            );
        }

        const { email, code, newPassword } = body;

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: "Todos os campos são obrigatórios" },
                { status: 400 }
            );
        }

        if (detectSQLInjection(email) || detectXSS(email)) {
            logSecurityEvent('SQL_INJECTION', ip, '/api/auth/reset-password', 'Tentativa de ataque no email');
            return NextResponse.json(
                { error: "Dados inválidos" },
                { status: 400 }
            );
        }

        if (detectSQLInjection(newPassword) || detectXSS(newPassword)) {
            logSecurityEvent('SQL_INJECTION', ip, '/api/auth/reset-password', 'Tentativa de ataque na senha');
            return NextResponse.json(
                { error: "Dados inválidos" },
                { status: 400 }
            );
        }

        const sanitizedEmail = sanitizeEmail(email);
        if (!isValidEmail(sanitizedEmail)) {
            return NextResponse.json(
                { error: "Email inválido" },
                { status: 400 }
            );
        }

        if (!isValidPassword(newPassword)) {
            return NextResponse.json(
                { error: "A senha deve ter pelo menos 6 caracteres" },
                { status: 400 }
            );
        }

        const user = findUserByEmail(sanitizedEmail);

        if (!user) {
            console.log('[ResetPassword] Usuário não encontrado:', sanitizedEmail);
            return NextResponse.json(
                { error: "Código inválido ou expirado" },
                { status: 400 }
            );
        }

        if (!user.otp || user.otp !== code) {
            console.log('[ResetPassword] Código inválido para:', sanitizedEmail);
            logSecurityEvent('SUSPICIOUS', ip, '/api/auth/reset-password', `Código inválido para: ${sanitizedEmail}`);
            return NextResponse.json(
                { error: "Código inválido ou expirado" },
                { status: 400 }
            );
        }

        if (!user.otpExpires || Date.now() > user.otpExpires) {
            console.log('[ResetPassword] Código expirado para:', sanitizedEmail);
            return NextResponse.json(
                { error: "Código expirado. Solicite um novo." },
                { status: 400 }
            );
        }

        updateUser(sanitizedEmail, {
            password: newPassword,
            otp: undefined,
            otpExpires: undefined
        });

        console.log('[ResetPassword] Senha alterada com sucesso para:', sanitizedEmail);

        return NextResponse.json({
            success: true,
            message: "Senha alterada com sucesso!"
        });

    } catch (error: any) {
        console.error('[ResetPassword] Erro:', error);
        return NextResponse.json(
            { error: "Erro interno" },
            { status: 500 }
        );
    }
}
