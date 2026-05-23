import { NextResponse } from 'next/server';
import { 
    getPendingLikesDeliveries,
    addLikesDelivery,
    updateLikesOrder
} from '@/lib/db';
import { notifyLikesSent, notifyError } from '@/lib/discord';

const LIKES_API_BASE = process.env.LIKES_API_URL || 'https://blnhublikes1.discloud.app';
const LIKES_API_KEY = process.env.LIKES_API_KEY || '';

export async function POST(req: Request) {
    console.log('[Cron Likes] Iniciando processamento de entregas...');
    console.log('[Cron Likes] Timestamp:', new Date().toISOString());
    

    if (!LIKES_API_KEY || LIKES_API_KEY === 'SUA_CHAVE_AQUI') {
        console.error('[Cron Likes] API Key não configurada!');
        return NextResponse.json({ 
            success: false, 
            message: 'API Key de likes não configurada' 
        }, { status: 500 });
    }
    
    try {
        const pendingOrders = getPendingLikesDeliveries();
        console.log('[Cron Likes] Pedidos pendentes encontrados:', pendingOrders.length);
        
        if (pendingOrders.length === 0) {
            return NextResponse.json({ 
                success: true, 
                message: 'Nenhuma entrega pendente',
                processed: 0 
            });
        }
        
        const results = [];
        
        for (const order of pendingOrders) {
            console.log(`[Cron Likes] Processando: ${order.id}`);
            console.log(`[Cron Likes] Player: ${order.playerId} | Region: ${order.region}`);
            console.log(`[Cron Likes] Progresso: ${order.likesDelivered}/${order.totalLikes}`);
            
            try {

                const apiUrl = `${LIKES_API_BASE}/send_likes?id=${order.playerId}&key=${LIKES_API_KEY}`;
                console.log('[Cron Likes] Chamando API...');
                
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
                    console.error('[Cron Likes] Resposta não é JSON:', text);
                    throw new Error(`Resposta inválida da API: ${text.substring(0, 100)}`);
                }
                
                console.log('[Cron Likes] Resposta:', JSON.stringify(data));
                
                if (data.status_envio === "SUCESSO") {

                    const likesAddedMatch = data.sent?.match(/(\d+)/);
                    const likesAdded = likesAddedMatch ? parseInt(likesAddedMatch[1]) : 250;
                    
                    const delivery = {
                        date: new Date().toISOString(),
                        likesAdded: likesAdded,
                        success: true
                    };
                    
                    const updatedOrder = addLikesDelivery(order.id, delivery);
                    
                    console.log(`[Cron Likes] Sucesso! +${likesAdded} likes para ${order.playerId}`);
                    

                    await notifyLikesSent(
                        order.userId,
                        order.playerId,
                        data.nickname || order.playerName || 'Unknown',
                        likesAdded,
                        (order.likesDelivered || 0) + likesAdded,
                        order.totalLikes
                    );
                    
                    results.push({
                        orderId: order.id,
                        playerId: order.playerId,
                        success: true,
                        likesAdded: likesAdded,
                        newTotal: (order.likesDelivered || 0) + likesAdded
                    });
                    
                } else {

                    const errorMessage = data.error || data.res || 'Erro desconhecido';
                    console.error(`[Cron Likes] Erro: ${errorMessage}`);
                    
                    const delivery = {
                        date: new Date().toISOString(),
                        likesAdded: 0,
                        success: false,
                        error: errorMessage
                    };
                    
                    addLikesDelivery(order.id, delivery);
                    
                    results.push({
                        orderId: order.id,
                        playerId: order.playerId,
                        success: false,
                        error: errorMessage
                    });
                }
                
            } catch (error: any) {
                console.error(`[Cron Likes] Exceção ao processar ${order.id}:`, error.message);
                
                const delivery = {
                    date: new Date().toISOString(),
                    likesAdded: 0,
                    success: false,
                    error: error.message || 'Erro de conexão'
                };
                
                addLikesDelivery(order.id, delivery);
                
                results.push({
                    orderId: order.id,
                    playerId: order.playerId,
                    success: false,
                    error: error.message
                });
            }
            

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        
        console.log(`[Cron Likes] Concluído: ${successCount} sucesso, ${errorCount} erros`);
        
        return NextResponse.json({
            success: true,
            message: `Processado ${results.length} pedidos`,
            processed: results.length,
            successCount,
            errorCount,
            results
        });
        
    } catch (error: any) {
        console.error('[Cron Likes] Erro geral:', error);
        await notifyError('Cron Likes', error.message, error.stack);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}

export async function GET() {
    const pendingOrders = getPendingLikesDeliveries();
    const apiKeyConfigured = LIKES_API_KEY && LIKES_API_KEY !== 'SUA_CHAVE_AQUI';
    
    return NextResponse.json({
        success: true,
        status: 'Cron de likes ativo',
        apiKeyConfigured,
        pendingDeliveries: pendingOrders.length,
        timestamp: new Date().toISOString()
    });
}
