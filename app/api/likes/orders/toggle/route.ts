import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { toggleLikesOrderPause, getLikesOrderById } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userSession = cookieStore.get('user_session');
        
        if (!userSession) {
            return NextResponse.json({ 
                success: false, 
                message: 'Não autenticado' 
            }, { status: 401 });
        }
        
        let userId = '';
        try {
            const session = JSON.parse(userSession.value);
            userId = session.email;
        } catch (e) {
            return NextResponse.json({ 
                success: false, 
                message: 'Sessão inválida' 
            }, { status: 401 });
        }
        
        const body = await request.json();
        const { orderId } = body;
        
        if (!orderId) {
            return NextResponse.json({ 
                success: false, 
                message: 'ID do pedido não informado' 
            }, { status: 400 });
        }
        

        const existingOrder = getLikesOrderById(orderId);
        if (!existingOrder) {
            return NextResponse.json({ 
                success: false, 
                message: 'Pedido não encontrado' 
            }, { status: 404 });
        }
        
        if (existingOrder.userId !== userId) {
            return NextResponse.json({ 
                success: false, 
                message: 'Sem permissão para alterar este pedido' 
            }, { status: 403 });
        }
        
        if (existingOrder.status === 'COMPLETED') {
            return NextResponse.json({ 
                success: false, 
                message: 'Pedido já foi concluído' 
            }, { status: 400 });
        }
        
        const updatedOrder = toggleLikesOrderPause(orderId, userId);
        
        if (!updatedOrder) {
            return NextResponse.json({ 
                success: false, 
                message: 'Erro ao atualizar pedido' 
            }, { status: 500 });
        }
        
        const isPaused = updatedOrder.status === 'PAUSED';
        
        return NextResponse.json({
            success: true,
            message: isPaused ? 'Envio de likes pausado' : 'Envio de likes retomado',
            data: {
                orderId: updatedOrder.id,
                status: updatedOrder.status,
                isPaused
            }
        });
        
    } catch (error: any) {
        console.error('[Likes Toggle] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}
