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
    getModApkKeyForSale,
    MODAPK_PLAN_PRICES,
    MODAPK_PLAN_NAMES
} from '@/lib/db';
import { notifyError, notifyModApkPurchase, notifyPublicModApkSold } from '@/lib/discord';
import { sendModApkPurchaseEmail } from '@/lib/email';

const MODAPK_DOWNLOAD_URL = process.env.MODAPK_DOWNLOAD_URL || 'https://exemplo.com/modapk/download';
const MODAPK_TUTORIAL_URL = process.env.MODAPK_TUTORIAL_URL || 'https://exemplo.com/modapk/tutorial';

export async function POST(req: Request) {
    console.log('[ModApk Buy] Iniciando compra de ModApk Android');
    
    try {
        const body = await req.json();
        const { productId, planType, couponCode } = body;
        
        console.log('[ModApk Buy] Dados recebidos:', { productId, planType, couponCode: couponCode || 'nenhum' });

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[ModApk Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Faça login para continuar." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[ModApk Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[ModApk Buy] Usuário autenticado:', userId);

        if (!planType || !['daily', 'weekly', 'biweekly', 'monthly'].includes(planType)) {
            return NextResponse.json({ 
                success: false, 
                message: 'Plano inválido. Selecione um plano válido.' 
            }, { status: 400 });
        }

        const product = findProductById(productId || 'modapk-android');
        if (!product) {
            console.log('[ModApk Buy] Erro: Produto não encontrado');
            return NextResponse.json({ success: false, message: 'Produto não encontrado' }, { status: 404 });
        }
        
        console.log('[ModApk Buy] Produto encontrado:', { name: product.name, type: product.type });

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[ModApk Buy] Erro: Usuário não encontrado:', userId);
            await notifyError('ModApk Buy', 'User not found', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        const planPrice = MODAPK_PLAN_PRICES[planType];
        const planName = MODAPK_PLAN_NAMES[planType];
        
        console.log('[ModApk Buy] Plano selecionado:', { planType, planName, planPrice });

        let finalPrice = planPrice;
        let discountApplied = 0;
        let couponUsed = false;
        let customDiscountApplied = 0;

        const customDiscount = getUserCustomDiscount(user.id);
        if (customDiscount) {
            if (customDiscount.type === 'PERCENT') {
                customDiscountApplied = (planPrice * customDiscount.value) / 100;
            } else {
                customDiscountApplied = customDiscount.value;
            }
            finalPrice = Math.max(0, planPrice - customDiscountApplied);
            console.log('[ModApk Buy] Desconto personalizado aplicado:', customDiscountApplied, 'Preço após desconto:', finalPrice);
        }

        if (couponCode) {
            console.log('[ModApk Buy] Aplicando cupom:', couponCode);
            const couponResult = useCoupon(couponCode, userId, finalPrice);
            
            if (couponResult.success) {
                discountApplied = couponResult.discount;
                finalPrice = Math.max(0, finalPrice - discountApplied);
                couponUsed = true;
                console.log('[ModApk Buy] Cupom aplicado! Desconto:', discountApplied, 'Preço final:', finalPrice);
            } else {
                console.log('[ModApk Buy] Cupom inválido:', couponResult.message);
                return NextResponse.json({ 
                    success: false, 
                    message: couponResult.message 
                }, { status: 400 });
            }
        }
        
        console.log('[ModApk Buy] Saldo do usuário:', user.balance, '| Preço final:', finalPrice);
        
        if (user.balance < finalPrice) {
            console.log('[ModApk Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
        }

        console.log('[ModApk Buy] Buscando key disponível...');
        const modapkKey = getModApkKeyForSale(user.id, planType as 'daily' | 'weekly' | 'biweekly' | 'monthly');
        
        if (!modapkKey) {
            console.log('[ModApk Buy] Erro: Sem estoque para o plano', planType);
            return NextResponse.json({ 
                success: false, 
                message: `Sem estoque disponível para o plano ${planName}. Tente outro plano ou aguarde reposição.` 
            }, { status: 400 });
        }
        
        console.log('[ModApk Buy] Key encontrada:', modapkKey.id);

        const newBalance = user.balance - finalPrice;
        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[ModApk Buy] Erro ao atualizar saldo');
            return NextResponse.json({ success: false, message: 'Erro ao processar pagamento' }, { status: 500 });
        }

        console.log('[ModApk Buy] Saldo atualizado:', newBalance);

        const transactionId = `TX-MODAPK-${Date.now()}`;
        createTransaction({
            id: transactionId,
            userId: userId,
            type: 'PURCHASE',
            description: `Compra: ModApk - Android - ${planName}`,
            amount: finalPrice,
            status: 'COMPLETED',
            productName: `ModApk - Android - ${planName}`,
            modapkKey: modapkKey.key,
            modapkPlanType: planType as 'daily' | 'weekly' | 'biweekly' | 'monthly',
            modapkDownloadUrl: MODAPK_DOWNLOAD_URL,
            modapkTutorialUrl: MODAPK_TUTORIAL_URL,
            couponCode: couponUsed ? couponCode : undefined,
            discount: discountApplied + customDiscountApplied
        });

        console.log('[ModApk Buy] Transação criada:', transactionId);

        try {
            recordPurchaseLocation({
                userId: userId,
                productId: 'modapk-android',
                productName: `ModApk - Android - ${planName}`,
                amount: finalPrice
            });
        } catch (e) {
            console.error('[ModApk Buy] Erro ao registrar analytics:', e);
        }

        try {
            await sendModApkPurchaseEmail(
                user.email,
                user.name,
                modapkKey.key,
                planType,
                finalPrice,
                MODAPK_DOWNLOAD_URL,
                MODAPK_TUTORIAL_URL
            );
            console.log('[ModApk Buy] Email de confirmação enviado');
        } catch (emailError) {
            console.error('[ModApk Buy] Erro ao enviar email:', emailError);
        }

        try {
            await notifyModApkPurchase(
                userId,
                modapkKey.key,
                planType,
                finalPrice
            );
            console.log('[ModApk Buy] Webhook privado enviado');
        } catch (webhookError) {
            console.error('[ModApk Buy] Erro ao enviar webhook privado:', webhookError);
        }

        try {
            await notifyPublicModApkSold(planType);
            console.log('[ModApk Buy] Webhook público enviado');
        } catch (webhookError) {
            console.error('[ModApk Buy] Erro ao enviar webhook público:', webhookError);
        }

        return NextResponse.json({
            success: true,
            message: 'ModApk adquirido com sucesso!',
            data: {
                transactionId: transactionId,
                key: modapkKey.key,
                planType: planType,
                planName: planName,
                downloadUrl: MODAPK_DOWNLOAD_URL,
                tutorialUrl: MODAPK_TUTORIAL_URL,
                newBalance: newBalance,
                price: finalPrice
            }
        });

    } catch (error: any) {
        console.error('[ModApk Buy] Erro geral:', error);
        await notifyError('ModApk Buy', error.message || 'Unknown Error', error.stack);
        return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
    }
}
