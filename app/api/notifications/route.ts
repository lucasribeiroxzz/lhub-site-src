import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, findUserByEmail } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('user_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
        }

        const email = decoded.email as string;
        const user = findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
        }
        const userId = user.id;
        const notifications = getUserNotifications(userId);
        const unreadCount = getUnreadNotificationCount(userId);

        return NextResponse.json({ 
            success: true, 
            notifications,
            unreadCount
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('user_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
        }

        const email = decoded.email as string;
        const user = findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
        }
        const userId = user.id;
        const body = await request.json();
        const { action, notificationId } = body;

        if (action === 'markAllRead') {
            markAllNotificationsAsRead(userId);
            return NextResponse.json({ success: true, message: 'Todas notificações marcadas como lidas' });
        }

        if (action === 'markRead' && notificationId) {
            const success = markNotificationAsRead(notificationId, userId);
            if (!success) {
                return NextResponse.json({ success: false, error: 'Notificação não encontrada' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Notificação marcada como lida' });
        }

        return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
