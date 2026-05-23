import { NextResponse } from "next/server";
import { findUserByEmail, updateUser } from "@/lib/db";
import { rateLimiter } from "@/lib/utils";
import {
    sanitizeEmail,
    isValidEmail,
    detectSQLInjection,
    detectXSS,
    logSecurityEvent,
    getClientIP
} from "@/lib/security";

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@lhub.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'LHUB';

async function sendPasswordResetEmail(email: string, code: string, name: string): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.log('[Email] Brevo API key not configured. Email not sent.');
        return false;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">LHUB</h1>
                                <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Recuperação de Senha</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Olá, ${name}! 🔐</h2>
                                <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
                                    Você solicitou a recuperação de senha da sua conta.
                                </p>
                                <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
                                    Use o código abaixo para redefinir sua senha:
                                </p>
                                <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
                                    <span style="color: #a855f7; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                                </div>
                                <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
                                    <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                                        ⚠️ <strong>Importante:</strong> Este código expira em 15 minutos. 
                                        Se você não solicitou a recuperação de senha, ignore este email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #0f0f0f; padding: 25px 30px; text-align: center; border-top: 1px solid #262626;">
                                <p style="margin: 0; color: #525252; font-size: 12px;">
                                    © 2026 LHUB - Todos os direitos reservados
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_SENDER_NAME,
                    email: BREVO_SENDER_EMAIL,
                },
                to: [{ email }],
                subject: '🔐 Código de Recuperação de Senha - LHUB',
                htmlContent,
            }),
        });

        if (response.ok) {
            console.log('[Email] Password reset email sent to:', email);
            return true;
        } else {
            const error = await response.json();
            console.error('[Email] Failed to send password reset email:', error);
            return false;
        }
    } catch (error) {
        console.error('[Email] Error sending password reset email:', error);
        return false;
    }
}

function generateCode(): string {

    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    console.log('[ForgotPassword] Iniciando requisição');

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

        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email é obrigatório" },
                { status: 400 }
            );
        }

        if (detectSQLInjection(email) || detectXSS(email)) {
            logSecurityEvent('SQL_INJECTION', ip, '/api/auth/forgot-password', `Tentativa de ataque: ${email.slice(0, 50)}`);
            return NextResponse.json(
                { error: "Email inválido" },
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

        const user = findUserByEmail(sanitizedEmail);

        if (!user) {
            console.log('[ForgotPassword] Usuário não encontrado:', sanitizedEmail);
            return NextResponse.json({
                success: true,
                message: "Se o email estiver cadastrado, você receberá um código de recuperação."
            });
        }

        const code = generateCode();
        const expiresAt = Date.now() + 15 * 60 * 1000;

        updateUser(sanitizedEmail, {
            otp: code,
            otpExpires: expiresAt
        });

        const emailSent = await sendPasswordResetEmail(sanitizedEmail, code, user.name);

        if (!emailSent) {
            console.error('[ForgotPassword] Falha ao enviar email');
            return NextResponse.json(
                { error: "Erro ao enviar email. Tente novamente." },
                { status: 500 }
            );
        }

        console.log('[ForgotPassword] Código enviado para:', sanitizedEmail);

        return NextResponse.json({
            success: true,
            message: "Se o email estiver cadastrado, você receberá um código de recuperação."
        });

    } catch (error: any) {
        console.error('[ForgotPassword] Erro:', error);
        return NextResponse.json(
            { error: "Erro interno" },
            { status: 500 }
        );
    }
}
