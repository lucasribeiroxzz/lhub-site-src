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
    recordPurchaseLocation,
    getCheatKeyForSale,
    CHEAT_PLAN_PRICES,
    CHEAT_PLAN_NAMES
} from '@/lib/db';
import { notifyError } from '@/lib/discord';
import { sendCheatPurchaseEmail } from '@/lib/email';
import { notifyCheatPurchase, notifyPublicCheatSold } from '@/lib/discord';

const CHEAT_DOWNLOAD_URL = process.env.CHEAT_DOWNLOAD_URL || 'https://exemplo.com/cheat/download';
const CHEAT_TUTORIAL_URL = process.env.CHEAT_TUTORIAL_URL || 'https://exemplo.com/cheat/tutorial';

export async function POST(req: Request) {
    console.log('[Cheat Buy] Iniciando compra de Cheat External');
    
    try {
        const body = await req.json();
        const { productId, planType, couponCode } = body;
        
        console.log('[Cheat Buy] Dados recebidos:', { productId, planType, couponCode: couponCode || 'nenhum' });

        if (!planType || !['daily', 'weekly', 'biweekly', 'monthly'].includes(planType)) {
            return NextResponse.json({ 
                success: false, 
                message: 'Plano inválido. Escolha: daily, weekly, biweekly ou monthly' 
            }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[Cheat Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Faça login para continuar." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[Cheat Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[Cheat Buy] Usuário autenticado:', userId);

        const product = findProductById(productId || 'cheat-external');
        if (!product) {
            console.log('[Cheat Buy] Erro: Produto não encontrado');
            return NextResponse.json({ success: false, message: 'Produto não encontrado' }, { status: 404 });
        }
        
        console.log('[Cheat Buy] Produto encontrado:', { name: product.name, type: product.type });

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[Cheat Buy] Erro: Usuário não encontrado:', userId);
            await notifyError('Cheat Buy', 'User not found', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        const basePrice = CHEAT_PLAN_PRICES[planType];
        if (!basePrice) {
            return NextResponse.json({ success: false, message: 'Preço não encontrado para este plano' }, { status: 400 });
        }

        let finalPrice = basePrice;
        let discountApplied = 0;
        let couponUsed = false;
        let customDiscountApplied = 0;

        const customDiscount = getUserCustomDiscount(user.id);
        if (customDiscount) {
            if (customDiscount.type === 'PERCENT') {
                customDiscountApplied = (basePrice * customDiscount.value) / 100;
            } else {
                customDiscountApplied = customDiscount.value;
            }
            finalPrice = Math.max(0, basePrice - customDiscountApplied);
            console.log('[Cheat Buy] Desconto personalizado aplicado:', customDiscountApplied, 'Preço após desconto:', finalPrice);
        }

        if (couponCode) {
            console.log('[Cheat Buy] Aplicando cupom:', couponCode);
            const couponResult = useCoupon(couponCode, userId, finalPrice);
            
            if (couponResult.success) {
                discountApplied = couponResult.discount;
                finalPrice = Math.max(0, finalPrice - discountApplied);
                couponUsed = true;
                console.log('[Cheat Buy] Cupom aplicado! Desconto:', discountApplied, 'Preço final:', finalPrice);
            } else {
                console.log('[Cheat Buy] Cupom inválido:', couponResult.message);
                return NextResponse.json({ 
                    success: false, 
                    message: couponResult.message 
                }, { status: 400 });
            }
        }
        
        console.log('[Cheat Buy] Saldo do usuário:', user.balance, '| Preço final:', finalPrice);
        
        if (user.balance < finalPrice) {
            console.log('[Cheat Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
        }

        console.log('[Cheat Buy] Buscando key disponível para plano:', planType);
        
        const cheatKey = getCheatKeyForSale(userId, planType as 'daily' | 'weekly' | 'biweekly' | 'monthly');
        
        if (!cheatKey) {
            console.log('[Cheat Buy] Erro: Sem keys disponíveis para o plano:', planType);
            return NextResponse.json({ 
                success: false, 
                message: `Sem estoque disponível para o plano ${CHEAT_PLAN_NAMES[planType]}. Tente outro plano ou aguarde reposição.` 
            }, { status: 400 });
        }
        
        console.log('[Cheat Buy] Key obtida com sucesso!');

        const newBalance = user.balance - finalPrice;
        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[Cheat Buy] Erro ao atualizar saldo');
            return NextResponse.json({ success: false, message: 'Erro ao processar pagamento' }, { status: 500 });
        }

        console.log('[Cheat Buy] Saldo atualizado:', newBalance);

        const transactionId = `TX-CHEAT-${Date.now()}`;
        createTransaction({
            id: transactionId,
            userId: userId,
            type: 'PURCHASE',
            description: `Compra: Cheat External - ${CHEAT_PLAN_NAMES[planType]}`,
            amount: finalPrice,
            status: 'COMPLETED',
            productName: `Cheat External - ${CHEAT_PLAN_NAMES[planType]}`,
            cheatKey: cheatKey.key,
            cheatPlanType: planType as 'daily' | 'weekly' | 'biweekly' | 'monthly',
            cheatDownloadUrl: CHEAT_DOWNLOAD_URL,
            cheatTutorialUrl: CHEAT_TUTORIAL_URL,
            couponCode: couponUsed ? couponCode : undefined,
            discount: discountApplied + customDiscountApplied
        });

        console.log('[Cheat Buy] Transação criada:', transactionId);

        try {
            recordPurchaseLocation({
                userId: userId,
                productId: 'cheat-external',
                productName: `Cheat External - ${CHEAT_PLAN_NAMES[planType]}`,
                amount: finalPrice
            });
        } catch (e) {
            console.error('[Cheat Buy] Erro ao registrar analytics:', e);
        }

        try {
            await sendCheatPurchaseEmail(
                user.email,
                user.name,
                cheatKey.key,
                planType,
                finalPrice,
                CHEAT_DOWNLOAD_URL,
                CHEAT_TUTORIAL_URL
            );
            console.log('[Cheat Buy] Email de confirmação enviado');
        } catch (emailError) {
            console.error('[Cheat Buy] Erro ao enviar email:', emailError);
        }

        try {
            await notifyCheatPurchase(
                userId,
                cheatKey.key,
                planType,
                finalPrice
            );
            console.log('[Cheat Buy] Webhook privado enviado');
        } catch (webhookError) {
            console.error('[Cheat Buy] Erro ao enviar webhook privado:', webhookError);
        }

        try {
            await notifyPublicCheatSold(planType);
            console.log('[Cheat Buy] Webhook público enviado');
        } catch (webhookError) {
            console.error('[Cheat Buy] Erro ao enviar webhook público:', webhookError);
        }

        return NextResponse.json({
            success: true,
            message: 'Cheat adquirido com sucesso!',
            data: {
                transactionId: transactionId,
                key: cheatKey.key,
                planType: planType,
                planName: CHEAT_PLAN_NAMES[planType],
                downloadUrl: CHEAT_DOWNLOAD_URL,
                tutorialUrl: CHEAT_TUTORIAL_URL,
                newBalance: newBalance
            }
        });

    } catch (error: any) {
        console.error('[Cheat Buy] Erro geral:', error);
        await notifyError('Cheat Buy', error.message || 'Unknown Error', error.stack);
        return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
    }
}
