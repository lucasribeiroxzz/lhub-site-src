import { NextResponse } from 'next/server';
import { 
    getActiveLikesOrders,
    getPendingLikesDeliveries,
    addLikesDelivery,
    getLikesOrderById
} from '@/lib/db';
import { notifyLikesSent, notifyError } from '@/lib/discord';

const LIKES_API_BASE = process.env.LIKES_API_URL || 'https://blnhublikes1.discloud.app';
const LIKES_API_KEY = process.env.LIKES_API_KEY || '';

export async function POST(req: Request) {
    console.log('[Likes] Iniciando processamento de entregas pendentes...');
    
    try {
        const pendingOrders = getPendingLikesDeliveries();
        console.log('[Likes] Pedidos pendentes:', pendingOrders.length);
        
        if (pendingOrders.length === 0) {
            return NextResponse.json({ 
                success: true, 
                message: 'Nenhuma entrega pendente',
                processed: 0 
            });
        }
        
        const results = [];
        
        for (const order of pendingOrders) {
            console.log(`[Likes] Processando pedido ${order.id} - Player: ${order.playerId}`);
            
            try {

                const apiUrl = `${LIKES_API_BASE}/send_likes?id=${order.playerId}&key=${LIKES_API_KEY}`;
                console.log('[Likes] Chamando API:', apiUrl.replace(LIKES_API_KEY, '***'));
                
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                console.log('[Likes] Resposta API:', data);
                
                if (data.status_envio === "SUCESSO") {

                    const likesAddedMatch = data.sent?.match(/(\d+)/);
                    const likesAdded = likesAddedMatch ? parseInt(likesAddedMatch[1]) : 250;

                    const delivery = {
                        date: new Date().toISOString(),
                        likesAdded: likesAdded || 250,
                        success: true
                    };
                    
                    addLikesDelivery(order.id, delivery);
                    

                    const playerName = data.nickname || order.playerName || 'Unknown';
                    await notifyLikesSent(
                        order.userId,
                        order.playerId,
                        playerName,
                        likesAdded,
                        order.likesDelivered + likesAdded,
                        order.totalLikes
                    );
                    
                    results.push({
                        orderId: order.id,
                        success: true,
                        likesAdded: likesAdded
                    });
                } else if (data.res === "LIMIT_EXCEEDED") {

                    const delivery = {
                        date: new Date().toISOString(),
                        likesAdded: 0,
                        success: false,
                        error: 'Limite diário atingido'
                    };
                    
                    addLikesDelivery(order.id, delivery);
                    
                    results.push({
                        orderId: order.id,
                        success: false,
                        error: 'LIMIT_EXCEEDED'
                    });
                } else {

                    const errorMessage = data.error || data.res || 'Erro desconhecido';
                    
                    const delivery = {
                        date: new Date().toISOString(),
                        likesAdded: 0,
                        success: false,
                        error: errorMessage
                    };
                    
                    addLikesDelivery(order.id, delivery);
                    
                    results.push({
                        orderId: order.id,
                        success: false,
                        error: errorMessage
                    });
                }
            } catch (error: any) {
                console.error(`[Likes] Erro ao processar pedido ${order.id}:`, error);
                
                const delivery = {
                    date: new Date().toISOString(),
                    likesAdded: 0,
                    success: false,
                    error: error.message || 'Erro de conexão'
                };
                
                addLikesDelivery(order.id, delivery);
                
                results.push({
                    orderId: order.id,
                    success: false,
                    error: error.message
                });
            }
            

            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        
        console.log(`[Likes] Processamento concluído: ${successCount} sucesso, ${errorCount} erros`);
        
        return NextResponse.json({
            success: true,
            processed: results.length,
            successCount,
            errorCount,
            results
        });
        
    } catch (error: any) {
        console.error('[Likes] Erro geral:', error);
        await notifyError('Likes Send', error.message, error.stack);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');
        
        if (orderId) {
            const order = getLikesOrderById(orderId);
            if (!order) {
                return NextResponse.json({ 
                    success: false, 
                    message: 'Pedido não encontrado' 
                }, { status: 404 });
            }
            return NextResponse.json({ success: true, order });
        }
        

        const activeOrders = getActiveLikesOrders();
        return NextResponse.json({ 
            success: true, 
            orders: activeOrders,
            count: activeOrders.length
        });
        
    } catch (error: any) {
        console.error('[Likes] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}
