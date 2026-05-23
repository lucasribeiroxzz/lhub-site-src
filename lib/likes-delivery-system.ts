import {
    getPendingLikesDeliveries,
    addLikesDelivery,
    updateLikesOrder,
    getLikesOrderById,
    findUserByEmail
} from './db';
import { notifyLikesSent, notifyError } from './discord';
import { sendLikesDeliveryEmail } from './email';
import { sendLikesDeliveryWebhook, sendLikesErrorWebhook } from './webhook';

const LIKES_API_BASE = 'https://blnhublikes1.discloud.app';
const LIKES_API_KEY = process.env.LIKES_API_KEY || '';

const CHECK_INTERVAL = 5 * 60 * 1000;

const RETRY_INTERVAL = 2 * 60 * 60 * 1000;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

function log(msg: string) {
    const timestamp = new Date().toISOString();
    console.log(`[LikesDelivery ${timestamp}] ${msg}`);
}

function getRandomLikesAmount(): number {
    return Math.floor(Math.random() * (250 - 100 + 1)) + 100;
}

function isOrderReadyForDelivery(order: any): boolean {
    if (order.status !== 'ACTIVE' && order.status !== 'ERROR') {
        return false;
    }

    if (order.likesDelivered >= order.totalLikes) {
        return false;
    }

    const now = new Date();

    if (order.nextDelivery) {
        const nextDeliveryDate = new Date(order.nextDelivery);
        if (nextDeliveryDate > now) {
            return false;
        }
    }

    if (order.lastDelivery) {
        const lastDeliveryDate = new Date(order.lastDelivery);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lastDeliveryDate >= today && order.status === 'ACTIVE') {

            return false;
        }
    }

    return true;
}

async function processDelivery(order: any): Promise<{ success: boolean; likesAdded: number; error?: string }> {
    log(`Processando pedido ${order.id} - Player: ${order.playerId}`);

    if (!LIKES_API_KEY || LIKES_API_KEY === 'SUA_CHAVE_AQUI') {
        log('API Key de likes não configurada!');
        return { success: false, likesAdded: 0, error: 'API Key não configurada' };
    }

    try {

        const apiUrl = `${LIKES_API_BASE}/send_likes?id=${order.playerId}&key=${LIKES_API_KEY}`;
        log(`Chamando API: ${apiUrl.replace(LIKES_API_KEY, '***')}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            log(`Resposta não é JSON: ${text.substring(0, 100)}`);
            return { success: false, likesAdded: 0, error: `Resposta inválida: ${text.substring(0, 50)}` };
        }

        log(`Resposta API: ${JSON.stringify(data)}`);

        if (data.status_envio === "SUCESSO") {

            const likesAddedMatch = data.sent?.match(/(\d+)/);
            const likesAdded = likesAddedMatch ? parseInt(likesAddedMatch[1]) : 250;
            
            log(`Sucesso! +${likesAdded} likes enviados`);
            return { success: true, likesAdded: likesAdded };
        } else {

            let errorMsg: string;
            if (data.res === "LIMIT_EXCEEDED") {
                errorMsg = 'Limite diário atingido. Tentando novamente em 2 horas.';
            } else {
                errorMsg = data.error || data.res || 'Erro desconhecido. Tentando novamente em 2 horas.';
            }
            log(`Erro: ${errorMsg}`);
            return { success: false, likesAdded: data.likesAdded || 0, error: errorMsg };
        }

    } catch (error: any) {
        log(`Exceção: ${error.message}`);
        return { success: false, likesAdded: 0, error: error.message || 'Erro de conexão' };
    }
}

async function processAllPendingDeliveries(): Promise<void> {
    log('Verificando entregas pendentes...');

    try {
        const pendingOrders = getPendingLikesDeliveries();

        const readyOrders = pendingOrders.filter(isOrderReadyForDelivery);

        log(`Pedidos pendentes: ${pendingOrders.length} | Prontos para entrega: ${readyOrders.length}`);

        if (readyOrders.length === 0) {
            return;
        }

        for (const order of readyOrders) {
            log(`=== Processando pedido ${order.id} ===`);
            log(`Player: ${order.playerId} | Progresso: ${order.likesDelivered}/${order.totalLikes}`);

            const result = await processDelivery(order);

            const now = new Date();

            if (result.success) {

                const delivery = {
                    date: now.toISOString(),
                    likesAdded: result.likesAdded,
                    success: true
                };

                addLikesDelivery(order.id, delivery);

                const newTotalDelivered = order.likesDelivered + result.likesAdded;
                const isComplete = newTotalDelivered >= order.totalLikes;

                try {
                    await notifyLikesSent(
                        order.userId,
                        order.playerId,
                        order.playerName || 'Unknown',
                        result.likesAdded,
                        newTotalDelivered,
                        order.totalLikes
                    );
                } catch (e) {
                    log(`Erro ao notificar Discord: ${e}`);
                }

                try {
                    const user = findUserByEmail(order.userId);
                    if (user) {
                        await sendLikesDeliveryEmail(
                            user.email,
                            user.name,
                            result.likesAdded,
                            newTotalDelivered,
                            order.totalLikes,
                            order.playerName || 'Unknown',
                            order.playerId
                        );
                        log('Email de entrega enviado');
                    }
                } catch (e) {
                    log(`Erro ao enviar email: ${e}`);
                }

                try {
                    const user = findUserByEmail(order.userId);
                    if (user) {
                        await sendLikesDeliveryWebhook({
                            orderId: order.id,
                            userId: order.userId,
                            userName: user.name,
                            userEmail: user.email,
                            playerId: order.playerId,
                            playerName: order.playerName || 'Unknown',
                            likesDelivered: result.likesAdded,
                            totalDelivered: newTotalDelivered,
                            totalLikes: order.totalLikes,
                            isComplete: isComplete
                        });
                        log('Webhook de entrega enviado');
                    }
                } catch (e) {
                    log(`Erro ao enviar webhook: ${e}`);
                }

                if (!isComplete) {
                    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    updateLikesOrder(order.id, {
                        nextDelivery: next24h.toISOString(),
                        status: 'ACTIVE',
                        errorCount: 0
                    });
                    log(`Próxima entrega agendada para: ${next24h.toISOString()}`);
                }

                log(`✓ Entrega concluída: +${result.likesAdded} likes`);

            } else {

                const delivery = {
                    date: now.toISOString(),
                    likesAdded: 0,
                    success: false,
                    error: result.error
                };

                addLikesDelivery(order.id, delivery);

                const nextRetry = new Date(now.getTime() + RETRY_INTERVAL);
                const newErrorCount = (order.errorCount || 0) + 1;

                updateLikesOrder(order.id, {
                    nextDelivery: nextRetry.toISOString(),
                    status: 'ERROR',
                    lastError: result.error,
                    errorCount: newErrorCount
                });

                try {
                    const user = findUserByEmail(order.userId);
                    if (user) {
                        await sendLikesErrorWebhook({
                            orderId: order.id,
                            userId: order.userId,
                            userName: user.name,
                            userEmail: user.email,
                            playerId: order.playerId,
                            playerName: order.playerName || 'Unknown',
                            error: result.error || 'Erro desconhecido',
                            errorCount: newErrorCount,
                            willRetry: true
                        });
                        log('Webhook de erro enviado');
                    }
                } catch (e) {
                    log(`Erro ao enviar webhook de erro: ${e}`);
                }

                log(`✗ Erro na entrega. Retry agendado para: ${nextRetry.toISOString()}`);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        log('Processamento concluído');

    } catch (error: any) {
        log(`Erro geral no processamento: ${error.message}`);
        try {
            await notifyError('Likes Delivery System', error.message, error.stack);
        } catch (e) { }
    }
}

export function startLikesDeliverySystem(): void {
    if (isRunning) {
        log('Sistema já está rodando');
        return;
    }

    log('='.repeat(50));
    log('INICIANDO SISTEMA DE ENTREGA DE LIKES');
    log(`Intervalo de verificação: ${CHECK_INTERVAL / 1000 / 60} minutos`);
    log(`Intervalo de retry: ${RETRY_INTERVAL / 1000 / 60 / 60} horas`);
    log(`API Key configurada: ${LIKES_API_KEY ? 'Sim' : 'Não'}`);
    log('='.repeat(50));

    isRunning = true;

    processAllPendingDeliveries();

    intervalId = setInterval(processAllPendingDeliveries, CHECK_INTERVAL);
}

export function stopLikesDeliverySystem(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning = false;
    log('Sistema de entrega de likes parado');
}

export function isLikesDeliverySystemRunning(): boolean {
    return isRunning;
}

export async function forceProcessOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    const order = getLikesOrderById(orderId);

    if (!order) {
        return { success: false, message: 'Pedido não encontrado' };
    }

    if (order.likesDelivered >= order.totalLikes) {
        return { success: false, message: 'Pedido já foi completado' };
    }

    const result = await processDelivery(order);

    if (result.success) {
        const delivery = {
            date: new Date().toISOString(),
            likesAdded: result.likesAdded,
            success: true
        };
        addLikesDelivery(orderId, delivery);
        return { success: true, message: `+${result.likesAdded} likes enviados` };
    } else {
        return { success: false, message: result.error || 'Erro ao enviar likes' };
    }
}

if (typeof window === 'undefined') {

    setTimeout(() => {
        startLikesDeliverySystem();
    }, 10000);
}
