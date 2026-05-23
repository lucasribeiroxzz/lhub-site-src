import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { findUserByEmail, createUser, getUsers, findUserByAffiliateCode, createAffiliateRelation } from "@/lib/db";
import { notifyNewUser, notifyError } from "@/lib/discord";
import { signToken } from "@/lib/auth";
import {
    sanitizeEmail,
    sanitizeUsername,
    sanitizeString,
    isValidEmail,
    isValidPassword,
    isValidName,
    detectXSS,
    logSecurityEvent,
    getClientIP,
    checkRateLimit
} from "@/lib/security";

async function verifyRecaptcha(token: string): Promise<{ success: boolean; errorCodes?: string[] }> {
    const secret = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    if (!token || token.trim() === '') {
        console.log('[Register] reCAPTCHA: Token vazio ou não fornecido');
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

        console.log('[Register] reCAPTCHA response:', JSON.stringify(data));

        if (!data.success) {
            console.log('[Register] reCAPTCHA falhou. Error codes:', data['error-codes']);
        }

        return {
            success: data.success === true,
            errorCodes: data['error-codes'] || []
        };
    } catch (error) {
        console.error("[Register] reCAPTCHA verification error:", error);
        return { success: false, errorCodes: ['network-error'] };
    }
}

export async function POST(request: Request) {
    console.log('[Register] Iniciando registro de usuário');

    try {
        const ip = getClientIP(request);
        console.log('[Register] IP do cliente:', ip);

        const rateLimit = checkRateLimit(`register:${ip}`, 3, 300000);
        if (!rateLimit.allowed) {
            logSecurityEvent('RATE_LIMIT', ip, '/api/auth/register', 'Tentativas de registro excedidas');
            return NextResponse.json(
                { error: "Muitas tentativas. Tente novamente mais tarde." },
                { status: 429 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const { name, email, password, captchaToken, referralCode } = body;

        if (!name || !email || !password) {
            console.log('[Register] Erro: Campos obrigatórios faltando');
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const inputs = [name, email, referralCode].filter(Boolean);
        for (const input of inputs) {
            if (detectXSS(input)) {
                logSecurityEvent('XSS', ip, '/api/auth/register', `Tentativa de ataque XSS detectada`);
                return NextResponse.json(
                    { error: "Invalid input detected" },
                    { status: 400 }
                );
            }
        }

        const sanitizedName = sanitizeUsername(name);
        const sanitizedEmail = sanitizeEmail(email);
        const sanitizedReferralCode = referralCode ? sanitizeString(referralCode) : null;

        if (!isValidName(sanitizedName)) {
            return NextResponse.json(
                { error: "Nome inválido. Use entre 2 e 50 caracteres." },
                { status: 400 }
            );
        }

        if (!isValidEmail(sanitizedEmail)) {
            return NextResponse.json(
                { error: "Email inválido." },
                { status: 400 }
            );
        }

        if (!isValidPassword(password)) {
            return NextResponse.json(
                { error: "Senha deve ter entre 6 e 128 caracteres." },
                { status: 400 }
            );
        }

        if (!captchaToken) {
            console.log('[Register] Erro: Captcha não preenchido');
            return NextResponse.json(
                { error: "Please complete the captcha" },
                { status: 400 }
            );
        }

        console.log('[Register] Verificando reCAPTCHA...');
        const recaptchaResult = await verifyRecaptcha(captchaToken);
        if (!recaptchaResult.success) {
            console.log('[Register] Erro: reCAPTCHA inválido. Códigos:', recaptchaResult.errorCodes);
            logSecurityEvent('SUSPICIOUS', ip, '/api/auth/register', `Falha na verificação do reCAPTCHA: ${recaptchaResult.errorCodes?.join(', ') || 'unknown'}`);
            return NextResponse.json(
                { error: "Falha na verificação do captcha. Por favor, tente novamente." },
                { status: 400 }
            );
        }

        const existingUser = findUserByEmail(sanitizedEmail);
        if (existingUser) {
            console.log('[Register] Erro: Usuário já existe:', sanitizedEmail);
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const users = getUsers();
        const accountsCount = users.filter(u => u.ipAddress === ip).length;
        console.log('[Register] Contas neste IP:', accountsCount);

        if (accountsCount >= 5) {
            console.log('[Register] Erro: Limite de contas por IP atingido');
            logSecurityEvent('SUSPICIOUS', ip, '/api/auth/register', `Limite de contas atingido (${accountsCount})`);
            return NextResponse.json({ error: "Limite de contas atingido para este IP." }, { status: 429 });
        }

        console.log('[Register] Criando usuário...');
        const newUser = createUser({
            name: sanitizedName,
            email: sanitizedEmail,
            password,
            otp: undefined,
            otpExpires: undefined,
            isVerified: true,
            balance: 0,
            role: 'USER',
            ipAddress: ip
        });

        console.log('[Register] Usuário criado com sucesso:', newUser.id);

        if (sanitizedReferralCode) {
            console.log('[Register] Processando código de afiliado:', sanitizedReferralCode);
            const referrer = findUserByAffiliateCode(sanitizedReferralCode);
            if (referrer && referrer.id !== newUser.id) {
                createAffiliateRelation(referrer.id, newUser.id, sanitizedEmail);
                console.log('[Register] Relação de afiliado criada:', referrer.id, '->', newUser.id);
            }
        }

        await notifyNewUser(sanitizedName, sanitizedEmail);

        await sendWelcomeEmail(sanitizedEmail, sanitizedName);

        const cookieStore = await cookies();

        const token = await signToken({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
        });

        cookieStore.set("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });

        cookieStore.set("user_session", JSON.stringify({ name: newUser.name, email: newUser.email }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });

        console.log('[Register] Auto-login realizado para:', newUser.email);

        return NextResponse.json({
            success: true,
            message: "User registered and logged in successfully.",
            requiresVerification: false,
            email: sanitizedEmail,
            autoLogin: true
        });
    } catch (error: any) {
        console.error('[Register] Erro geral:', error);
        await notifyError('Register', error.message || 'Unknown Error', error.stack);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
