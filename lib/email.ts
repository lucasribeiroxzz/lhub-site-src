const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@lhub.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'LHUB';
const DISCORD_INVITE = 'https://discord.gg/c85562Rh';

interface EmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.log('[Email] Brevo API key not configured. Email not sent.');
        console.log('[Email] Would send to:', options.to);
        console.log('[Email] Subject:', options.subject);
        return false;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_SENDER_NAME,
                    email: BREVO_SENDER_EMAIL,
                },
                to: [{ email: options.to }],
                subject: options.subject,
                htmlContent: options.htmlContent,
            }),
        });

        if (response.ok) {
            console.log('[Email] Email sent successfully to:', options.to);
            return true;
        } else {
            const error = await response.json();
            console.error('[Email] Failed to send email:', error);
            return false;
        }
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        return false;
    }
}

function getEmailTemplate(content: string): string {
    const LOGO_URL = 'https://lhubff.com.br/lhub-logo-new.png';
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LHUB</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050507; padding: 30px 15px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                        <!-- Border Glow -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed); border-radius: 20px; padding: 1.5px;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c0c10; border-radius: 19px; overflow: hidden;">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1a0533 0%, #0c0c10 50%, #150a25 100%); padding: 40px 30px 30px 30px; text-align: center; border-bottom: 1px solid rgba(124, 58, 237, 0.2);">
                                            <img src="${LOGO_URL}" alt="LHUB" width="70" height="70" style="display: block; margin: 0 auto 16px auto; border-radius: 16px;" />
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">LHUB</h1>
                                            <p style="margin: 6px 0 0 0; color: #a78bfa; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Premium Gaming</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 35px 30px;">
                                            ${content}
                                        </td>
                                    </tr>
                                    
                                    <!-- Divider -->
                                    <tr>
                                        <td style="padding: 0 30px;">
                                            <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(124, 58, 237, 0.4) 50%, transparent 100%);"></div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 28px 30px; text-align: center;">
                                            <p style="margin: 0 0 18px 0; color: #71717a; font-size: 13px;">
                                                Precisa de ajuda? Estamos no Discord!
                                            </p>
                                            <a href="${DISCORD_INVITE}" style="display: inline-block; background: linear-gradient(135deg, #5865F2, #4752c4); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px;">
                                                Entrar no Discord
                                            </a>
                                            <p style="margin: 24px 0 0 0; color: #3f3f46; font-size: 11px;">
                                                © 2026 LHUB • Este é um email automático
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Bem-vindo(a), ${name}!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Sua conta foi criada com sucesso na <strong style="color: #a855f7;">LHUB</strong>!
        </p>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Agora você pode aproveitar os melhores preços em:
        </p>
        <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #d4d4d4; font-size: 15px; line-height: 1.8;">
            <li><strong>Passe Booyah</strong> - O mais barato do Brasil</li>
            <li><strong>Likes</strong> - Aumente seus likes no Free Fire</li>
        </ul>
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #a855f7;">
            <p style="margin: 0; color: #a3a3a3; font-size: 14px;">
                <strong style="color: white;">Dica:</strong> Faça sua primeira recarga e comece a comprar!
            </p>
        </div>
        <a href="https://passesff.squareweb.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Acessar Dashboard
        </a>
    `;

    return sendEmail({
        to: email,
        subject: 'Bem-vindo(a) à LHUB!',
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendRechargeEmail(email: string, name: string, amount: number, newBalance: number): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Recarga Aprovada!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, sua recarga foi processada com sucesso!
        </p>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Creditado</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 20px; font-weight: bold;">R$ ${amount.toFixed(2)}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Novo Saldo</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right;">
                        <span style="color: white; font-size: 20px; font-weight: bold;">R$ ${newBalance.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <p style="margin: 0 0 25px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Seu saldo já está disponível para uso. Aproveite!
        </p>
        
        <a href="https://passesff.squareweb.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir às Compras
        </a>
    `;

    return sendEmail({
        to: email,
        subject: 'Recarga Aprovada - R$ ' + amount.toFixed(2),
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendPurchaseEmail(
    email: string,
    name: string,
    productName: string,
    playerNick: string,
    gameUid: string,
    amount: number,
    likesAdded?: number
): Promise<boolean> {
    const isLikes = likesAdded !== undefined && likesAdded > 0;

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Compra Realizada!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, sua compra foi processada com sucesso!
        </p>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes do Pedido
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">${productName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Jogador</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${playerNick}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">UID</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-family: monospace;">${gameUid}</span>
                    </td>
                </tr>
                ${isLikes ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Likes Enviados</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #ec4899; font-size: 15px; font-weight: bold;">+${likesAdded}</span>
                    </td>
                </tr>
                ` : ''}
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${amount.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #166534;">
            <p style="margin: 0; color: #4ade80; font-size: 15px; text-align: center;">
                ${isLikes ? 'Likes enviados com sucesso!' : 'Passe enviado com sucesso para o jogador!'}
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `Compra Realizada - ${productName}`,
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Verificação de Conta</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Use o código abaixo para verificar sua conta:
        </p>
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
            <span style="color: #a855f7; font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</span>
        </div>
        <p style="margin: 0; color: #737373; font-size: 14px;">
            Se você não solicitou este código, ignore este email.
        </p>
    `;

    return sendEmail({
        to: email,
        subject: '🔐 Código de Verificação - LHUB',
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendGuestAccountEmail(
    email: string,
    name: string,
    uid: string,
    password: string,
    amount: number
): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Conta Adquirida!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, sua conta Guest foi adquirida com sucesso!
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534;">
            <h3 style="margin: 0 0 20px 0; color: #4ade80; font-size: 18px; text-align: center;">
                🔐 Suas Credenciais
            </h3>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Conta (UID:PASSWORD)</span>
                <span style="color: white; font-size: 18px; font-weight: bold; font-family: monospace;">${uid}:${password}</span>
            </div>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>Importante:</strong> Guarde essas credenciais em um local seguro! 
                Não compartilhe com ninguém.
            </p>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">Nível 15 + Troca Nick</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 8px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${amount.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: 'Conta Adquirida - Nível 15 + Troca Nick',
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendLikesSubscriptionEmail(
    email: string,
    name: string,
    totalLikes: number,
    price: number,
    playerName: string,
    gameUid: string,
    estimatedDays: number
): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Plano de Likes Ativado!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, seu plano de likes foi ativado com sucesso!
        </p>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #ec4899; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes do Plano
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Total de Likes</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #ec4899; font-size: 18px; font-weight: bold;">${totalLikes.toLocaleString()}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Jogador</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${playerName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">UID</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-family: monospace;">${gameUid}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Entrega Diária</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px;">100-250 likes/dia</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Duração Estimada</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px;">~${estimatedDays} dias</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${price.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #172554; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #1e40af;">
            <p style="margin: 0; color: #60a5fa; font-size: 14px;">
                📅 <strong>Como funciona:</strong> Você receberá entre 100 e 250 likes automaticamente todos os dias até completar o total do seu plano. Acompanhe o progresso em "Histórico → Meus Likes".
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Acompanhar Entregas
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `Plano de ${totalLikes.toLocaleString()} Likes Ativado!`,
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendLikesDeliveryEmail(
    email: string,
    name: string,
    likesDelivered: number,
    totalDelivered: number,
    totalLikes: number,
    playerName: string,
    gameUid: string
): Promise<boolean> {
    const progress = Math.round((totalDelivered / totalLikes) * 100);
    const remaining = totalLikes - totalDelivered;
    const isComplete = totalDelivered >= totalLikes;

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">
            ${isComplete ? 'Plano Concluido!' : 'Likes Enviados Hoje!'}
        </h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, ${isComplete ? 'seu plano de likes foi concluído!' : 'sua entrega diária foi realizada!'}
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #4ade80; font-size: 14px;">Likes enviados hoje</p>
            <p style="margin: 0; color: #4ade80; font-size: 36px; font-weight: bold;">+${likesDelivered}</p>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #ec4899; font-size: 16px;">📊 Progresso do Plano</h3>
            
            <!-- Barra de progresso -->
            <div style="background-color: #333; border-radius: 10px; height: 20px; margin-bottom: 15px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #ec4899 0%, #db2777 100%); height: 100%; width: ${progress}%; border-radius: 10px;"></div>
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Jogador</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${playerName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">UID</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-family: monospace;">${gameUid}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Progresso</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #ec4899; font-size: 15px; font-weight: bold;">${totalDelivered.toLocaleString()} / ${totalLikes.toLocaleString()} (${progress}%)</span>
                    </td>
                </tr>
                ${!isComplete ? `
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Restantes</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #fbbf24; font-size: 15px; font-weight: bold;">${remaining.toLocaleString()} likes</span>
                    </td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        ${isComplete ? `
        <div style="background-color: #052e16; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #166534;">
            <p style="margin: 0; color: #4ade80; font-size: 15px; text-align: center;">
                Parabens! Todos os ${totalLikes.toLocaleString()} likes foram entregues com sucesso!
            </p>
        </div>
        ` : `
        <div style="background-color: #172554; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #1e40af;">
            <p style="margin: 0; color: #60a5fa; font-size: 14px;">
                ⏰ <strong>Próxima entrega:</strong> Amanhã você receberá mais 100-250 likes automaticamente!
            </p>
        </div>
        `}
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico Completo
        </a>
    `;

    return sendEmail({
        to: email,
        subject: isComplete
            ? `Plano de Likes Concluido! ${totalLikes.toLocaleString()} likes entregues`
            : `+${likesDelivered} Likes Enviados Hoje! (${progress}% completo)`,
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendBypassPurchaseEmail(
    email: string,
    name: string,
    uid: string,
    days: number,
    expiration: string,
    price: number,
    downloadUrl: string,
    tutorialUrl: string
): Promise<boolean> {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Bypass Ativado! 🚀</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, seu bypass foi ativado com sucesso!
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534;">
            <h3 style="margin: 0 0 20px 0; color: #4ade80; font-size: 18px; text-align: center;">
                Bypass Ativado
            </h3>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Seu UID</span>
                <span style="color: white; font-size: 20px; font-weight: bold; font-family: monospace;">${uid}</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; background-color: #0f0f0f; border-radius: 8px; padding: 15px; text-align: center;">
                    <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Duração</span>
                    <span style="color: #4ade80; font-size: 18px; font-weight: bold;">${days} dias</span>
                </div>
            </div>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes da Compra
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">Bypass UID</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">UID</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-family: monospace;">${uid}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Duração</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${days} dias</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Expira em</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #fbbf24; font-size: 15px; font-weight: bold;">${expiration}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${price.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #172554; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #1e40af;">
            <p style="margin: 0 0 15px 0; color: #60a5fa; font-size: 14px;">
                📥 <strong>Download:</strong> Clique no botão abaixo para baixar o bypass
            </p>
            <a href="${downloadUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 10px;">
                Baixar Bypass
            </a>
            <a href="${tutorialUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Ver Tutorial
            </a>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>Importante:</strong> O bypass é válido apenas para o UID informado. 
                Não compartilhe suas credenciais com terceiros.
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `🚀 Bypass Ativado - UID ${uid} (${days} dias)`,
        htmlContent: getEmailTemplate(content),
    });
}

const CHEAT_PLAN_NAMES_EMAIL: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export async function sendCheatPurchaseEmail(
    email: string,
    name: string,
    key: string,
    planType: string,
    price: number,
    downloadUrl: string,
    tutorialUrl: string
): Promise<boolean> {
    const planName = CHEAT_PLAN_NAMES_EMAIL[planType] || planType;

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">Cheat External Adquirido! 🎯</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, seu cheat foi entregue com sucesso!
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534;">
            <h3 style="margin: 0 0 20px 0; color: #4ade80; font-size: 18px; text-align: center;">
                Cheat Entregue
            </h3>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Sua Key</span>
                <span style="color: white; font-size: 16px; font-weight: bold; font-family: monospace; word-break: break-all;">${key}</span>
            </div>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; text-align: center;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Plano</span>
                <span style="color: #4ade80; font-size: 18px; font-weight: bold;">${planName}</span>
            </div>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes da Compra
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">Cheat External</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Plano</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${planName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${price.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #172554; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #1e40af;">
            <p style="margin: 0 0 15px 0; color: #60a5fa; font-size: 14px;">
                📥 <strong>Download e Tutorial:</strong> Clique nos botões abaixo
            </p>
            <a href="${downloadUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 10px;">
                Baixar Cheat
            </a>
            <a href="${tutorialUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Ver Tutorial
            </a>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h4 style="margin: 0 0 15px 0; color: #a855f7; font-size: 16px;">Funcoes Incluidas:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="background-color: #0f0f0f; border-radius: 8px; padding: 10px;">
                    <span style="color: #fbbf24; font-size: 12px;">AIMBOT</span>
                    <ul style="margin: 5px 0 0 0; padding-left: 15px; color: #d4d4d4; font-size: 12px;">
                        <li>AimTrick Ombro</li>
                        <li>Aimbot Collider Lite</li>
                        <li>Aimbot Collider Rage</li>
                        <li>Sniper Scope</li>
                    </ul>
                </div>
                <div style="background-color: #0f0f0f; border-radius: 8px; padding: 10px;">
                    <span style="color: #f87171; font-size: 12px;">EXPLOITS</span>
                    <ul style="margin: 5px 0 0 0; padding-left: 15px; color: #d4d4d4; font-size: 12px;">
                        <li>Magnétic Peito/Head</li>
                        <li>Teleport Map/Enemy</li>
                        <li>Ghost Hack</li>
                        <li>Long Parachute</li>
                    </ul>
                </div>
            </div>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 10px; margin-top: 10px;">
                <span style="color: #4ade80; font-size: 12px;">VISUALS</span>
                <p style="margin: 5px 0 0 0; color: #d4d4d4; font-size: 12px;">
                    Draw Lines, Box, Health, Skeleton, Name, Distance
                </p>
            </div>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>Importante:</strong> Não compartilhe sua key com terceiros. 
                Use com responsabilidade.
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `🎯 Cheat External Entregue - ${planName}`,
        htmlContent: getEmailTemplate(content),
    });
}

const MODAPK_PLAN_NAMES_EMAIL: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export async function sendModApkPurchaseEmail(
    email: string,
    name: string,
    key: string,
    planType: string,
    price: number,
    downloadUrl: string,
    tutorialUrl: string
): Promise<boolean> {
    const planName = MODAPK_PLAN_NAMES_EMAIL[planType] || planType;

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">ModApk Android Adquirido!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, seu ModApk foi entregue com sucesso!
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534;">
            <h3 style="margin: 0 0 20px 0; color: #4ade80; font-size: 18px; text-align: center;">
                ModApk Entregue
            </h3>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Sua Key</span>
                <span style="color: white; font-size: 16px; font-weight: bold; font-family: monospace; word-break: break-all;">${key}</span>
            </div>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; text-align: center;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Plano</span>
                <span style="color: #4ade80; font-size: 18px; font-weight: bold;">${planName}</span>
            </div>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes da Compra
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">ModApk - Android</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Plano</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${planName}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${price.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #172554; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #1e40af;">
            <p style="margin: 0 0 15px 0; color: #60a5fa; font-size: 14px;">
                📥 <strong>Download e Tutorial:</strong> Clique nos botões abaixo
            </p>
            <a href="${downloadUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 10px;">
                Baixar ModApk
            </a>
            <a href="${tutorialUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Ver Tutorial
            </a>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h4 style="margin: 0 0 15px 0; color: #a855f7; font-size: 16px;">Informacoes:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #d4d4d4; font-size: 14px; line-height: 1.8;">
                <li>Compatível apenas com dispositivos Android</li>
                <li>Siga o tutorial para instalação correta</li>
                <li>Não funciona em emuladores</li>
            </ul>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>Importante:</strong> Não compartilhe sua key com terceiros. 
                Use com responsabilidade.
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `ModApk Android Entregue - ${planName}`,
        htmlContent: getEmailTemplate(content),
    });
}

const STREAMING_PLATFORM_NAMES_EMAIL: Record<string, { name: string; icon: string }> = {
    'hbomax': { name: 'HBO Max', icon: '🎬' },
    'primevideo': { name: 'Prime Video', icon: '📺' },
    'crunchyroll': { name: 'Crunchyroll', icon: '🍥' },
    'paramount': { name: 'Paramount+', icon: '⛰️' },
    'canvapro': { name: 'Canva Pro', icon: '🎨' },
    'disney': { name: 'Disney+', icon: '🏰' }
};

export async function sendStreamingPurchaseEmail(
    email: string,
    name: string,
    key: string,
    platform: string,
    price: number
): Promise<boolean> {
    const platformInfo = STREAMING_PLATFORM_NAMES_EMAIL[platform] || { name: platform, icon: '📺' };

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">${platformInfo.icon} Streaming Adquirido!</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, sua conta de streaming foi entregue com sucesso!
        </p>
        
        <div style="background-color: #052e16; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #166534;">
            <h3 style="margin: 0 0 20px 0; color: #4ade80; font-size: 18px; text-align: center;">
                ${platformInfo.icon} Conta Entregue
            </h3>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Dados de Acesso</span>
                <span style="color: white; font-size: 16px; font-weight: bold; font-family: monospace; word-break: break-all;">${key}</span>
            </div>
            <div style="background-color: #0f0f0f; border-radius: 8px; padding: 15px; text-align: center;">
                <span style="color: #a3a3a3; font-size: 12px; display: block; margin-bottom: 5px;">Plataforma</span>
                <span style="color: #4ade80; font-size: 18px; font-weight: bold;">${platformInfo.name}</span>
            </div>
        </div>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes da Compra
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Produto</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">${platformInfo.name}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">Categoria</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #a855f7; font-size: 15px; font-weight: bold;">Streamings</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #333;">
                        <span style="color: #a3a3a3; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td style="padding: 12px 0; border-top: 1px solid #333; text-align: right;">
                        <span style="color: #22c55e; font-size: 18px; font-weight: bold;">R$ ${price.toFixed(2)}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>Importante:</strong> Guarde os dados de acesso em um local seguro! 
                Não compartilhe com terceiros.
            </p>
        </div>
        
        <a href="https://passesff.squareweb.app/dashboard/historico" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver Histórico
        </a>
    `;

    return sendEmail({
        to: email,
        subject: `${platformInfo.icon} ${platformInfo.name} Entregue!`,
        htmlContent: getEmailTemplate(content),
    });
}

export async function sendLoginAlertEmail(
    email: string,
    name: string,
    ip: string,
    location: string,
    userAgent: string,
    date: string
): Promise<boolean> {

    let browser = 'Navegador desconhecido';
    let device = 'Dispositivo desconhecido';

    if (userAgent) {
        if (userAgent.includes('Chrome')) browser = 'Google Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Microsoft Edge';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

        if (userAgent.includes('Windows')) device = 'Windows';
        else if (userAgent.includes('Mac')) device = 'macOS';
        else if (userAgent.includes('Linux')) device = 'Linux';
        else if (userAgent.includes('Android')) device = 'Android';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) device = 'iOS';
    }

    const content = `
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">🔔 Alerta de Login</h2>
        <p style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6;">
            Olá <strong style="color: white;">${name}</strong>, detectamos um novo login na sua conta.
        </p>
        
        <div style="background-color: #1f1f1f; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 20px 0; color: #a855f7; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                Detalhes do Login
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">📅 Data/Hora</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-weight: bold;">${date}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">🌐 Endereço IP</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px; font-family: monospace;">${ip}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">📍 Localização</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #22c55e; font-size: 15px; font-weight: bold;">${location}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">💻 Navegador</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px;">${browser}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #a3a3a3; font-size: 14px;">📱 Dispositivo</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                        <span style="color: white; font-size: 15px;">${device}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #422006; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #92400e;">
            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                <strong>⚠️ Não foi você?</strong> Se você não reconhece este login, altere sua senha imediatamente e entre em contato pelo nosso Discord.
            </p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject: '🔔 Novo Login Detectado - LHUB',
        htmlContent: getEmailTemplate(content),
    });
}
