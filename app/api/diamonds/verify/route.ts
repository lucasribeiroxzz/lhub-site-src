import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { findUserByEmail, getDiamondStock, checkDiamondPackageUsed, DIAMOND_PACKAGES } from '@/lib/db';

const DIAMONDS_API_BASE = 'https://freefireshop.com.br';
const BLN_DIAMONDS_KEY = process.env.BLN_DIAMONDS_KEY || '';

export async function POST(req: Request) {
    try {

        const cookieStore = await cookies();
        const userToken = cookieStore.get('user_token');
        
        if (!userToken) {
            return NextResponse.json({
                success: false,
                error: 'Não autenticado'
            }, { status: 401 });
        }

        const tokenData = await verifyToken(userToken.value);
        if (!tokenData) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const user = findUserByEmail(tokenData.email as string);
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Usuário não encontrado'
            }, { status: 404 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Body inválido'
            }, { status: 400 });
        }

        const { accessToken, diamondAmount } = body;

        if (!accessToken) {
            return NextResponse.json({
                success: false,
                error: 'accessToken é obrigatório'
            }, { status: 400 });
        }

        const timestamp = new Date().toISOString();

        if (!BLN_DIAMONDS_KEY) {
            console.log(`[${timestamp}] [Diamonds Verify] API Key não configurada`);
            return NextResponse.json({
                success: false,
                error: 'Sistema de diamantes temporariamente indisponível. Configure BLN_DIAMONDS_KEY no .env'
            }, { status: 500 });
        }

        console.log(`[${timestamp}] [Diamonds Verify] Chamando API: ${DIAMONDS_API_BASE}/api/v1/diamonds/verify`);
        
        try {
            const response = await fetch(`${DIAMONDS_API_BASE}/api/v1/diamonds/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '1075559249092034580',
                    key: BLN_DIAMONDS_KEY,
                    accessToken: accessToken,
                    diamondAmount: diamondAmount || '200'
                }),
                signal: AbortSignal.timeout(15000)
            });

            const data = await response.json();
            console.log(`[${timestamp}] [Diamonds Verify] Resposta JSON:`, JSON.stringify(data));

            if (data.status === 'OK' && data.data) {
                return NextResponse.json({
                    success: true,
                    data: {
                        player: {
                            nickname: data.data.player?.name || 'Jogador',
                            level: data.data.player?.level || 0,
                            region: data.data.player?.region || 'BR',
                            uid: data.data.player?.id
                        },
                        canReceive: data.data.canReceive,
                        alreadyReceived: !data.data.canReceive,
                        message: data.data.message
                    }
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: data.message || data.error || 'Não foi possível verificar o jogador'
                }, { status: 400 });
            }
        } catch (apiError: any) {
            console.error(`[${timestamp}] [Diamonds Verify] Erro na API:`, apiError.message);
            return NextResponse.json({
                success: false,
                error: 'Erro ao verificar token: ' + (apiError.message || 'Timeout ou erro de conexão')
            }, { status: 500 });
        }

    } catch (error: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [Diamonds Verify] Erro:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro interno: ' + (error.message || 'Erro desconhecido')
        }, { status: 500 });
    }
}
