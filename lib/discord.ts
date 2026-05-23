const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const DISCORD_PUBLIC_WEBHOOK_URL = process.env.DISCORD_PUBLIC_WEBHOOK_URL || 'https://discord.com/api/webhooks/1458956627200704653/DZ7zng0FzRI8qFR-OtjGdqBQ8doAInW2XID_LP10vWPQxkiUHhaw697fHb7OlyyOqtzW';

const DISCORD_WEBHOOK_REGISTRO = process.env.DISCORD_WEBHOOK_REGISTRO || '';
const DISCORD_WEBHOOK_LOGIN = process.env.DISCORD_WEBHOOK_LOGIN || '';
const DISCORD_WEBHOOK_PAGAMENTOS = process.env.DISCORD_WEBHOOK_PAGAMENTOS || '';
const DISCORD_WEBHOOK_ERROS = process.env.DISCORD_WEBHOOK_ERROS || '';

interface DiscordEmbed {
    title: string;
    description?: string;
    color: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: { text: string; icon_url?: string };
    timestamp?: string;
    thumbnail?: { url: string };
    image?: { url: string };
}

interface WebhookQueueItem {
    content: string;
    embeds?: DiscordEmbed[];
    webhookUrl: string;
    retries: number;
}

const webhookQueues = new Map<string, WebhookQueueItem[]>();

const webhookLastSent = new Map<string, number[]>();

const webhookProcessing = new Map<string, boolean>();

const WEBHOOK_RATE_LIMIT = 25;
const WEBHOOK_RATE_WINDOW = 60000;
const WEBHOOK_RETRY_DELAY = 5000;
const WEBHOOK_MAX_RETRIES = 3;

function canSendToWebhook(webhookUrl: string): boolean {
    const now = Date.now();
    const timestamps = webhookLastSent.get(webhookUrl) || [];

    const recentTimestamps = timestamps.filter(t => now - t < WEBHOOK_RATE_WINDOW);
    webhookLastSent.set(webhookUrl, recentTimestamps);

    return recentTimestamps.length < WEBHOOK_RATE_LIMIT;
}

function recordWebhookSend(webhookUrl: string): void {
    const timestamps = webhookLastSent.get(webhookUrl) || [];
    timestamps.push(Date.now());
    webhookLastSent.set(webhookUrl, timestamps);
}

async function processWebhookQueue(webhookUrl: string): Promise<void> {
    if (webhookProcessing.get(webhookUrl)) return;
    webhookProcessing.set(webhookUrl, true);

    const queue = webhookQueues.get(webhookUrl) || [];

    while (queue.length > 0) {
        if (!canSendToWebhook(webhookUrl)) {

            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
        }

        const item = queue[0];

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: item.content,
                    embeds: item.embeds,
                    username: 'LHUB',
                    avatar_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
                })
            });

            if (response.ok) {

                queue.shift();
                recordWebhookSend(webhookUrl);
                console.log('[Discord Webhook] Mensagem enviada com sucesso');
            } else if (response.status === 429) {

                const retryAfter = parseInt(response.headers.get('Retry-After') || '5') * 1000;
                console.warn(`[Discord Webhook] Rate limited, aguardando ${retryAfter}ms`);
                await new Promise(resolve => setTimeout(resolve, retryAfter));
            } else {

                console.error('[Discord Webhook] Erro ao enviar:', response.status);
                item.retries++;

                if (item.retries >= WEBHOOK_MAX_RETRIES) {

                    queue.shift();
                    console.error('[Discord Webhook] Mensagem descartada após máximo de tentativas');
                } else {
                    await new Promise(resolve => setTimeout(resolve, WEBHOOK_RETRY_DELAY));
                }
            }
        } catch (error) {
            console.error('[Discord Webhook] Erro de conexão:', error);
            item.retries++;

            if (item.retries >= WEBHOOK_MAX_RETRIES) {
                queue.shift();
            } else {
                await new Promise(resolve => setTimeout(resolve, WEBHOOK_RETRY_DELAY));
            }
        }
    }

    webhookProcessing.set(webhookUrl, false);
}

function queueWebhookMessage(content: string, embeds?: DiscordEmbed[], webhookUrl?: string): void {
    const url = webhookUrl || DISCORD_WEBHOOK_URL;
    if (!url) {
        console.log('[Discord Webhook] URL não configurada');
        return;
    }

    const queue = webhookQueues.get(url) || [];
    queue.push({ content, embeds, webhookUrl: url, retries: 0 });
    webhookQueues.set(url, queue);

    processWebhookQueue(url).catch(err => {
        console.error('[Discord Webhook] Erro no processamento da queue:', err);
    });
}

async function sendWebhook(content: string, embeds?: DiscordEmbed[], webhookUrl?: string): Promise<boolean> {
    const url = webhookUrl || DISCORD_WEBHOOK_URL;
    if (!url) {
        console.log('[Discord Webhook] URL não configurada');
        return false;
    }

    queueWebhookMessage(content, embeds, url);
    return true;
}

async function sendPublicWebhook(content: string, embeds?: DiscordEmbed[]): Promise<boolean> {
    return sendWebhook(content, embeds, DISCORD_PUBLIC_WEBHOOK_URL);
}

const COLORS = {
    SUCCESS: 0x00FF00,
    INFO: 0x0099FF,
    WARNING: 0xFFAA00,
    ERROR: 0xFF0000,
    PURPLE: 0x9B59B6,
    PINK: 0xFF69B4,
    GOLD: 0xFFD700,
    CYAN: 0x00FFFF
};

export async function notifyNewUser(name: string, email: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '👤 Novo Usuário Registrado',
        color: COLORS.INFO,
        fields: [
            { name: 'Nome', value: name, inline: true },
            { name: 'Email', value: email, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_REGISTRO || DISCORD_WEBHOOK_URL);
}

export async function notifyLogin(email: string, name?: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🔐 Novo Login',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Email', value: email, inline: true },
            ...(name ? [{ name: 'Nome', value: name, inline: true }] : [])
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_LOGIN || DISCORD_WEBHOOK_URL);
}

export async function notifyDiscordLogin(email: string, name: string, discordUsername: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🔐 Novo Login via Discord',
        color: 0x5865F2,
        fields: [
            { name: 'Nome', value: name, inline: true },
            { name: 'Email', value: email, inline: true },
            { name: 'Discord', value: discordUsername, inline: true }
        ],
        footer: { text: 'LHUB • Discord OAuth' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_LOGIN || DISCORD_WEBHOOK_URL);
}

export async function notifyDeposit(userId: string, amount: number, transactionId: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '💰 Nova Recarga PIX',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Usuário', value: userId, inline: true },
            { name: 'Valor', value: `R$ ${amount.toFixed(2)}`, inline: true },
            { name: 'ID Transação', value: transactionId, inline: false }
        ],
        footer: { text: 'MisticPay' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_PAGAMENTOS || DISCORD_WEBHOOK_URL);
}

export async function notifyPaymentConfirmed(userId: string, amount: number, newBalance: number): Promise<void> {
    const embed: DiscordEmbed = {
        title: '✅ Pagamento Confirmado',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Usuário', value: userId, inline: true },
            { name: 'Valor', value: `R$ ${amount.toFixed(2)}`, inline: true },
            { name: 'Novo Saldo', value: `R$ ${newBalance.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'MisticPay' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_PAGAMENTOS || DISCORD_WEBHOOK_URL);
}

export async function notifyPasseSent(userId: string, gameUid: string, productName: string, price: number): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🎮 Passe Enviado com Sucesso',
        color: COLORS.PURPLE,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'UID do Jogo', value: gameUid, inline: true },
            { name: 'Produto', value: productName, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicPasseSent(gameUid: string): Promise<void> {
    const maskedUid = gameUid.substring(0, 3) + '*'.repeat(Math.max(0, gameUid.length - 5)) + gameUid.substring(gameUid.length - 2);

    const embed: DiscordEmbed = {
        title: '🎮 PASSE DE ELITE ENTREGUE!',
        description: `\`\`\`diff\n+ Entrega realizada com sucesso!\n\`\`\``,
        color: COLORS.PURPLE,
        fields: [
            {
                name: '👤 Destinatário',
                value: `\`${maskedUid}\``,
                inline: true
            },
            {
                name: '📦 Produto',
                value: '`Passe de Elite`',
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

export async function notifyPublicLikesSent(gameUid: string, likesAmount: number): Promise<void> {
    const maskedUid = gameUid.substring(0, 3) + '*'.repeat(Math.max(0, gameUid.length - 5)) + gameUid.substring(gameUid.length - 2);

    const embed: DiscordEmbed = {
        title: '❤️ LIKES ENTREGUES!',
        description: `\`\`\`diff\n+ ${likesAmount} likes enviados com sucesso!\n\`\`\``,
        color: COLORS.PINK,
        fields: [
            {
                name: '👤 Destinatário',
                value: `\`${maskedUid}\``,
                inline: true
            },
            {
                name: '❤️ Quantidade',
                value: `\`${likesAmount} likes\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

export async function notifyTokenSent(userId: string, gameUid: string, quantity: number, price: number): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🎁 Caixa Token Enviada',
        color: COLORS.GOLD,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'UID do Jogo', value: gameUid, inline: true },
            { name: 'Quantidade', value: `${quantity}x`, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicTokenSent(gameUid: string, quantity: number): Promise<void> {
    const maskedUid = gameUid.substring(0, 3) + '*'.repeat(Math.max(0, gameUid.length - 5)) + gameUid.substring(gameUid.length - 2);

    const embed: DiscordEmbed = {
        title: '🎁 CAIXA TOKEN ENTREGUE!',
        description: `\`\`\`diff\n+ ${quantity} caixa(s) entregue(s) com sucesso!\n\`\`\``,
        color: COLORS.GOLD,
        fields: [
            {
                name: '👤 Destinatário',
                value: `\`${maskedUid}\``,
                inline: true
            },
            {
                name: '📦 Quantidade',
                value: `\`${quantity}x Caixa Universal\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

export async function notifyError(context: string, error: string, details?: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '❌ Erro no Sistema',
        description: details,
        color: COLORS.ERROR,
        fields: [
            { name: 'Contexto', value: context, inline: true },
            { name: 'Erro', value: error.substring(0, 1000), inline: false }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed], DISCORD_WEBHOOK_ERROS || DISCORD_WEBHOOK_URL);
}

export async function notifyAccountAdded(uid: string, success: boolean, message?: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: success ? '✅ Conta Adicionada' : '❌ Erro ao Adicionar Conta',
        color: success ? COLORS.SUCCESS : COLORS.ERROR,
        fields: [
            { name: 'UID', value: uid, inline: true },
            { name: 'Status', value: success ? 'Sucesso' : 'Falha', inline: true },
            ...(message ? [{ name: 'Mensagem', value: message, inline: false }] : [])
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyLikesSent(
    userId: string,
    playerId: string,
    playerName: string,
    likesAdded: number,
    totalDelivered: number,
    totalOrdered: number
): Promise<void> {
    const progress = Math.round((totalDelivered / totalOrdered) * 100);
    const remaining = totalOrdered - totalDelivered;

    const embed: DiscordEmbed = {
        title: '❤️ Likes Enviados',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Player ID', value: playerId, inline: true },
            { name: 'Player Name', value: playerName, inline: true },
            { name: 'Likes Enviados', value: `+${likesAdded}`, inline: true },
            { name: 'Progresso', value: `${totalDelivered}/${totalOrdered} (${progress}%)`, inline: true },
            { name: 'Restantes', value: `${remaining}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyLikesPurchase(
    userId: string,
    playerId: string,
    totalLikes: number,
    days: number,
    price: number
): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🛒 Nova Compra de Likes',
        color: COLORS.PURPLE,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Player ID', value: playerId, inline: true },
            { name: 'Total Likes', value: `${totalLikes}`, inline: true },
            { name: 'Dias de Entrega', value: `${days} dias`, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export { sendWebhook, sendPublicWebhook, COLORS };

export async function notifyPublicGuestAccountSold(productName: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🎮 CONTA GUEST VENDIDA!',
        description: `\`\`\`diff\n+ Conta entregue com sucesso!\n\`\`\``,
        color: COLORS.GOLD,
        fields: [
            {
                name: '📦 Produto',
                value: `\`${productName}\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            },
            {
                name: '🔐 Formato',
                value: '`UID:PASSWORD`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Manual',
            icon_url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

export async function notifyBypassPurchase(
    userId: string,
    uid: string,
    days: number,
    price: number,
    expiration?: string
): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🚀 Nova Compra de Bypass UID',
        color: COLORS.CYAN,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'UID', value: uid, inline: true },
            { name: 'Dias', value: `${days} dias`, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true },
            ...(expiration ? [{ name: 'Expira em', value: expiration, inline: true }] : [])
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicBypassSent(uid: string, days: number): Promise<void> {
    const maskedUid = uid.substring(0, 3) + '*'.repeat(Math.max(0, uid.length - 5)) + uid.substring(uid.length - 2);

    const embed: DiscordEmbed = {
        title: '🚀 BYPASS UID ATIVADO!',
        description: `\`\`\`diff\n+ Bypass ativado com sucesso!\n\`\`\``,
        color: COLORS.CYAN,
        fields: [
            {
                name: '👤 UID',
                value: `\`${maskedUid}\``,
                inline: true
            },
            {
                name: '📅 Duração',
                value: `\`${days} dias\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Ativado`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/hxWhyp0k/4-A3-A4-E3-A-8-C21-4890-A339-BCD87-C3-D1-E1-C.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

const CHEAT_PLAN_NAMES: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export async function notifyCheatPurchase(
    userId: string,
    key: string,
    planType: string,
    price: number
): Promise<void> {
    const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);

    const embed: DiscordEmbed = {
        title: '🎯 Nova Compra de Cheat External',
        color: COLORS.PURPLE,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Plano', value: CHEAT_PLAN_NAMES[planType] || planType, inline: true },
            { name: 'Key', value: `\`${maskedKey}\``, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicCheatSold(planType: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '🎯 CHEAT EXTERNAL VENDIDO!',
        description: `\`\`\`diff\n+ Key entregue com sucesso!\n\`\`\``,
        color: COLORS.PURPLE,
        fields: [
            {
                name: '📦 Produto',
                value: '`Cheat External`',
                inline: true
            },
            {
                name: '📅 Plano',
                value: `\`${CHEAT_PLAN_NAMES[planType] || planType}\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

const MODAPK_PLAN_NAMES: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export async function notifyModApkPurchase(
    userId: string,
    key: string,
    planType: string,
    price: number
): Promise<void> {
    const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);

    const embed: DiscordEmbed = {
        title: '📱 Nova Compra de ModApk Android',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Plano', value: MODAPK_PLAN_NAMES[planType] || planType, inline: true },
            { name: 'Key', value: `\`${maskedKey}\``, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicModApkSold(planType: string): Promise<void> {
    const embed: DiscordEmbed = {
        title: '📱 MODAPK ANDROID VENDIDO!',
        description: `\`\`\`diff\n+ Key entregue com sucesso!\n\`\`\``,
        color: COLORS.SUCCESS,
        fields: [
            {
                name: '📦 Produto',
                value: '`ModApk - Android`',
                inline: true
            },
            {
                name: '📅 Plano',
                value: `\`${MODAPK_PLAN_NAMES[planType] || planType}\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

export async function notifyDiamondsSent(
    userId: string,
    playerNick: string,
    diamondAmount: number,
    price: number
): Promise<void> {
    const embed: DiscordEmbed = {
        title: '💎 Diamantes Enviados com Sucesso',
        color: COLORS.CYAN,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Jogador', value: playerNick, inline: true },
            { name: 'Diamantes', value: `${diamondAmount.toLocaleString()}`, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicDiamondsSent(playerNick: string, diamondAmount: number): Promise<void> {
    const maskedNick = playerNick.length > 4
        ? playerNick.substring(0, 2) + '*'.repeat(playerNick.length - 4) + playerNick.substring(playerNick.length - 2)
        : '***';

    const embed: DiscordEmbed = {
        title: '💎 DIAMANTES ENTREGUES!',
        description: `\`\`\`diff\n+ ${diamondAmount.toLocaleString()} diamantes enviados com sucesso!\n\`\`\``,
        color: COLORS.CYAN,
        fields: [
            {
                name: '👤 Destinatário',
                value: `\`${maskedNick}\``,
                inline: true
            },
            {
                name: '💎 Quantidade',
                value: `\`${diamondAmount.toLocaleString()} diamantes\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}

const STREAMING_PLATFORM_NAMES: { [key: string]: string } = {
    'hbomax': 'HBO Max',
    'primevideo': 'Prime Video',
    'crunchyroll': 'Crunchyroll',
    'paramount': 'Paramount+',
    'canvapro': 'Canva Pro',
    'disney': 'Disney+'
};

export async function notifyStreamingPurchase(
    userId: string,
    platform: string,
    key: string,
    price: number
): Promise<void> {
    const maskedKey = key.length > 10
        ? key.substring(0, 6) + '...' + key.substring(key.length - 4)
        : '****';

    const platformName = STREAMING_PLATFORM_NAMES[platform] || platform;

    const embed: DiscordEmbed = {
        title: '📺 Nova Compra de Streaming',
        color: COLORS.SUCCESS,
        fields: [
            { name: 'Comprador', value: userId, inline: true },
            { name: 'Plataforma', value: platformName, inline: true },
            { name: 'Key', value: `\`${maskedKey}\``, inline: true },
            { name: 'Valor', value: `R$ ${price.toFixed(2)}`, inline: true }
        ],
        footer: { text: 'LHUB' },
        timestamp: new Date().toISOString()
    };

    await sendWebhook('', [embed]);
}

export async function notifyPublicStreamingSold(platform: string): Promise<void> {
    const platformName = STREAMING_PLATFORM_NAMES[platform] || platform;

    const embed: DiscordEmbed = {
        title: '📺 STREAMING VENDIDO!',
        description: `\`\`\`diff
+ Acesso entregue com sucesso!
\`\`\``,
        color: COLORS.SUCCESS,
        fields: [
            {
                name: '📦 Produto',
                value: `\`${platformName}\``,
                inline: true
            },
            {
                name: '⚡ Status',
                value: '`✅ Entregue`',
                inline: true
            }
        ],
        thumbnail: {
            url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        footer: {
            text: '🚀 LHUB • Entrega Automática',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        },
        timestamp: new Date().toISOString()
    };

    await sendPublicWebhook('', [embed]);
}
