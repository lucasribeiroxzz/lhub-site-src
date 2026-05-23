import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1463408576159682591/0Agu_iqisd47bOUvzk_ZRDgsEujoGXDtVZKf2IPEm7DiZ3L5dneUkmfuPsPPKGwplaIL";

async function notifyDiscord(request: NextRequest, motivo: string) {
    const ip = getClientIP(request);
    const path = request.nextUrl.pathname;
    

    const city = request.headers.get('x-vercel-ip-city') || 'Desconhecida';
    const country = request.headers.get('x-vercel-ip-country') || 'Desconhecido';
    const ua = request.headers.get('user-agent') || 'Não identificado';

    const payload = {
        embeds: [{
            title: "🛡️ BLOQUEIO POCOYO SECURITY",
            color: 0x0099ff,
            fields: [
                { name: "👤 IP", value: `\`${ip}\``, inline: true },
                { name: "📍 Local", value: `\`${city}, ${country}\``, inline: true },
                { name: "📂 Alvo", value: `\`${path}\``, inline: false },
                { name: "🚩 Motivo", value: motivo, inline: true },
                { name: "🌐 User-Agent", value: `\`${ua}\`` }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Erro Webhook:", e);
    }
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

function checkRateLimit(
    identifier: string, 
    maxRequests: number, 
    windowMs: number
): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);
    
    if (rateLimitStore.size > 5000) {
        for (const [key, val] of rateLimitStore.entries()) {
            if (val.resetTime < now) {
                rateLimitStore.delete(key);
            }
        }
    }
    
    if (!entry || entry.resetTime < now) {
        rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
    }
    
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
}

function recordSuspicious(ip: string): void {
    const count = (suspiciousActivity.get(ip) || 0) + 1;
    suspiciousActivity.set(ip, count);
    
    if (count >= 10) {
        blockedIPs.add(ip);
        suspiciousActivity.delete(ip);
        console.warn(`[SECURITY] IP bloqueado por atividade suspeita: ${ip}`);
    }
}

function detectSQLInjection(input: string): boolean {
    if (!input) return false;
    const patterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
        /(--|#|\/\*|\*\/)/,
        /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
        /('\s*(OR|AND)\s*')/i,
        /(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY)/i
    ];
    return patterns.some(p => p.test(input));
}

function detectXSS(input: string): boolean {
    if (!input) return false;
    const patterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*img[^>]+onerror/gi,
        /<\s*svg[^>]+onload/gi,
        /<\s*iframe/gi,
        /expression\s*\(/gi
    ];
    return patterns.some(p => p.test(input));
}

function detectPathTraversal(input: string): boolean {
    if (!input) return false;
    const patterns = [/\.\.\
    return patterns.some(p => p.test(input));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    return response;
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const ip = getClientIP(request);
    

    if (blockedIPs.has(ip)) {
        console.warn(`[SECURITY] Requisição bloqueada de IP: ${ip}`);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Access denied' }), 
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }
    

    const globalLimit = checkRateLimit(`global:${ip}`, 200, 60000); 
    if (!globalLimit.allowed) {
        console.warn(`[SECURITY] Rate limit excedido para IP: ${ip}`);
        recordSuspicious(ip);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Too many requests' }), 
            { 
                status: 429, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                    'X-RateLimit-Remaining': '0'
                } 
            }
        );
    }
    

    if (path.startsWith('/api/')) {
        const apiLimit = checkRateLimit(`api:${ip}`, 100, 60000); 
        if (!apiLimit.allowed) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'API rate limit exceeded' }), 
                { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
            );
        }
    }
    

    if (path === '/api/auth/login' || path === '/api/admin/login') {
        const loginLimit = checkRateLimit(`login:${ip}`, 5, 300000); 
        if (!loginLimit.allowed) {
            console.warn(`[SECURITY] Tentativas de login excedidas para IP: ${ip}`);
            recordSuspicious(ip);
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Too many login attempts. Try again later.' }), 
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }
    

    if (path.includes('/buy') || path.includes('/shop')) {
        const purchaseLimit = checkRateLimit(`purchase:${ip}`, 10, 60000); 
        if (!purchaseLimit.allowed) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Too many purchase attempts' }), 
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }
    

    const fullUrl = request.url;
    const searchParams = request.nextUrl.search;
    
    if (detectSQLInjection(fullUrl) || detectSQLInjection(searchParams)) {
        console.warn(`[SECURITY] SQL Injection detectado - IP: ${ip} - URL: ${fullUrl}`);
        recordSuspicious(ip);
        await notifyDiscord(request, "SQL Injection Detectado");
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400 });
    }
    
    if (detectXSS(fullUrl) || detectXSS(searchParams)) {
        console.warn(`[SECURITY] XSS detectado - IP: ${ip} - URL: ${fullUrl}`);
        recordSuspicious(ip);
        await notifyDiscord(request, "XSS Detectado");
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400 });
    }
    
    if (detectPathTraversal(path)) {
        console.warn(`[SECURITY] Path Traversal detectado - IP: ${ip} - Path: ${path}`);
        recordSuspicious(ip);
        await notifyDiscord(request, "Path Traversal Detectado");
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400 });
    }
    

    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'gobuster', 'dirbuster'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
        console.warn(`[SECURITY] User-Agent suspeito bloqueado - IP: ${ip} - UA: ${userAgent}`);
        blockedIPs.add(ip);
        return new NextResponse(JSON.stringify({ success: false, message: 'Access denied' }), { status: 403 });
    }
    

    const dangerousExtensions = ['.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb', '.sh', '.bash', '.env', '.git', '.sql', '.bak', '.old', '.backup'];
    if (dangerousExtensions.some(ext => path.toLowerCase().endsWith(ext))) {
        console.warn(`[SECURITY] Tentativa de acesso a arquivo perigoso - IP: ${ip} - Path: ${path}`);
        recordSuspicious(ip);

        if (path.toLowerCase().endsWith('.env')) {

            await notifyDiscord(request, "Tentativa de acesso ao .env");

            return new NextResponse(
                `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Protegido pelo Pocoyo 🛡️</title>

    <!-- Fonte -->
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, #00c2ff 0%, #020024 60%);
            color: #fff;
            font-family: 'Inter', sans-serif;
            text-align: center;
        }

        .card {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(18px);
            border-radius: 32px;
            padding: 40px 35px;
            max-width: 520px;
            width: 90%;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 30px 60px rgba(0,0,0,0.55);
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0); }
        }

        h1 {
            font-family: 'Fredoka One', cursive;
            font-size: 3rem;
            margin: 0;
            text-shadow: 3px 3px 0 #000;
        }

        .subtitle {
            font-size: 1.4rem;
            margin: 20px 0;
            opacity: 0.95;
        }

        .subtitle b {
            color: #ffde59;
        }

        img {
            width: 260px;
            max-width: 100%;
            border-radius: 22px;
            margin: 20px 0;
            border: 4px solid rgba(255,255,255,0.8);
            box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }

        h2 {
            color: #ffde59;
            font-family: 'Fredoka One', cursive;
            margin-top: 25px;
            font-size: 1.8rem;
        }

        .log {
            margin-top: 18px;
            font-size: 0.8rem;
            opacity: 0.65;
            font-family: monospace;
        }

        .badge {
            display: inline-block;
            margin-top: 10px;
            padding: 6px 14px;
            border-radius: 999px;
            background: rgba(0,0,0,0.4);
            font-size: 0.75rem;
            letter-spacing: 1px;
        }
    </style>
</head>

<body>
    <div class="card">
        <h1>Oops! 🐧</h1>

        <p class="subtitle">
            Tentou acessar o <b>.env</b> achando que ia dar bom, né?
        </p>

        <img 
            src="https://media.giphy.com/media/13CoXDiaCcC2EA/giphy.gif" 
            alt="Pocoyo protegendo"
        >

        <h2>POCOYO EM AÇÃO 🛡️</h2>

        <div class="badge">ACESSO BLOQUEADO</div>

        <p class="log">
            IP detectado: ${ip} <br>
            Atividade registrada com sucesso.
        </p>
    </div>
</body>
</html>`,
                { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
        }

        await notifyDiscord(request, `Tentativa de acesso a arquivo perigoso: ${path}`);
        
        return new NextResponse(
            `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acesso Bloqueado | LHUB Security</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #fff;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 48px 32px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
            box-shadow: 0 10px 30px rgba(239,68,68,0.3);
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            background: linear-gradient(to right, #fff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #9ca3af;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .badge {
            display: inline-block;
            background: rgba(239,68,68,0.2);
            border: 1px solid rgba(239,68,68,0.3);
            color: #f87171;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            margin-bottom: 24px;
        }
        .info {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            color: #6b7280;
        }
        .info span { color: #a78bfa; }
        a {
            display: inline-block;
            margin-top: 24px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: #fff;
            padding: 12px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        a:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(139,92,246,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🛡️</div>
        <h1>Acesso Bloqueado</h1>
        <p>Este tipo de arquivo não está disponível neste servidor. Sua tentativa de acesso foi registrada.</p>
        <div class="badge">ARQUIVO PROTEGIDO</div>
        <div class="info">
            <span>IP:</span> ${ip}<br>
            <span>Arquivo:</span> ${path}<br>
            <span>Status:</span> Bloqueado e registrado
        </div>
        <a href="/">Voltar ao início</a>
    </div>
</body>
</html>`,
            { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
    

    if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
        if (path === '/api/admin/login') {
            const response = NextResponse.next();
            return addSecurityHeaders(response);
        }

        const token = request.cookies.get('admin_token')?.value;
        const verifiedPayload = token ? await verifyToken(token) : null;

        if (!verifiedPayload || (verifiedPayload as any).role !== 'ADMIN') {
            if (path === '/dashboard/admin') {
                const response = NextResponse.next();
                return addSecurityHeaders(response);
            }
            if (path.startsWith('/api/')) {
                return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
            }
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }

        const response = NextResponse.next();
        return addSecurityHeaders(response);
    }

    if (path.startsWith('/dashboard')) {
        if (path.startsWith('/dashboard/admin')) {
            const response = NextResponse.next();
            return addSecurityHeaders(response);
        }

        const token = request.cookies.get('user_token')?.value;
        const verifiedPayload = token ? await verifyToken(token) : null;

        if (!verifiedPayload) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        
        const response = NextResponse.next();
        return addSecurityHeaders(response);
    }

    const response = NextResponse.next();
    return addSecurityHeaders(response);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
