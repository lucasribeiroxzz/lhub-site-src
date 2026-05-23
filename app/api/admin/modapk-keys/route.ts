import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { 
    findUserByEmail,
    addModApkKeys,
    getAllModApkKeys,
    getModApkKeyStats,
    deleteModApkKey,
    MODAPK_PLAN_NAMES,
    MODAPK_PLAN_PRICES
} from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const allKeys = getAllModApkKeys();
        const stats = getModApkKeyStats();

        return NextResponse.json({
            success: true,
            data: {
                stats,
                planNames: MODAPK_PLAN_NAMES,
                planPrices: MODAPK_PLAN_PRICES,
                keys: allKeys.map(k => ({
                    ...k,

                    key: k.sold ? k.key.substring(0, 8) + '...' : k.key,
                    planName: MODAPK_PLAN_NAMES[k.planType]
                }))
            }
        });

    } catch (error: any) {
        console.error('[ModApk Keys GET] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const body = await req.json();
        const { keys, planType } = body;

        if (!keys || typeof keys !== 'string') {
            return NextResponse.json({ 
                success: false, 
                message: "Envie as keys (uma por linha)" 
            }, { status: 400 });
        }

        if (!planType || !['daily', 'weekly', 'biweekly', 'monthly'].includes(planType)) {
            return NextResponse.json({ 
                success: false, 
                message: "Tipo de plano inválido. Use: daily, weekly, biweekly ou monthly" 
            }, { status: 400 });
        }

        const result = addModApkKeys(keys, planType, sessionPayload.email as string);

        return NextResponse.json({
            success: true,
            message: `${result.added} key(s) adicionada(s) com sucesso para o plano ${MODAPK_PLAN_NAMES[planType]}!`,
            data: {
                added: result.added,
                errors: result.errors
            }
        });

    } catch (error: any) {
        console.error('[ModApk Keys POST] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const keyId = searchParams.get('id');

        if (!keyId) {
            return NextResponse.json({ success: false, message: "ID da key não informado" }, { status: 400 });
        }

        const deleted = deleteModApkKey(keyId);

        if (!deleted) {
            return NextResponse.json({ success: false, message: "Key não encontrada" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Key removida com sucesso!"
        });

    } catch (error: any) {
        console.error('[ModApk Keys DELETE] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
    }
}
