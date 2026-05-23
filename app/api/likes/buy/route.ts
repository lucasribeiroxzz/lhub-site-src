import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    findUserByEmail,
    updateUser,
    createTransaction,
    createLikesOrder
} from '@/lib/db';
import { notifyError } from '@/lib/discord';
import { sendLikesSubscriptionEmail } from '@/lib/email';
import { sendLikesSubscriptionWebhook } from '@/lib/webhook';

export async function POST(req: Request) {
    console.log('[Likes Buy] Iniciando compra de pacote de likes');
    
    try {
        const body = await req.json();
        const { packageId, totalLikes, price, gameUid, playerName, region } = body;
        
        console.log('[Likes Buy] Dados recebidos:', { packageId, totalLikes, price, gameUid, playerName, region });

        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            console.log('[Likes Buy] Erro: Token não encontrado');
            return NextResponse.json({ success: false, message: "Faça login para continuar." }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            console.log('[Likes Buy] Erro: Token inválido');
            return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
        }

        const userId = sessionPayload.email as string;
        console.log('[Likes Buy] Usuário autenticado:', userId);

        if (!totalLikes || totalLikes < 100 || totalLikes > 1500) {
            return NextResponse.json({ success: false, message: 'Quantidade de likes inválida' }, { status: 400 });
        }

        if (!price || price < 0.90) {
            return NextResponse.json({ success: false, message: 'Preço inválido' }, { status: 400 });
        }

        if (!gameUid || gameUid.length < 5) {
            return NextResponse.json({ success: false, message: 'UID do jogador inválido' }, { status: 400 });
        }

        const user = findUserByEmail(userId);
        if (!user) {
            console.log('[Likes Buy] Erro: Usuário não encontrado:', userId);
            return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
        }

        console.log('[Likes Buy] Saldo do usuário:', user.balance, '| Preço:', price);

        if (user.balance < price) {
            console.log('[Likes Buy] Erro: Saldo insuficiente');
            return NextResponse.json({ success: false, message: 'Saldo insuficiente' }, { status: 400 });
        }

        const newBalance = user.balance - price;
        const updatedUser = updateUser(userId, { balance: newBalance });

        if (!updatedUser) {
            console.error('[Likes Buy] Erro ao atualizar saldo');
            return NextResponse.json({ success: false, message: 'Erro ao processar pagamento' }, { status: 500 });
        }

        console.log('[Likes Buy] Saldo atualizado:', newBalance);

        const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        

        const avgPerDay = 175;
        const estimatedDays = Math.ceil(totalLikes / avgPerDay);
        

        const now = new Date();
        
        const likesOrder = createLikesOrder({
            orderId: orderId,
            userId: userId,
            playerId: gameUid,
            playerName: playerName || 'Unknown',
            region: region || 'BR',
            totalLikes: totalLikes,
            likesDelivered: 0,
            likesPerDay: 175,
            daysTotal: estimatedDays,
            daysCompleted: 0,
            status: 'ACTIVE',
            nextDelivery: now.toISOString(),
            errorCount: 0
        });

        console.log('[Likes Buy] Pedido criado:', likesOrder.id);

        const transactionId = `TX-LIKES-${Date.now()}`;
        createTransaction({
            id: transactionId,
            userId: userId,
            type: 'PURCHASE',
            description: `Compra: ${totalLikes} Likes para UID ${gameUid} (${playerName})`,
            amount: price,
            status: 'COMPLETED',
            gameUid: gameUid,
            playerNick: playerName,
            productName: `${totalLikes} Likes`
        });

        console.log('[Likes Buy] Transação criada:', transactionId);

        try {
            await sendLikesSubscriptionEmail(
                user.email,
                user.name,
                totalLikes,
                price,
                playerName || 'Unknown',
                gameUid,
                estimatedDays
            );
            console.log('[Likes Buy] Email de confirmação enviado');
        } catch (emailError) {
            console.error('[Likes Buy] Erro ao enviar email:', emailError);
        }

        try {
            await sendLikesSubscriptionWebhook({
                userId: userId,
                userName: user.name,
                userEmail: user.email,
                playerId: gameUid,
                playerName: playerName || 'Unknown',
                region: region || 'BR',
                totalLikes: totalLikes,
                price: price,
                estimatedDays: estimatedDays,
                orderId: orderId
            });
            console.log('[Likes Buy] Webhook enviado');
        } catch (webhookError) {
            console.error('[Likes Buy] Erro ao enviar webhook:', webhookError);
        }

        return NextResponse.json({
            success: true,
            message: 'Pedido de likes criado com sucesso!',
            data: {
                orderId: likesOrder.id,
                totalLikes: totalLikes,
                estimatedDays: estimatedDays,
                likesPerDay: '100-250',
                newBalance: newBalance
            }
        });

    } catch (error: any) {
        console.error('[Likes Buy] Erro geral:', error);
        await notifyError('Likes Buy', error.message || 'Unknown Error', error.stack);
        return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
    }
}
