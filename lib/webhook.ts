const WEBHOOK_URL = process.env.LIKES_WEBHOOK_URL || '';

interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, any>;
}

interface DiscordEmbed {
    title: string;
    description?: string;
    color: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: { text: string };
    timestamp?: string;
}

const COLORS = {
    SUCCESS: 0x00FF00,
    INFO: 0x0099FF,
    WARNING: 0xFFAA00,
    ERROR: 0xFF0000,
    PURPLE: 0x9B59B6,
    PINK: 0xFF69B4,
};

async function sendWebhook(payload: WebhookPayload): Promise<boolean> {
    if (!WEBHOOK_URL) {
        console.log('[Webhook] URL não configurada');
        return false;
    }

    const embed: DiscordEmbed = {
        title: getEventTitle(payload.event),
        color: getEventColor(payload.event),
        fields: formatDataAsFields(payload.data),
        footer: { text: 'LHUB • Webhook de Likes' },
        timestamp: payload.timestamp
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'LHUB Likes',
                avatar_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg',
                embeds: [embed]
            }),
        });

        if (response.ok) {
            console.log('[Webhook] Enviado com sucesso:', payload.event);
            return true;
        } else {
            console.error('[Webhook] Falha ao enviar:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Webhook] Erro:', error);
        return false;
    }
}

function getEventTitle(event: string): string {
    const titles: Record<string, string> = {
        'likes.subscription.created': '🛒 Nova Assinatura de Likes',
        'likes.delivery.sent': '❤️ Likes Entregues',
        'likes.subscription.completed': '✅ Assinatura Concluída',
        'likes.delivery.error': '❌ Erro na Entrega'
    };
    return titles[event] || `📌 ${event}`;
}

function getEventColor(event: string): number {
    if (event.includes('error')) return COLORS.ERROR;
    if (event.includes('completed')) return COLORS.SUCCESS;
    if (event.includes('created')) return COLORS.PURPLE;
    return COLORS.INFO;
}

function formatDataAsFields(data: Record<string, any>): { name: string; value: string; inline?: boolean }[] {
    const fields: { name: string; value: string; inline?: boolean }[] = [];

    if (data.user) {
        fields.push({ name: '👤 Usuário', value: `${data.user.name}\n${data.user.email}`, inline: true });
    }

    if (data.player) {
        fields.push({ name: '🎮 Player', value: `${data.player.name || data.player.id}\nID: ${data.player.id}${data.player.region ? `\nRegião: ${data.player.region}` : ''}`, inline: true });
    }

    if (data.plan) {
        fields.push({ name: '📦 Plano', value: `${data.plan.total_likes} likes\nR$ ${data.plan.price?.toFixed(2) || '0.00'}\n~${data.plan.estimated_days} dias`, inline: true });
    }

    if (data.delivery) {
        fields.push({ name: '📊 Progresso', value: `Hoje: +${data.delivery.likes_sent_today}\nTotal: ${data.delivery.total_delivered}/${data.delivery.total_likes}\n${data.delivery.progress_percent}% concluído`, inline: true });
    }

    if (data.error) {
        fields.push({ name: '⚠️ Erro', value: `${data.error.message}\nTentativas: ${data.error.count}${data.error.will_retry ? `\nRetry: ${data.error.retry_in}` : ''}`, inline: true });
    }

    if (data.order_id) {
        fields.push({ name: '🔖 Pedido', value: `\`${data.order_id}\``, inline: true });
    }

    if (data.status) {
        const statusEmoji = data.status === 'ACTIVE' ? '🟢' : data.status === 'COMPLETED' ? '✅' : data.status === 'PAUSED' ? '⏸️' : '🔄';
        fields.push({ name: '📌 Status', value: `${statusEmoji} ${data.status}`, inline: true });
    }

    return fields;
}

export async function sendLikesSubscriptionWebhook(data: {
    userId: string;
    userName: string;
    userEmail: string;
    playerId: string;
    playerName: string;
    region: string;
    totalLikes: number;
    price: number;
    estimatedDays: number;
    orderId: string;
}): Promise<boolean> {
    return sendWebhook({
        event: 'likes.subscription.created',
        timestamp: new Date().toISOString(),
        data: {
            order_id: data.orderId,
            user: {
                id: data.userId,
                name: data.userName,
                email: data.userEmail,
            },
            player: {
                id: data.playerId,
                name: data.playerName,
                region: data.region,
            },
            plan: {
                total_likes: data.totalLikes,
                price: data.price,
                daily_delivery: '100-250',
                estimated_days: data.estimatedDays,
            },
            status: 'ACTIVE',
        },
    });
}

export async function sendLikesDeliveryWebhook(data: {
    orderId: string;
    userId: string;
    userName: string;
    userEmail: string;
    playerId: string;
    playerName: string;
    likesDelivered: number;
    totalDelivered: number;
    totalLikes: number;
    isComplete: boolean;
}): Promise<boolean> {
    const progress = Math.round((data.totalDelivered / data.totalLikes) * 100);

    return sendWebhook({
        event: data.isComplete ? 'likes.subscription.completed' : 'likes.delivery.sent',
        timestamp: new Date().toISOString(),
        data: {
            order_id: data.orderId,
            user: {
                id: data.userId,
                name: data.userName,
                email: data.userEmail,
            },
            player: {
                id: data.playerId,
                name: data.playerName,
            },
            delivery: {
                likes_sent_today: data.likesDelivered,
                total_delivered: data.totalDelivered,
                total_likes: data.totalLikes,
                remaining: data.totalLikes - data.totalDelivered,
                progress_percent: progress,
            },
            status: data.isComplete ? 'COMPLETED' : 'ACTIVE',
        },
    });
}

export async function sendLikesErrorWebhook(data: {
    orderId: string;
    userId: string;
    userName: string;
    userEmail: string;
    playerId: string;
    playerName: string;
    error: string;
    errorCount: number;
    willRetry: boolean;
}): Promise<boolean> {
    return sendWebhook({
        event: 'likes.delivery.error',
        timestamp: new Date().toISOString(),
        data: {
            order_id: data.orderId,
            user: {
                id: data.userId,
                name: data.userName,
                email: data.userEmail,
            },
            player: {
                id: data.playerId,
                name: data.playerName,
            },
            error: {
                message: data.error,
                count: data.errorCount,
                will_retry: data.willRetry,
                retry_in: data.willRetry ? '2 hours' : null,
            },
            status: data.willRetry ? 'RETRYING' : 'PAUSED',
        },
    });
}
