import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import { rateLimiter } from "@/lib/utils";
import { findUserByEmail } from "@/lib/db";
import {
    sanitizeEmail,
    isValidEmail,
    isValidPassword,
    detectXSS,
    logSecurityEvent,
    getClientIP
} from "@/lib/security";
import { notifyLogin, notifyError } from "@/lib/discord";
import { sendLoginAlertEmail } from "@/lib/email";

async function verifyRecaptcha(token: string): Promise<{ success: boolean; errorCodes?: string[] }> {
    const secret = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    if (!token || token.trim() === '') {
        console.log('[Login] reCAPTCHA: Token vazio ou não fornecido');
        return { success: false, errorCodes: ['missing-input-response'] };
    }

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });
        const data = await response.json();

        console.log('[Login] reCAPTCHA response:', JSON.stringify(data));

        if (!data.success) {
            console.log('[Login] reCAPTCHA falhou. Error codes:', data['error-codes']);
        }

        return {
            success: data.success === true,
            errorCodes: data['error-codes'] || []
        };
    } catch (error) {
        console.error("[Login] reCAPTCHA verification error:", error);
        return { success: false, errorCodes: ['network-error'] };
    }
}

export async function POST(request: Request) {
    console.log('[Login] Iniciando requisição de login');

    try {
        const ip = getClientIP(request);
        console.log('[Login] IP do cliente:', ip);

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const { email, password, captchaToken } = body;

        if (!email || !password) {
            console.log('[Login] Erro: Campos obrigatórios faltando');
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (detectXSS(email)) {
            logSecurityEvent('XSS', ip, '/api/auth/login', `Tentativa de ataque XSS no email`);
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const sanitizedEmail = sanitizeEmail(email);
        if (!isValidEmail(sanitizedEmail)) {
            console.log('[Login] Erro: Email inválido');
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        if (!isValidPassword(password)) {
            console.log('[Login] Erro: Senha inválida');
            return NextResponse.json(
                { error: "Invalid password format" },
                { status: 400 }
            );
        }

        if (!captchaToken) {
            console.log('[Login] Erro: Captcha não preenchido');
            return NextResponse.json(
                { error: "Please complete the captcha" },
                { status: 400 }
            );
        }

        console.log('[Login] Verificando reCAPTCHA...');
        const recaptchaResult = await verifyRecaptcha(captchaToken);
        if (!recaptchaResult.success) {
            console.log('[Login] Erro: reCAPTCHA inválido. Códigos:', recaptchaResult.errorCodes);
            logSecurityEvent('SUSPICIOUS', ip, '/api/auth/login', `Falha na verificação do reCAPTCHA: ${recaptchaResult.errorCodes?.join(', ') || 'unknown'}`);
            return NextResponse.json(
                { error: "Captcha verification failed" },
                { status: 400 }
            );
        }

        console.log('[Login] Buscando usuário...');
        const user = findUserByEmail(sanitizedEmail);

        if (!user) {
            console.log('[Login] Erro: Usuário não encontrado');

            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        if (user.password !== password) {
            console.log('[Login] Erro: Senha incorreta');
            logSecurityEvent('SUSPICIOUS', ip, '/api/auth/login', `Senha incorreta para: ${sanitizedEmail}`);
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        console.log('[Login] Credenciais válidas. Criando sessão...');

        const cookieStore = await cookies();

        const token = await signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });

        cookieStore.set("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });

        cookieStore.set("user_session", JSON.stringify({ name: user.name, email: user.email }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });

        console.log('[Login] Login realizado com sucesso para:', user.email);

        await notifyLogin(user.email, user.name);

        const userAgent = request.headers.get('user-agent') || 'Desconhecido';
        const loginDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        (async () => {
            try {
                let location = 'Localização desconhecida';
                try {
                    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,regionName`, { signal: AbortSignal.timeout(3000) });
                    if (geoRes.ok) {
                        const geoData = await geoRes.json();
                        if (geoData.city && geoData.country) {
                            location = `${geoData.city}, ${geoData.regionName || ''}, ${geoData.country}`.replace(', ,', ',');
                        }
                    }
                } catch {  }

                await sendLoginAlertEmail(user.email, user.name, ip, location, userAgent, loginDate);
            } catch (e) {
                console.error('[Login] Erro ao enviar email de alerta:', e);
            }
        })();

        const { encryptData } = await import('@/lib/crypto');

        return NextResponse.json({
            success: true,
            data: encryptData({
                user: { name: user.name, email: user.email },
                message: "Login successful"
            })
        });
    } catch (error: any) {
        console.error("[Login] Erro geral:", error);

        await notifyError('Login', error.message || 'Unknown Error', error.stack);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
