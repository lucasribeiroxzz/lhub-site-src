import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    findUserByEmail,
    updateUser,
    createTransaction,
    getDiamondStock,
    updateDiamondStock,
    checkDiamondPackageUsed,
    recordDiamondPackageUsed,
    getUserCustomDiscount,
    DIAMOND_PACKAGES
} from '@/lib/db';
import { notifyDiamondsSent, notifyPublicDiamondsSent, notifyError } from '@/lib/discord';

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
        if (!tokenData || !tokenData.email) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
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

        if (!accessToken || !diamondAmount) {
            return NextResponse.json({
                success: false,
                error: 'accessToken e diamondAmount são obrigatórios'
            }, { status: 400 });
        }

        const amount = parseInt(diamondAmount);
        const pkg = DIAMOND_PACKAGES.find(p => p.amount === amount);
        
        if (!pkg) {
            return NextResponse.json({
                success: false,
                error: 'Pacote de diamantes inválido. Valores aceitos: 200, 620, 1040, 2120, 4360, 5300, 11200, 22400'
            }, { status: 400 });
        }

        const user = findUserByEmail(tokenData.email as string);
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Usuário não encontrado'
            }, { status: 404 });
        }

        let finalPrice = pkg.price;
        let customDiscountApplied = 0;
        const customDiscount = getUserCustomDiscount(user.id);
        
        if (customDiscount) {
            if (customDiscount.type === 'PERCENT') {
                customDiscountApplied = (pkg.price * customDiscount.value) / 100;
            } else {
                customDiscountApplied = customDiscount.value;
            }
            finalPrice = Math.max(0, pkg.price - customDiscountApplied);
        }

        if (user.balance < finalPrice) {
            return NextResponse.json({
                success: false,
                error: `Saldo insuficiente. Necessário: R$ ${finalPrice.toFixed(2)}, Disponível: R$ ${user.balance.toFixed(2)}`
            }, { status: 400 });
        }

        if (!BLN_DIAMONDS_KEY) {
            console.error('[Diamonds Send] API Key não configurada!');
            return NextResponse.json({
                success: false,
                error: 'Sistema de diamantes temporariamente indisponível'
            }, { status: 500 });
        }

        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [Diamonds Send] Chamando API: ${DIAMONDS_API_BASE}/api/v1/diamonds/send`);
        console.log(`[${timestamp}] [Diamonds Send] Quantidade: ${amount} | Preço: R$ ${finalPrice.toFixed(2)}`);
        
        const response = await fetch(`${DIAMONDS_API_BASE}/api/v1/diamonds/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: '1075559249092034580',
                key: BLN_DIAMONDS_KEY,
                accessToken: accessToken,
                diamondAmount: diamondAmount
            })
        });

        const data = await response.json();
        

        console.log(`[${timestamp}] [Diamonds Send] Resposta JSON:`, JSON.stringify(data));

        if (data.status === 'OK' && data.transacao) {

            const newBalance = user.balance - finalPrice;
            updateUser(tokenData.email as string, { balance: newBalance });

            const txId = data.transacao.id || `diamonds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            createTransaction({
                id: txId,
                userId: tokenData.email as string,
                type: 'PURCHASE',
                description: `${amount} Diamantes enviados${customDiscountApplied > 0 ? ` (Desconto: R$ ${customDiscountApplied.toFixed(2)})` : ''}`,
                amount: finalPrice,
                status: 'COMPLETED',
                productName: `${amount} Diamantes`
            });

            try {
                await notifyDiamondsSent(tokenData.email as string, 'Jogador', amount, finalPrice);
                await notifyPublicDiamondsSent('Jogador', amount);
            } catch (e) {
                console.error('[Diamonds Send] Erro ao notificar Discord:', e);
            }

            console.log(`[${timestamp}] [Diamonds Send] ✓ ${amount} diamantes enviados | Custo: R$ ${finalPrice.toFixed(2)} | Saldo: R$ ${newBalance.toFixed(2)}`);

            return NextResponse.json({
                success: true,
                message: data.mensagem || 'Diamantes enviados com sucesso!',
                data: {
                    diamonds: amount,
                    transactionId: txId,
                    originalPrice: pkg.price,
                    discount: customDiscountApplied,
                    finalPrice: finalPrice,
                    newBalance: newBalance,
                    apiResponse: data.transacao
                }
            });
        } else {
            const errorMsg = data.message || data.error || data.mensagem || 'Erro ao enviar diamantes';
            console.error(`[${timestamp}] [Diamonds Send] Erro:`, errorMsg);
            
            await notifyError('Diamonds Send', errorMsg, JSON.stringify(data));
            
            return NextResponse.json({
                success: false,
                error: errorMsg
            }, { status: 400 });
        }

    } catch (error: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [Diamonds Send] Erro:`, error.message);
        return NextResponse.json({
            success: false,
            error: 'Erro ao enviar diamantes: ' + (error.message || 'Erro desconhecido')
        }, { status: 500 });
    }
}
