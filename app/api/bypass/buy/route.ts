import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    findUserByEmail,
    updateUser,
    createTransaction,
    findProductById,
    useCoupon,
    getUserCustomDiscount,
    recordPurchaseLocation
} from '@/lib/db';
import { notifyError } from '@/lib/discord';
import { sendBypassPurchaseEmail } from '@/lib/email';
import { notifyBypassPurchase, notifyPublicBypassSent } from '@/lib/discord';

const BYPASS_API_URL = process.env.BYPASS_API_URL || 'http://45.126.209.85:5001/add';
const BYPASS_API_SECRET = process.env.BYPASS_API_SECRET || 'rodolfoaviaochavoso007';
const BYPASS_DOWNLOAD_URL = process.env.BYPASS_DOWNLOAD_URL || 'https://exemplo.com/bypass/download';
const BYPASS_TUTORIAL_URL = process.env.BYPASS_TUTORIAL_URL || 'https://exemplo.com/bypass/tutorial';
const BYPASS_DEFAULT_DAYS = parseInt(process.env.BYPASS_DEFAULT_DAYS || '30');

export async function POST(req: Request) {
    console.log('[Bypass Buy] Iniciando compra de Bypass UID');
    
    try {
        const body = await req.json();
        const { productId, gameUid, couponCode, days } = body;
        

        const bypassDays = days || BYPASS_DEFAULT_DAYS;
        
        console.log('[Bypass Buy] Dados recebidos:', { productId, gameUid, couponCode: couponCode || 'nenhum', days: bypassDays });

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[Bypass Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Faça login para continuar." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[Bypass Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[Bypass Buy] Usuário autenticado:', userId);

        if (!gameUid || gameUid.length < 5) {
            return NextResponse.json({ success: false, message: 'UID do jogador inválido' }, { status: 400 });
        }

        if (!/^\d+$/.test(gameUid)) {
            return NextResponse.json({ success: false, message: 'UID deve conter apenas números' }, { status: 400 });
        }

        const product = findProductById(productId || 'bypass-uid');
        if (!product) {
            console.log('[Bypass Buy] Erro: Produto não encontrado');
            return NextResponse.json({ success: false, message: 'Produto não encontrado' }, { status: 404 });
        }
        
        console.log('[Bypass Buy] Produto encontrado:', { name: product.name, price: product.price, type: product.type });

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[Bypass Buy] Erro: Usuário não encontrado:', userId);
            await notifyError('Bypass Buy', 'User not found', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        let finalPrice = product.price;
        let discountApplied = 0;
        let couponUsed = false;
        let customDiscountApplied = 0;

        const customDiscount = getUserCustomDiscount(user.id);
        if (customDiscount) {
            if (customDiscount.type === 'PERCENT') {
                customDiscountApplied = (product.price * customDiscount.value) / 100;
            } else {
                customDiscountApplied = customDiscount.value;
            }
            finalPrice = Math.max(0, product.price - customDiscountApplied);
            console.log('[Bypass Buy] Desconto personalizado aplicado:', customDiscountApplied, 'Preço após desconto:', finalPrice);
        }

        if (couponCode) {
            console.log('[Bypass Buy] Aplicando cupom:', couponCode);
            const couponResult = useCoupon(couponCode, userId, finalPrice);
            
            if (couponResult.success) {
                discountApplied = couponResult.discount;
                finalPrice = Math.max(0, finalPrice - discountApplied);
                couponUsed = true;
                console.log('[Bypass Buy] Cupom aplicado! Desconto:', discountApplied, 'Preço final:', finalPrice);
            } else {
                console.log('[Bypass Buy] Cupom inválido:', couponResult.message);
                return NextResponse.json({ 
                    success: false, 
                    message: couponResult.message 
                }, { status: 400 });
            }
        }
        
        console.log('[Bypass Buy] Saldo do usuário:', user.balance, '| Preço final:', finalPrice);
        
        if (user.balance < finalPrice) {
            console.log('[Bypass Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
        }

        console.log('[Bypass Buy] Chamando API externa do Bypass...');
        
        let bypassResponse: any = null;
        try {
            const apiUrl = `${BYPASS_API_URL}?secret=${BYPASS_API_SECRET}&uid=${gameUid}&days=${bypassDays}`;
            console.log('[Bypass Buy] URL da API:', apiUrl.replace(BYPASS_API_SECRET, '***'));
            
            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            bypassResponse = await res.json().catch(() => null);
            console.log('[Bypass Buy] Resposta da API:', bypassResponse);

            if (!res.ok || bypassResponse?.status !== 'success') {
                console.error('[Bypass Buy] Erro na API do Bypass:', bypassResponse);
                await notifyError('Bypass Buy - API', bypassResponse?.message || 'Unknown error', JSON.stringify(bypassResponse));
                return NextResponse.json({ 
                    success: false, 
                    message: bypassResponse?.message || 'Falha ao ativar bypass. Tente novamente.' 
                }, { status: 400 });
            }
            
            console.log('[Bypass Buy] Bypass ativado com sucesso!');
        } catch (apiError: any) {
            console.error('[Bypass Buy] Erro de conexão com API:', apiError);
            await notifyError('Bypass Buy - Connection', apiError.message || 'Connection Error');
            return NextResponse.json({ 
                success: false, 
                message: 'Erro de conexão com o servidor de bypass. Tente novamente.' 
            }, { status: 500 });
        }

        const newBalance = user.balance - finalPrice;
        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[Bypass Buy] Erro ao atualizar saldo');
            return NextResponse.json({ success: false, message: 'Erro ao processar pagamento' }, { status: 500 });
        }

        console.log('[Bypass Buy] Saldo atualizado:', newBalance);

        const transactionId = `TX-BYPASS-${Date.now()}`;
        createTransaction({
            id: transactionId,
            userId: userId,
            type: 'PURCHASE',
            description: `Compra: Bypass UID ${gameUid} (${bypassDays} dias)`,
            amount: finalPrice,
            status: 'COMPLETED',
            gameUid: gameUid,
            productName: `Bypass UID (${bypassDays} dias)`,
            bypassUid: gameUid,
            bypassDays: bypassDays,
            bypassExpiration: bypassResponse?.expiration_formatted || bypassResponse?.expiration,
            bypassDownloadUrl: BYPASS_DOWNLOAD_URL,
            bypassTutorialUrl: BYPASS_TUTORIAL_URL,
            couponCode: couponUsed ? couponCode : undefined,
            discount: discountApplied + customDiscountApplied
        });

        console.log('[Bypass Buy] Transação criada:', transactionId);

        try {
            recordPurchaseLocation({
                userId: userId,
                productId: 'bypass-uid',
                productName: 'Bypass UID',
                amount: finalPrice
            });
        } catch (e) {
            console.error('[Bypass Buy] Erro ao registrar analytics:', e);
        }

        try {
            await sendBypassPurchaseEmail(
                user.email,
                user.name,
                gameUid,
                bypassDays,
                bypassResponse?.expiration_formatted || bypassResponse?.expiration,
                finalPrice,
                BYPASS_DOWNLOAD_URL,
                BYPASS_TUTORIAL_URL
            );
            console.log('[Bypass Buy] Email de confirmação enviado');
        } catch (emailError) {
            console.error('[Bypass Buy] Erro ao enviar email:', emailError);
        }

        try {
            await notifyBypassPurchase(
                userId,
                gameUid,
                bypassDays,
                finalPrice,
                bypassResponse?.expiration_formatted
            );
            console.log('[Bypass Buy] Webhook privado enviado');
        } catch (webhookError) {
            console.error('[Bypass Buy] Erro ao enviar webhook privado:', webhookError);
        }

        try {
            await notifyPublicBypassSent(gameUid, bypassDays);
            console.log('[Bypass Buy] Webhook público enviado');
        } catch (webhookError) {
            console.error('[Bypass Buy] Erro ao enviar webhook público:', webhookError);
        }

        return NextResponse.json({
            success: true,
            message: 'Bypass ativado com sucesso!',
            data: {
                transactionId: transactionId,
                uid: gameUid,
                days: bypassDays,
                expiration: bypassResponse?.expiration_formatted || bypassResponse?.expiration,
                downloadUrl: BYPASS_DOWNLOAD_URL,
                tutorialUrl: BYPASS_TUTORIAL_URL,
                newBalance: newBalance,
                apiMessage: bypassResponse?.message
            }
        });

    } catch (error: any) {
        console.error('[Bypass Buy] Erro geral:', error);
        await notifyError('Bypass Buy', error.message || 'Unknown Error', error.stack);
        return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
    }
}
