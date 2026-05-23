import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    findUserByEmail,
    findProductById,
    updateUser,
    createTransaction,
    getStreamingKeyForSale,
    getUserCustomDiscount,
    useCoupon,
    recordPurchaseLocation,
    STREAMING_PRODUCTS,
    STREAMING_PRICES,
    StreamingPlatform
} from '@/lib/db';
import { notifyStreamingPurchase, notifyPublicStreamingSold, notifyError } from '@/lib/discord';
import { sendStreamingPurchaseEmail } from '@/lib/email';

export async function POST(req: Request) {
    console.log('[Streaming Buy] Iniciando compra de Streaming');

    try {
        const body = await req.json();
        const { platform, couponCode } = body;

        console.log('[Streaming Buy] Dados recebidos:', { platform, couponCode: couponCode || 'nenhum' });

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[Streaming Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Faça login para continuar." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[Streaming Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[Streaming Buy] Usuário autenticado:', userId);

        const validPlatforms: StreamingPlatform[] = ['hbomax', 'primevideo', 'crunchyroll', 'paramount', 'canvapro', 'disney'];
        if (!platform || !validPlatforms.includes(platform)) {
            return NextResponse.json({
                success: false,
                message: 'Plataforma inválida. Selecione uma plataforma válida.'
            }, { status: 400 });
        }

        const platformInfo = STREAMING_PRODUCTS[platform as StreamingPlatform];
        const product = findProductById('streamings');

        console.log('[Streaming Buy] Plataforma:', { platform, name: platformInfo.name });

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[Streaming Buy] Erro: Usuário não encontrado:', userId);
            await notifyError('Streaming Buy', 'User not found', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        const platformPrice = STREAMING_PRICES[platform as StreamingPlatform];

        console.log('[Streaming Buy] Plataforma selecionada:', { platform, platformName: platformInfo.name, platformPrice });

        let finalPrice = platformPrice;
        let discountApplied = 0;
        let couponUsed = false;
        let customDiscountApplied = 0;

        const customDiscount = getUserCustomDiscount(user.id);
        if (customDiscount) {
            if (customDiscount.type === 'PERCENT') {
                customDiscountApplied = (platformPrice * customDiscount.value) / 100;
            } else {
                customDiscountApplied = customDiscount.value;
            }
            finalPrice = Math.max(0, platformPrice - customDiscountApplied);
            console.log('[Streaming Buy] Desconto personalizado aplicado:', customDiscountApplied, 'Preço após desconto:', finalPrice);
        }

        if (couponCode) {
            console.log('[Streaming Buy] Aplicando cupom:', couponCode);
            const couponResult = useCoupon(couponCode, userId, finalPrice);

            if (couponResult.success) {
                discountApplied = couponResult.discount;
                finalPrice = Math.max(0, finalPrice - discountApplied);
                couponUsed = true;
                console.log('[Streaming Buy] Cupom aplicado! Desconto:', discountApplied, 'Preço final:', finalPrice);
            } else {
                console.log('[Streaming Buy] Cupom inválido:', couponResult.message);
                return NextResponse.json({
                    success: false,
                    message: couponResult.message
                }, { status: 400 });
            }
        }

        console.log('[Streaming Buy] Saldo do usuário:', user.balance, '| Preço final:', finalPrice);

        if (user.balance < finalPrice) {
            console.log('[Streaming Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
        }

        console.log('[Streaming Buy] Buscando key disponível...');
        const streamingKey = getStreamingKeyForSale(user.id, platform as StreamingPlatform);

        if (!streamingKey) {
            console.log('[Streaming Buy] Erro: Sem estoque para', platform);
            return NextResponse.json({
                success: false,
                message: `Sem estoque disponível para ${platformInfo.name}. Tente outra plataforma ou aguarde reposição.`
            }, { status: 400 });
        }

        console.log('[Streaming Buy] Key encontrada:', streamingKey.id);

        const newBalance = user.balance - finalPrice;
        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[Streaming Buy] Erro ao atualizar saldo');
            return NextResponse.json({ success: false, message: 'Erro ao processar pagamento' }, { status: 500 });
        }

        console.log('[Streaming Buy] Saldo atualizado:', newBalance);

        const transactionId = `TX-STREAMING-${Date.now()}`;
        createTransaction({
            id: transactionId,
            userId: userId,
            type: 'PURCHASE',
            description: `Compra: Streaming - ${platformInfo.name}`,
            amount: finalPrice,
            status: 'COMPLETED',
            productName: `Streaming - ${platformInfo.name}`,
            streamingKey: streamingKey.key,
            streamingPlatform: platform as StreamingPlatform,
            couponCode: couponUsed ? couponCode : undefined,
            discount: discountApplied + customDiscountApplied
        });

        console.log('[Streaming Buy] Transação criada:', transactionId);

        try {
            recordPurchaseLocation({
                userId: userId,
                productId: 'streamings',
                productName: `Streaming - ${platformInfo.name}`,
                amount: finalPrice
            });
        } catch (e) {
            console.error('[Streaming Buy] Erro ao registrar analytics:', e);
        }

        try {
            await sendStreamingPurchaseEmail(
                user.email,
                user.name,
                streamingKey.key,
                platform,
                finalPrice
            );
            console.log('[Streaming Buy] Email de confirmação enviado');
        } catch (emailError) {
            console.error('[Streaming Buy] Erro ao enviar email:', emailError);
        }

        try {
            await notifyStreamingPurchase(
                userId,
                streamingKey.key,
                platform,
                finalPrice
            );
            console.log('[Streaming Buy] Webhook privado enviado');
        } catch (webhookError) {
            console.error('[Streaming Buy] Erro ao enviar webhook privado:', webhookError);
        }

        try {
            await notifyPublicStreamingSold(platform);
            console.log('[Streaming Buy] Webhook público enviado');
        } catch (webhookError) {
            console.error('[Streaming Buy] Erro ao enviar webhook público:', webhookError);
        }

        return NextResponse.json({
            success: true,
            message: `${platformInfo.name} adquirido com sucesso!`,
            key: streamingKey.key,
            platform: platformInfo.name,
            platformIcon: platformInfo.icon,
            price: finalPrice,
            transactionId,
            newBalance: newBalance
        });

    } catch (error) {
        console.error('[Streaming Buy] Erro:', error);
        try {
            await notifyError('Streaming Buy', String(error), 'Erro na compra de streaming');
        } catch { }
        return NextResponse.json({
            success: false,
            message: "Erro ao processar compra. Tente novamente."
        }, { status: 500 });
    }
}
