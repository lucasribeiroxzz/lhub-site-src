export function sanitizeString(input: string | null | undefined): string {
    if (!input) return '';

    return String(input)

        .replace(/<[^>]*>/g, '')

        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\

        .replace(/[\x00-\x1F\x7F]/g, '')

        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
}

export function sanitizeMessage(input: string | null | undefined): string {
    if (!input) return '';

    return String(input)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .slice(0, 500);
}

export function sanitizeEmail(email: string | null | undefined): string {
    if (!email) return '';

    return String(email)
        .toLowerCase()
        .trim()
        .replace(/[<>'"`;\\]/g, '')
        .slice(0, 254);
}

export function sanitizeUID(uid: string | null | undefined): string {
    if (!uid) return '';

    return String(uid)
        .replace(/[^0-9]/g, '')
        .slice(0, 20);
}

export function sanitizeUsername(name: string | null | undefined): string {
    if (!name) return '';

    return String(name)
        .replace(/<[^>]*>/g, '')
        .replace(/[<>'"`;\\&]/g, '')
        .trim()
        .slice(0, 50);
}

export function sanitizeURL(url: string | null | undefined): string {
    if (!url) return '';

    const sanitized = String(url).trim();

    if (/^(javascript|data|vbscript):/i.test(sanitized)) {
        return '';
    }

    return sanitized.slice(0, 2000);
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key of Object.keys(obj)) {
        const value = obj[key];

        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

export function isValidUID(uid: string): boolean {
    if (!uid || typeof uid !== 'string') return false;

    return /^\d{5,20}$/.test(uid);
}

export function isValidPassword(password: string): boolean {
    if (!password || typeof password !== 'string') return false;

    return password.length >= 6 && password.length <= 128;
}

export function isValidName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;

    const sanitized = name.trim();
    return sanitized.length >= 2 &&
        sanitized.length <= 50 &&
        !/[<>'"`;\\]/.test(sanitized);
}

export function isValidAmount(amount: number): boolean {
    return typeof amount === 'number' &&
        !isNaN(amount) &&
        isFinite(amount) &&
        amount >= 0 &&
        amount <= 1000000;
}

export function isValidApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;

    return /^lhub_[a-zA-Z0-9]{28,}$/.test(key) ||
        /^[a-zA-Z0-9]{32,}$/.test(key);
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (rateLimitStore.size > 10000) {
        for (const [key, val] of rateLimitStore.entries()) {
            if (val.resetTime < now) {
                rateLimitStore.delete(key);
            }
        }
    }

    if (!entry || entry.resetTime < now) {

        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now
    };
}

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    return checkRateLimit(`login:${identifier}`, 5, 300000);
}

export function checkApiRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    return checkRateLimit(`api:${identifier}`, 100, 60000);
}

export function checkPurchaseRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    return checkRateLimit(`purchase:${identifier}`, 10, 60000);
}

const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId: string): string {
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);

    csrfTokens.set(sessionId, {
        token,
        expires: Date.now() + 3600000
    });

    if (csrfTokens.size > 10000) {
        const now = Date.now();
        for (const [key, val] of csrfTokens.entries()) {
            if (val.expires < now) {
                csrfTokens.delete(key);
            }
        }
    }

    return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
    const entry = csrfTokens.get(sessionId);

    if (!entry) return false;
    if (entry.expires < Date.now()) {
        csrfTokens.delete(sessionId);
        return false;
    }

    return entry.token === token;
}

export function detectSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
        /(--|#|\/\*|\*\/)/,
        /(\bEXEC\b|\bEXECUTE\b)/i,
        /(\bxp_\w+)/i,
        /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i,
        /('\s*(OR|AND)\s*')/i,
        /(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
}

export function detectXSS(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*img[^>]+onerror/gi,
        /<\s*svg[^>]+onload/gi,
        /<\s*iframe/gi,
        /<\s*object/gi,
        /<\s*embed/gi,
        /expression\s*\(/gi,
        /url\s*\(\s*['"]?\s*javascript/gi,
        /data:\s*text\/html/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}

export function detectPathTraversal(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    const patterns = [
        /\.\.\
        /\.\.\\/,
        /%2e%2e%2f/i,
        /%2e%2e\
        /\.\.%2f/i,
        /%252e%252e%252f/i
    ];

    return patterns.some(pattern => pattern.test(input));
}

export function isInputSafe(input: string): boolean {
    if (!input || typeof input !== 'string') return true;

    return !detectSQLInjection(input) &&
        !detectXSS(input) &&
        !detectPathTraversal(input);
}

export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.brevo.com https://www.google.com https://discord.com",
            "frame-src 'self' https://www.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ')
    };
}

interface SecurityLog {
    timestamp: string;
    type: 'XSS' | 'SQL_INJECTION' | 'RATE_LIMIT' | 'CSRF' | 'PATH_TRAVERSAL' | 'SUSPICIOUS';
    ip: string;
    path: string;
    details: string;
}

const securityLogs: SecurityLog[] = [];
const MAX_SECURITY_LOGS = 1000;

export function logSecurityEvent(
    type: SecurityLog['type'],
    ip: string,
    path: string,
    details: string
): void {
    const log: SecurityLog = {
        timestamp: new Date().toISOString(),
        type,
        ip: ip || 'unknown',
        path,
        details: details.slice(0, 500)
    };

    securityLogs.unshift(log);

    if (securityLogs.length > MAX_SECURITY_LOGS) {
        securityLogs.pop();
    }

    console.warn(`[SECURITY] ${type} - IP: ${ip} - Path: ${path} - ${details}`);
}

export function getSecurityLogs(limit: number = 100): SecurityLog[] {
    return securityLogs.slice(0, limit);
}

const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, number>();

export function blockIP(ip: string): void {
    blockedIPs.add(ip);
    console.warn(`[SECURITY] IP bloqueado: ${ip}`);
}

export function isIPBlocked(ip: string): boolean {
    return blockedIPs.has(ip);
}

export function recordSuspiciousActivity(ip: string): void {
    const count = (suspiciousIPs.get(ip) || 0) + 1;
    suspiciousIPs.set(ip, count);

    if (count >= 10) {
        blockIP(ip);
        suspiciousIPs.delete(ip);
    }
}

export function getClientIP(request: Request): string {
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

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitizedData?: Record<string, any>;
}

export function validateRequestBody(
    body: any,
    schema: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'email' | 'uid' | 'password';
        required?: boolean;
        maxLength?: number;
        minLength?: number;
        min?: number;
        max?: number;
    }>
): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    if (!body || typeof body !== 'object') {
        return { valid: false, errors: ['Body inválido'] };
    }

    for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`Campo '${field}' é obrigatório`);
            continue;
        }

        if (value === undefined || value === null) {
            continue;
        }

        switch (rules.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`Campo '${field}' deve ser string`);
                } else {
                    const sanitized = sanitizeString(value);
                    if (rules.maxLength && sanitized.length > rules.maxLength) {
                        errors.push(`Campo '${field}' excede tamanho máximo de ${rules.maxLength}`);
                    }
                    if (rules.minLength && sanitized.length < rules.minLength) {
                        errors.push(`Campo '${field}' deve ter no mínimo ${rules.minLength} caracteres`);
                    }
                    sanitizedData[field] = sanitized;
                }
                break;

            case 'email':
                const sanitizedEmail = sanitizeEmail(value);
                if (!isValidEmail(sanitizedEmail)) {
                    errors.push(`Campo '${field}' deve ser um email válido`);
                }
                sanitizedData[field] = sanitizedEmail;
                break;

            case 'uid':
                const sanitizedUID = sanitizeUID(value);
                if (!isValidUID(sanitizedUID)) {
                    errors.push(`Campo '${field}' deve ser um UID válido (5-20 dígitos)`);
                }
                sanitizedData[field] = sanitizedUID;
                break;

            case 'password':
                if (!isValidPassword(value)) {
                    errors.push(`Campo '${field}' deve ter entre 6 e 128 caracteres`);
                }
                sanitizedData[field] = value;
                break;

            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`Campo '${field}' deve ser um número`);
                } else {
                    if (rules.min !== undefined && num < rules.min) {
                        errors.push(`Campo '${field}' deve ser no mínimo ${rules.min}`);
                    }
                    if (rules.max !== undefined && num > rules.max) {
                        errors.push(`Campo '${field}' deve ser no máximo ${rules.max}`);
                    }
                    sanitizedData[field] = num;
                }
                break;

            case 'boolean':
                sanitizedData[field] = Boolean(value);
                break;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
}
