import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLikesOrdersByUser } from '@/lib/db';
import { encryptData } from '@/lib/crypto';

export async function GET() {
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
        
        const orders = getLikesOrdersByUser(userId);
        

        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return NextResponse.json({
            success: true,
            data: encryptData(orders)
        });
        
    } catch (error: any) {
        console.error('[Likes Orders] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}
