import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    createApiKey,
    getUserApiKeys,
    deleteApiKey,
    toggleApiKey
} from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const userId = payload.email as string;
        const apiKeys = getUserApiKeys(userId);

        const maskedKeys = apiKeys.map(k => ({
            ...k,
            key: k.key.substring(0, 10) + '...' + k.key.substring(k.key.length - 4)
        }));

        return NextResponse.json({
            success: true,
            data: encryptData(maskedKeys)
        });
    } catch (error) {
        console.error('[ApiKey GET] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const userId = payload.email as string;
        const body = await req.json();
        const { name } = body;

        if (!name || name.trim().length < 3) {
            return NextResponse.json({ success: false, message: 'Nome deve ter pelo menos 3 caracteres' }, { status: 400 });
        }

        const existingKeys = getUserApiKeys(userId);
        if (existingKeys.length >= 5) {
            return NextResponse.json({ success: false, message: 'Limite de 5 API keys atingido' }, { status: 400 });
        }

        const apiKey = createApiKey(userId, name.trim());

        return NextResponse.json({
            success: true,
            data: encryptData({
                ...apiKey,

                fullKey: apiKey.key
            }),
            message: 'API Key criada com sucesso! Guarde-a em um lugar seguro.'
        });
    } catch (error) {
        console.error('[ApiKey POST] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const userId = payload.email as string;
        const body = await req.json();
        const { keyId } = body;

        if (!keyId) {
            return NextResponse.json({ success: false, message: 'Key ID é obrigatório' }, { status: 400 });
        }

        const deleted = deleteApiKey(userId, keyId);

        if (!deleted) {
            return NextResponse.json({ success: false, message: 'API Key não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'API Key removida com sucesso' });
    } catch (error) {
        console.error('[ApiKey DELETE] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const userId = payload.email as string;
        const body = await req.json();
        const { keyId } = body;

        if (!keyId) {
            return NextResponse.json({ success: false, message: 'Key ID é obrigatório' }, { status: 400 });
        }

        const updatedKey = toggleApiKey(userId, keyId);

        if (!updatedKey) {
            return NextResponse.json({ success: false, message: 'API Key não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: encryptData(updatedKey),
            message: updatedKey.active ? 'API Key ativada' : 'API Key desativada'
        });
    } catch (error) {
        console.error('[ApiKey PUT] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
