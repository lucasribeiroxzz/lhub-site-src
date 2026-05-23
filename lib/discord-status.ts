import fs from 'fs';
import path from 'path';

const STATUS_WEBHOOK_URL = 'https://discord.com/api/webhooks/1473782778771279923/opTp1hd-7rLYRse5TK4bMR4kNr1EBlV2NECtoDCOPV6RfeT5TB_avAcq4l5RVQ6zjsnN';

let statusMessageId: string | null = null;

const serverStartTime = Date.now();

const messageIdPath = path.join(process.cwd(), 'dbs', 'status_message_id.json');

function saveMessageId(id: string): void {
    try {
        fs.writeFileSync(messageIdPath, JSON.stringify({ messageId: id }), 'utf-8');
    } catch (e) {
        console.error('[Status Webhook] Erro ao salvar message ID:', e);
    }
}

function loadMessageId(): string | null {
    try {
        if (fs.existsSync(messageIdPath)) {
            const data = JSON.parse(fs.readFileSync(messageIdPath, 'utf-8'));
            return data.messageId || null;
        }
    } catch (e) {
        console.error('[Status Webhook] Erro ao carregar message ID:', e);
    }
    return null;
}

function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

function getStats(): {
    totalUsers: number;
    totalPassesSent: number;
    totalTokensSent: number;
    totalLikesSent: number;
    totalDeposits: number;
} {
    const dbsDir = path.join(process.cwd(), 'dbs');

    let totalUsers = 0;
    let totalPassesSent = 0;
    let totalTokensSent = 0;
    let totalLikesSent = 0;
    let totalDeposits = 0;

    try {
        const usersData = JSON.parse(fs.readFileSync(path.join(dbsDir, 'users.json'), 'utf-8'));
        const users = Array.isArray(usersData) ? usersData : [];
        totalUsers = users.length;
    } catch { }

    try {
        const txData = JSON.parse(fs.readFileSync(path.join(dbsDir, 'transactions.json'), 'utf-8'));
        const transactions = Array.isArray(txData) ? txData : [];

        for (const tx of transactions) {

            if (tx.type === 'PURCHASE' && tx.status === 'COMPLETED') {
                const desc = (tx.description || tx.productName || '').toLowerCase();
                if (desc.includes('passe') || desc.includes('elite')) {
                    totalPassesSent += (tx.quantity || 1);
                } else if (desc.includes('token') || desc.includes('caixa')) {
                    totalTokensSent += (tx.quantity || 1);
                } else if (desc.includes('like')) {
                    totalLikesSent += (tx.quantity || 1);
                }
            }

            if (tx.type === 'DEPOSIT' && tx.status === 'COMPLETED') {
                totalDeposits++;
            }
        }
    } catch { }

    return {
        totalUsers,
        totalPassesSent,
        totalTokensSent,
        totalLikesSent,
        totalDeposits
    };
}

function progressBar(current: number, max: number, length: number = 10): string {
    const filled = Math.round((current / Math.max(max, 1)) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function buildStatusEmbed() {
    const LOGO_URL = 'https://lhubff.com.br/lhub-logo-new.png';
    const stats = getStats();
    const uptime = Date.now() - serverStartTime;
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const totalProducts = stats.totalPassesSent + stats.totalTokensSent + stats.totalLikesSent;

    return {
        embeds: [{
            title: '📊 LHUB — Status do Servidor',
            description: `\`\`\`ansi\n\u001b[2;32m● ONLINE\u001b[0m — Servidor operando normalmente\n\`\`\``,
            color: 0x9B59B6,
            fields: [
                {
                    name: '👥 Usuários',
                    value: `\`\`\`\nTotal: ${stats.totalUsers}\n\`\`\``,
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: `\`\`\`\n${formatUptime(uptime)}\n\`\`\``,
                    inline: true
                },
                {
                    name: '💰 Depósitos',
                    value: `\`\`\`\nTotal: ${stats.totalDeposits}\n\`\`\``,
                    inline: true
                },
                {
                    name: '📦 Produtos Entregues',
                    value: `\`\`\`\n🎮 Passes:  ${stats.totalPassesSent}\n🎁 Tokens:  ${stats.totalTokensSent}\n❤️ Likes:   ${stats.totalLikesSent}\n━━━━━━━━━━━━━━━━━━\n📊 Total:   ${totalProducts}\n\`\`\``,
                    inline: false
                },
                {
                    name: '🔄 Última Atualização',
                    value: `\`\`\`\n${now}\n\`\`\``,
                    inline: false
                }
            ],
            thumbnail: {
                url: LOGO_URL
            },
            footer: {
                text: '🚀 LHUB • Status em Tempo Real',
                icon_url: LOGO_URL
            },
            timestamp: new Date().toISOString()
        }],
        username: 'LHUB Status',
        avatar_url: LOGO_URL
    };
}

async function sendStatusMessage(): Promise<string | null> {
    try {
        const payload = buildStatusEmbed();

        const response = await fetch(`${STATUS_WEBHOOK_URL}?wait=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[Status Webhook] Mensagem inicial enviada. ID:', data.id);
            return data.id;
        } else {
            console.error('[Status Webhook] Erro ao enviar mensagem:', response.status, await response.text());
        }
    } catch (error) {
        console.error('[Status Webhook] Erro de conexão:', error);
    }
    return null;
}

async function editStatusMessage(messageId: string): Promise<boolean> {
    try {
        const payload = buildStatusEmbed();

        const response = await fetch(`${STATUS_WEBHOOK_URL}/messages/${messageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return true;
        } else if (response.status === 404) {

            console.log('[Status Webhook] Mensagem não encontrada, criando nova...');
            return false;
        } else {
            console.error('[Status Webhook] Erro ao editar:', response.status);
            return true;
        }
    } catch (error) {
        console.error('[Status Webhook] Erro de conexão ao editar:', error);
        return true;
    }
}

async function updateStatusLoop(): Promise<void> {

    statusMessageId = loadMessageId();

    if (statusMessageId) {
        console.log('[Status Webhook] Message ID carregado:', statusMessageId);
        const success = await editStatusMessage(statusMessageId);
        if (!success) {
            statusMessageId = null;
        }
    }

    if (!statusMessageId) {
        statusMessageId = await sendStatusMessage();
        if (statusMessageId) {
            saveMessageId(statusMessageId);
        }
    }

    setInterval(async () => {
        if (statusMessageId) {
            const success = await editStatusMessage(statusMessageId);
            if (!success) {

                statusMessageId = await sendStatusMessage();
                if (statusMessageId) {
                    saveMessageId(statusMessageId);
                }
            }
        } else {

            statusMessageId = await sendStatusMessage();
            if (statusMessageId) {
                saveMessageId(statusMessageId);
            }
        }
    }, 1000);
}

export function startDiscordStatus(): void {
    console.log('[Status Webhook] Iniciando sistema de status...');
    updateStatusLoop().catch(err => {
        console.error('[Status Webhook] Erro no loop:', err);
    });
}
