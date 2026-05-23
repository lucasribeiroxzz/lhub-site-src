import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    findUserByEmail,
    addStreamingKeys,
    getAllStreamingKeys,
    deleteStreamingKey,
    getStreamingKeyStats,
    StreamingPlatform,
    STREAMING_PRODUCTS
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
            return NextResponse.json({ success: false, message: "Sem permissão" }, { status: 403 });
        }

        const keys = getAllStreamingKeys();
        const stats = getStreamingKeyStats();

        const platformStats = Object.keys(STREAMING_PRODUCTS).map(platform => {
            const platformKeys = keys.filter(k => k.platform === platform);
            const available = platformKeys.filter(k => !k.sold).length;
            const sold = platformKeys.filter(k => k.sold).length;
            return { platform, count: available, sold };
        });

        return NextResponse.json({
            success: true,
            data: {
                platforms: platformStats,
                total: stats.total || 0,
                available: stats.available || 0,
                sold: stats.sold || 0
            }
        });

    } catch (error) {
        console.error('[Admin Streaming Keys] Erro:', error);
        return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
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
            return NextResponse.json({ success: false, message: "Sem permissão" }, { status: 403 });
        }

        const body = await req.json();
        const { keys, platform } = body;

        if (!keys || typeof keys !== 'string') {
            return NextResponse.json({
                success: false,
                message: "Dados inválidos. Envie as keys em formato texto (uma por linha)."
            }, { status: 400 });
        }

        const validPlatforms: StreamingPlatform[] = ['hbomax', 'primevideo', 'crunchyroll', 'paramount', 'canvapro', 'disney'];
        if (!platform || !validPlatforms.includes(platform)) {
            return NextResponse.json({
                success: false,
                message: "Plataforma inválida. Use: hbomax, primevideo, crunchyroll, paramount, canvapro ou disney"
            }, { status: 400 });
        }

        const result = addStreamingKeys(keys, platform, admin.email);

        return NextResponse.json({
            success: true,
            message: `${result.added} key(s) adicionada(s) para ${STREAMING_PRODUCTS[platform as StreamingPlatform].name}`,
            data: {
                added: result.added,
                errors: result.errors
            }
        });

    } catch (error) {
        console.error('[Admin Streaming Keys] Erro ao adicionar:', error);
        return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
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
            return NextResponse.json({ success: false, message: "Sem permissão" }, { status: 403 });
        }

        const body = await req.json();
        const { keyId } = body;

        if (!keyId) {
            return NextResponse.json({ success: false, message: "ID da key não informado" }, { status: 400 });
        }

        const deleted = deleteStreamingKey(keyId);

        if (deleted) {
            return NextResponse.json({ success: true, message: "Key removida com sucesso" });
        } else {
            return NextResponse.json({ success: false, message: "Key não encontrada" }, { status: 404 });
        }

    } catch (error) {
        console.error('[Admin Streaming Keys] Erro ao deletar:', error);
        return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
    }
}
