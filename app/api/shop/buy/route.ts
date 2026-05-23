import { NextResponse } from 'next/server';
import { encryptData } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    sanitizeString,
    sanitizeUID,
    detectSQLInjection,
    detectXSS,
    logSecurityEvent,
    getClientIP,
    checkPurchaseRateLimit
} from '@/lib/security';
import {
    findUserByEmail,
    updateUser,
    findProductById,
    updateProductStock,
    createTransaction,
    syncPasseStock,
    syncTokenStock,
    useCoupon,
    getUserCustomDiscount,
    getGuestAccountForSale,
    recordPurchaseLocation,
    getModApkKeyForSale,
    MODAPK_PLAN_PRICES,
    MODAPK_PLAN_NAMES
} from '@/lib/db';
import { notifyPasseSent, notifyError, notifyLikesSent, notifyPublicPasseSent, notifyPublicLikesSent, notifyPublicGuestAccountSold, notifyModApkPurchase, notifyPublicModApkSold, notifyTokenSent, notifyPublicTokenSent } from '@/lib/discord';
import { sendPurchaseEmail, sendGuestAccountEmail, sendModApkPurchaseEmail, sendLikesSubscriptionEmail } from '@/lib/email';
import { sendLikesSubscriptionWebhook } from '@/lib/webhook';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const BLN_API_BASE = 'https://blnhubpasses-freefire.squareweb.app';
const LIKES_API_BASE = 'https://blnhublikes1.discloud.app';
const MODAPK_DOWNLOAD_URL = process.env.MODAPK_DOWNLOAD_URL || 'https://exemplo.com/modapk/download';
const MODAPK_TUTORIAL_URL = process.env.MODAPK_TUTORIAL_URL || 'https://exemplo.com/modapk/tutorial';
const LIKES_API_KEY = process.env.LIKES_API_KEY || '';
const TOKEN_RESELLER_KEY = process.env.TOKEN_RESELLER_KEY || 'lucassxamigo777';
const TOKEN_API_BASE = process.env.TOKEN_API_BASE || 'https://blnhubtokens-freefire.shardweb.app';

export async function POST(req: Request) {
    console.log('[Buy] Iniciando requisição de compra');

    try {
        const ip = getClientIP(req);

        const rateLimit = checkPurchaseRateLimit(ip);
        if (!rateLimit.allowed) {
            logSecurityEvent('RATE_LIMIT', ip, '/api/shop/buy', 'Tentativas de compra excedidas');
            return NextResponse.json({
                success: false,
                message: 'Muitas tentativas. Aguarde um momento.'
            }, { status: 429 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
        }

        const { productId, gameUid, couponCode, region, giftMessage, likesAmount } = body;

        const inputs = [productId, gameUid, couponCode, region, giftMessage].filter(Boolean);
        for (const input of inputs) {
            if (detectSQLInjection(String(input)) || detectXSS(String(input))) {
                logSecurityEvent('SQL_INJECTION', ip, '/api/shop/buy', `Ataque detectado: ${String(input).slice(0, 50)}`);
                return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
            }
        }

        const sanitizedProductId = sanitizeString(productId);
        const sanitizedGameUid = gameUid ? sanitizeUID(gameUid) : '';
        const sanitizedCouponCode = couponCode ? sanitizeString(couponCode) : null;
        const sanitizedRegion = region ? sanitizeString(region).toUpperCase().slice(0, 5) : 'BR';

        const finalMessage = giftMessage ? sanitizeString(giftMessage).slice(0, 100) : 'Aqui está o seu presente! 🎁';

        console.log('[Buy] Dados recebidos:', { productId: sanitizedProductId, gameUid: sanitizedGameUid, couponCode: sanitizedCouponCode || 'nenhum', region: sanitizedRegion, giftMessage: finalMessage });

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Unauthorized. Please login again." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[Buy] Usuário autenticado:', userId);

        const product = findProductById(productId);
        if (!product) {
            console.log('[Buy] Erro: Produto não encontrado:', productId);
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        console.log('[Buy] Produto encontrado:', { name: product.name, price: product.price, stock: product.stock, type: product.type });

        if (product.type !== 'LIKES' && product.stock <= 0) {
            console.log('[Buy] Erro: Produto sem estoque');
            return NextResponse.json({ success: false, message: 'Out of stock' }, { status: 400 });
        }

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[Buy] Erro: Usuário não encontrado:', userId);
            await notifyError('Buy', 'User not found', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
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
            console.log('[Buy] Desconto personalizado aplicado:', customDiscountApplied, 'Preço após desconto:', finalPrice);
        }

        if (couponCode) {
            console.log('[Buy] Aplicando cupom:', couponCode);
            const couponResult = useCoupon(couponCode, userId, finalPrice);

            if (couponResult.success) {
                discountApplied = couponResult.discount;
                finalPrice = Math.max(0, finalPrice - discountApplied);
                couponUsed = true;
                console.log('[Buy] Cupom aplicado! Desconto:', discountApplied, 'Preço final:', finalPrice);
            } else {
                console.log('[Buy] Cupom inválido:', couponResult.message);
                return NextResponse.json({
                    success: false,
                    message: couponResult.message
                }, { status: 400 });
            }
        }

        console.log('[Buy] Saldo do usuário:', user.balance, '| Preço final:', finalPrice);

        if (user.balance < finalPrice) {
            console.log('[Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
        }

        let gameApiResponse: any = null;
        let likesResult: any = null;

        if (product.type === 'PASSE') {
            console.log('[Buy] Tipo PASSE - Chamando API BLN...');

            const formData = new URLSearchParams();
            formData.append('reseller_key', RESELLER_KEY);
            formData.append('clientID', gameUid);
            formData.append('mensagem', finalMessage);

            try {
                console.log('[Buy] Enviando para BLN API:', { clientID: gameUid });

                const res = await fetch(`${BLN_API_BASE}/api/enviar/passe`, {
                    method: 'POST',
                    body: formData,
                });

                gameApiResponse = await res.json().catch(() => null);
                console.log('[Buy] Resposta BLN:', { ok: res.ok, response: gameApiResponse });

                if (!res.ok || !gameApiResponse?.status?.includes('ENVIADO')) {
                    console.error('[Buy] Erro BLN API:', gameApiResponse);
                    await notifyError('Buy - BLN API', gameApiResponse?.message || gameApiResponse?.status || 'Unknown error', JSON.stringify(gameApiResponse));
                    return NextResponse.json({
                        success: false,
                        message: gameApiResponse?.message || 'Falha ao enviar passe. Tente novamente.'
                    }, { status: 400 });
                }

                console.log('[Buy] Passe enviado com sucesso!');
            } catch (apiError: any) {
                console.error('[Buy] Erro de conexão BLN:', apiError);
                await notifyError('Buy - BLN Connection', apiError.message || 'Connection Error');
                return NextResponse.json({
                    success: false,
                    message: 'Erro de conexão com o servidor de envio. Tente novamente.'
                }, { status: 500 });
            }
        } else if (product.type === 'LIKES') {

            const LIKES_PRICES: Record<number, number> = {
                250: 0.90,
                500: 1.80,
                750: 2.70,
                1000: 3.60,
                1250: 4.50,
                1500: 5.40,
                2500: 9.00,
                3500: 12.60,
                4500: 16.20,
                5500: 19.80,
                6500: 23.40,
                7500: 27.00,
                8500: 30.60,
                9500: 34.20,
                10000: 36.00
            };

            const selectedAmount = parseInt(likesAmount) || 250;
            const likesPrice = LIKES_PRICES[selectedAmount];

            if (!likesPrice) {
                return NextResponse.json({
                    success: false,
                    message: 'Quantidade de likes inválida'
                }, { status: 400 });
            }

            finalPrice = likesPrice;
            if (customDiscountApplied > 0) {
                finalPrice = Math.max(0, likesPrice - customDiscountApplied);
            }
            if (discountApplied > 0) {
                finalPrice = Math.max(0, finalPrice - discountApplied);
            }

            if (user.balance < finalPrice) {
                console.log('[Buy] Erro: Saldo insuficiente para likes');
                return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
            }

            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [Likes] Criando pedido de ${selectedAmount} likes para UID ${gameUid}...`);

            if (!LIKES_API_KEY || LIKES_API_KEY === 'SUA_CHAVE_AQUI') {
                console.error(`[${timestamp}] [Likes] API Key não configurada!`);
                await notifyError('Buy - Likes', 'API Key não configurada');
                return NextResponse.json({
                    success: false,
                    message: 'Sistema de likes temporariamente indisponível.'
                }, { status: 500 });
            }

            const playerRegion = region || 'BR';

            try {
                const checkUrl = `${LIKES_API_BASE}/send_likes?id=${gameUid}&key=${LIKES_API_KEY}`;
                console.log(`[${timestamp}] [Likes] Verificando jogador e enviando primeira leva...`);

                const res = await fetch(checkUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                let data;
                try {
                    data = await res.json();
                } catch (e) {
                    const text = await res.text();
                    console.error(`[${timestamp}] [Likes] Resposta não é JSON:`, text);
                    throw new Error(`Resposta inválida da API: ${text.substring(0, 100)}`);
                }

                console.log(`[${timestamp}] [Likes API] Resposta JSON:`, JSON.stringify(data));

                if (data.status_envio === "SUCESSO") {

                    const likesAddedMatch = data.sent?.match(/(\d+)/);
                    const likesAdded = likesAddedMatch ? parseInt(likesAddedMatch[1]) : 175;
                    const playerName = data.nickname || 'Unknown';

                    console.log(`[${timestamp}] [Likes] ✓ Primeira entrega: +${likesAdded} likes para ${playerName}`);

                    const avgPerDay = 175;
                    const estimatedDays = Math.ceil(selectedAmount / avgPerDay);
                    const remainingLikes = selectedAmount - likesAdded;

                    if (remainingLikes > 0) {
                        const { createLikesOrder } = await import('@/lib/db');
                        const likesOrder = createLikesOrder({
                            orderId: `order_${Date.now()}`,
                            userId: userId,
                            playerId: gameUid,
                            playerName: playerName,
                            region: playerRegion,
                            totalLikes: selectedAmount,
                            likesDelivered: likesAdded,
                            likesPerDay: 175,
                            daysTotal: estimatedDays,
                            daysCompleted: 1,
                            status: 'ACTIVE',
                            lastDelivery: new Date().toISOString(),
                            nextDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                            errorCount: 0
                        });

                        console.log(`[${timestamp}] [Likes] Pedido criado: ${likesOrder.id} | Restam ${remainingLikes} likes | Próxima entrega em 24h`);

                        try {
                            await sendLikesSubscriptionEmail(
                                user.email,
                                user.name,
                                selectedAmount,
                                finalPrice,
                                playerName,
                                gameUid,
                                estimatedDays
                            );
                            console.log(`[${timestamp}] [Likes] ✓ Email de assinatura enviado para ${user.email}`);
                        } catch (emailError) {
                            console.error(`[${timestamp}] [Likes] Erro ao enviar email:`, emailError);
                        }

                        try {
                            await sendLikesSubscriptionWebhook({
                                userId: userId,
                                userName: user.name,
                                userEmail: user.email,
                                playerId: gameUid,
                                playerName: playerName,
                                region: playerRegion,
                                totalLikes: selectedAmount,
                                price: finalPrice,
                                estimatedDays: estimatedDays,
                                orderId: likesOrder.id
                            });
                            console.log(`[${timestamp}] [Likes] ✓ Webhook de assinatura enviado`);
                        } catch (webhookError) {
                            console.error(`[${timestamp}] [Likes] Erro ao enviar webhook:`, webhookError);
                        }
                    }

                    likesResult = {
                        success: true,
                        player: playerName,
                        likesAdded: likesAdded,
                        totalLikes: selectedAmount,
                        remainingLikes: remainingLikes,
                        estimatedDays: estimatedDays,
                        initialLikes: data.likes_antes,
                        finalLikes: data.likes_depois,
                        message: remainingLikes > 0
                            ? `+${likesAdded} likes enviados! Restam ${remainingLikes} likes que serão enviados automaticamente (100-250 por dia).`
                            : `${likesAdded} likes enviados com sucesso!`
                    };

                    await notifyLikesSent(userId, gameUid, playerName, likesAdded, likesAdded, selectedAmount);

                    console.log(`[${timestamp}] [Likes] ✓ Pedido processado | Total: ${selectedAmount} | Enviados: ${likesAdded} | Restam: ${remainingLikes}`);

                } else if (data.res === "LIMIT_EXCEEDED") {
                    console.log(`[${timestamp}] [Likes] Limite diário atingido`);
                    return NextResponse.json({
                        success: false,
                        message: 'Limite diário de likes atingido para este UID. Tente novamente amanhã!',
                        code: 'DAILY_LIMIT_REACHED'
                    }, { status: 429 });
                } else {

                    const errorMessage = data.error || data.message || 'Erro ao enviar likes';
                    console.error(`[${timestamp}] [Likes] Erro:`, errorMessage);
                    await notifyError('Buy - Likes API', errorMessage, JSON.stringify(data));
                    return NextResponse.json({
                        success: false,
                        message: `Falha ao enviar likes: ${errorMessage}`
                    }, { status: 400 });
                }
            } catch (apiError: any) {
                const timestamp = new Date().toISOString();
                console.error(`[${timestamp}] [Likes] Erro de conexão:`, apiError.message);
                await notifyError('Buy - Likes Connection', apiError.message || 'Connection Error');
                return NextResponse.json({
                    success: false,
                    message: 'Erro de conexão com o servidor de likes. Tente novamente.'
                }, { status: 500 });
            }
        } else if (product.type === 'DIAMONDS') {
            console.log('[Buy] Tipo DIAMONDS - Implementação futura');

        } else if ((product.type as string) === 'GUEST_ACCOUNT') {
            console.log('[Buy] Tipo GUEST_ACCOUNT - Buscando conta disponível...');

            const guestAccount = getGuestAccountForSale(user.id);

            if (!guestAccount) {
                console.error('[Buy] Nenhuma conta Guest disponível');
                return NextResponse.json({
                    success: false,
                    message: 'Sem estoque disponível no momento. Tente novamente mais tarde.'
                }, { status: 400 });
            }

            console.log('[Buy] Conta Guest encontrada:', guestAccount.uid);

            gameApiResponse = {
                status: 'SUCCESS',
                uid: guestAccount.uid,
                password: guestAccount.password,
                type: 'GUEST_ACCOUNT'
            };
        } else if ((product.type as string) === 'BYPASS') {
            console.log('[Buy] Tipo BYPASS - Redirecionando para /api/bypass/buy');

            return NextResponse.json({
                success: false,
                message: 'Use a rota /api/bypass/buy para comprar bypass',
                redirect: '/api/bypass/buy'
            }, { status: 400 });
        } else if ((product.type as string) === 'MODAPK') {
            console.log('[Buy] Tipo MODAPK - Redirecionando para página de compra ModApk');

            return NextResponse.json({
                success: false,
                message: 'Use a página de compra do ModApk para selecionar o plano',
                redirect: '/dashboard/modapk'
            }, { status: 400 });
        } else if ((product.type as string) === 'TOKEN') {
            console.log('[Buy] Tipo TOKEN - Enviando caixa token...');

            const quantity = parseInt(body.quantity) || 1;

            if (quantity < 1 || quantity > 100) {
                return NextResponse.json({
                    success: false,
                    message: 'Quantidade inválida. Mínimo: 1, Máximo: 100'
                }, { status: 400 });
            }

            const unitPrice = product.price;
            const totalPrice = unitPrice * quantity;
            finalPrice = totalPrice - customDiscountApplied - discountApplied;
            finalPrice = Math.max(0, finalPrice);

            if (user.balance < finalPrice) {
                return NextResponse.json({
                    success: false,
                    message: `Saldo insuficiente. Necessário: R$ ${finalPrice.toFixed(2)}`
                }, { status: 400 });
            }

            if (product.stock < quantity) {
                return NextResponse.json({
                    success: false,
                    message: 'Estoque insuficiente para a quantidade solicitada'
                }, { status: 400 });
            }

            const formData = new URLSearchParams();
            formData.append('reseller_key', TOKEN_RESELLER_KEY);
            formData.append('playerID', gameUid);
            formData.append('item_quantity', quantity.toString());
            formData.append('mensagem', finalMessage);

            try {
                console.log('[Buy] Enviando para Token API:', { playerID: gameUid, quantity });

                const res = await fetch(`${TOKEN_API_BASE}/api/enviar/tokens`, {
                    method: 'POST',
                    body: formData,
                });

                gameApiResponse = await res.json().catch(() => null);
                console.log('[Buy] Resposta Token API:', { ok: res.ok, response: gameApiResponse });

                if (!res.ok || gameApiResponse?.status !== 'CAIXA_ENVIADA') {
                    console.error('[Buy] Erro Token API:', gameApiResponse);
                    await notifyError('Buy - Token API', gameApiResponse?.message || gameApiResponse?.status || 'Unknown error', JSON.stringify(gameApiResponse));
                    return NextResponse.json({
                        success: false,
                        message: gameApiResponse?.message || 'Falha ao enviar caixa. Tente novamente.'
                    }, { status: 400 });
                }

                gameApiResponse = {
                    ...gameApiResponse,
                    quantity: quantity,
                    type: 'TOKEN'
                };

                console.log('[Buy] Caixas enviadas com sucesso!');
            } catch (apiError: any) {
                console.error('[Buy] Erro de conexão Token:', apiError);
                await notifyError('Buy - Token Connection', apiError.message || 'Connection Error');
                return NextResponse.json({
                    success: false,
                    message: 'Erro de conexão com o servidor de envio. Tente novamente.'
                }, { status: 500 });
            }
        } else {
            console.log('[Buy] Tipo genérico:', product.type);
        }

        const newBalance = user.balance - finalPrice;
        console.log('[Buy] Deduzindo saldo:', user.balance, '->', newBalance);

        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[Buy] Erro ao atualizar saldo');
            await notifyError('Buy', 'Failed to update balance', `UserId: ${userId}`);
            return NextResponse.json({ success: false, message: 'Failed to update balance' }, { status: 500 });
        }

        if (product.type === 'PASSE') {
            console.log('[Buy] Decrementando estoque...');
            const stockUpdated = updateProductStock(productId, 1);
            if (!stockUpdated) {
                console.error('[Buy] Erro ao atualizar estoque - Revertendo saldo');

                updateUser(userId, { balance: user.balance });
                return NextResponse.json({ success: false, message: 'Failed to update stock' }, { status: 500 });
            }

            console.log('[Buy] Sincronizando estoque de passes...');
            syncPasseStock();
        }

        if ((product.type as string) === 'TOKEN') {
            console.log('[Buy] Sincronizando estoque de tokens...');
            syncTokenStock();
        }

        const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let description = '';

        const playerNick = likesResult?.player || gameApiResponse?.player || gameApiResponse?.nickname || null;

        if (product.type === 'LIKES') {
            description = couponUsed
                ? `Compra: ${product.name} para UID ${gameUid} (+${likesResult?.likesAdded || 250} likes) (Cupom: ${couponCode}, Desconto: R$ ${discountApplied.toFixed(2)})`
                : `Compra: ${product.name} para UID ${gameUid} (+${likesResult?.likesAdded || 250} likes)`;
        } else if ((product.type as string) === 'GUEST_ACCOUNT') {
            description = couponUsed
                ? `Compra: ${product.name} - Conta UID: ${gameApiResponse?.uid} (Cupom: ${couponCode}, Desconto: R$ ${discountApplied.toFixed(2)})`
                : `Compra: ${product.name} - Conta UID: ${gameApiResponse?.uid}`;
        } else if ((product.type as string) === 'TOKEN') {
            const qty = gameApiResponse?.quantity || 1;
            description = couponUsed
                ? `Compra: ${qty}x ${product.name} para UID ${gameUid} (Cupom: ${couponCode}, Desconto: R$ ${discountApplied.toFixed(2)})`
                : `Compra: ${qty}x ${product.name} para UID ${gameUid}`;
        } else {
            description = couponUsed
                ? `Compra: ${product.name} para UID ${gameUid} (Cupom: ${couponCode}, Desconto: R$ ${discountApplied.toFixed(2)})`
                : `Compra: ${product.name} para UID ${gameUid}`;
        }

        console.log('[Buy] Criando transação:', txId);

        createTransaction({
            id: txId,
            userId: userId,
            type: 'PURCHASE',
            description: description,
            amount: finalPrice,
            status: 'COMPLETED',

            gameUid: (product.type as string) === 'GUEST_ACCOUNT' ? gameApiResponse?.uid : gameUid,
            playerNick: playerNick,
            productName: product.name,
            likesAdded: likesResult?.likesAdded || undefined,
            couponCode: couponUsed ? couponCode : undefined,
            discount: discountApplied > 0 ? discountApplied : undefined,

            guestAccountUid: (product.type as string) === 'GUEST_ACCOUNT' ? gameApiResponse?.uid : undefined,
            guestAccountPassword: (product.type as string) === 'GUEST_ACCOUNT' ? gameApiResponse?.password : undefined
        });

        try {
            const forwarded = req.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';

            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
            const geoData = await geoRes.json();

            if (geoData.status === 'success') {
                recordPurchaseLocation({
                    userId: userId,
                    productId: product.id,
                    productName: product.name,
                    amount: finalPrice,
                    country: geoData.country,
                    region: geoData.regionName,
                    city: geoData.city,
                    state: geoData.regionName
                });
            }
        } catch (e) {
            console.log('[Buy] Erro ao registrar localização:', e);
        }

        if (product.type === 'PASSE') {
            await notifyPasseSent(userId, gameUid, product.name, finalPrice);

            await notifyPublicPasseSent(gameUid);
        }

        if (product.type === 'LIKES' && likesResult) {

            await notifyPublicLikesSent(gameUid, likesResult.likesAdded || 250);
        }

        if ((product.type as string) === 'GUEST_ACCOUNT') {

            await notifyPublicGuestAccountSold(product.name);
        }

        if ((product.type as string) === 'TOKEN') {
            const qty = gameApiResponse?.quantity || 1;
            await notifyTokenSent(userId, gameUid, qty, finalPrice);

            await notifyPublicTokenSent(gameUid, qty);
        }

        if ((product.type as string) === 'GUEST_ACCOUNT') {
            await sendGuestAccountEmail(
                user.email,
                user.name,
                gameApiResponse?.uid,
                gameApiResponse?.password,
                finalPrice
            );
        } else {
            await sendPurchaseEmail(
                user.email,
                user.name,
                product.name,
                playerNick || 'Jogador',
                gameUid,
                finalPrice,
                likesResult?.likesAdded
            );
        }

        console.log('[Buy] Compra concluída com sucesso!');

        let responseMessage = '';
        if (product.type === 'LIKES') {
            responseMessage = `Likes enviados com sucesso! +${likesResult?.likesAdded || 250} likes para ${likesResult?.player || gameUid}`;
        } else if ((product.type as string) === 'GUEST_ACCOUNT') {
            responseMessage = `Conta adquirida com sucesso! Anote suas credenciais.`;
        } else if ((product.type as string) === 'TOKEN') {
            const qty = gameApiResponse?.quantity || 1;
            responseMessage = `${qty} caixa(s) token enviada(s) com sucesso para ${gameUid}!`;
        } else {
            responseMessage = `Passe enviado com sucesso para ${playerNick || gameUid}!`;
        }

        const responseData: any = {
            message: responseMessage,
            newBalance: newBalance,
            product: product.name,
            gameUid: (product.type as string) === 'GUEST_ACCOUNT' ? gameApiResponse?.uid : gameUid,
            playerNick: playerNick || null,
            originalPrice: product.price,
            discount: discountApplied,
            finalPrice: finalPrice,
            couponUsed: couponUsed,
            transactionId: txId,
            giftMessage: product.type === 'PASSE' ? finalMessage : undefined,

            guestAccount: (product.type as string) === 'GUEST_ACCOUNT' ? {
                uid: gameApiResponse?.uid,
                password: gameApiResponse?.password
            } : undefined
        };

        if (product.type === 'LIKES' && likesResult) {
            responseData.likesInfo = {
                player: likesResult.player,
                likesAdded: likesResult.likesAdded,
                initialLikes: likesResult.initialLikes,
                finalLikes: likesResult.finalLikes
            };
        }

        if (product.type === 'PASSE') {
            responseData.passeInfo = {
                playerNick: playerNick,
                gameUid: gameUid,
                messageSent: finalMessage
            };
        }

        const payload = encryptData(responseData);

        return NextResponse.json({ success: true, data: payload });

    } catch (error: any) {
        console.error('[Buy] Erro geral:', error);
        await notifyError('Buy', error.message || 'Unknown Error', error.stack);
        const message = error.message || 'Internal Server Error';

        if (message === 'User not found' || message === 'Product not found') {
            return NextResponse.json({ success: false, message }, { status: 404 });
        }
        if (message === 'Insufficient balance' || message === 'Out of stock') {
            return NextResponse.json({ success: false, message }, { status: 400 });
        }

        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
