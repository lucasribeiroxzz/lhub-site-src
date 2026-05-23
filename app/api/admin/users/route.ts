import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersAdmin, searchUsers, updateUserBalance, banUser, deleteUser, createNotification } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        let users;
        if (query) {
            users = searchUsers(query);
        } else {
            users = getAllUsersAdmin();
        }

        return NextResponse.json({ 
            success: true, 
            users,
            total: users.length
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { action, userId, amount, type, banned, title, message, notificationType } = body;

        switch (action) {
            case 'updateBalance': {
                if (!userId || amount === undefined || !type) {
                    return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
                }
                const user = updateUserBalance(userId, amount, type);
                if (!user) {
                    return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
                }
                return NextResponse.json({ success: true, user });
            }

            case 'ban': {
                if (!userId || banned === undefined) {
                    return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
                }
                const user = banUser(userId, banned);
                if (!user) {
                    return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
                }
                return NextResponse.json({ success: true, user });
            }

            case 'notify': {
                if (!userId || !title || !message) {
                    return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
                }
                const notification = createNotification({
                    userId,
                    title,
                    message,
                    type: notificationType || 'INFO'
                });
                return NextResponse.json({ success: true, notification });
            }

            case 'notifyAll': {
                if (!title || !message) {
                    return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
                }
                const notification = createNotification({
                    userId: 'all',
                    title,
                    message,
                    type: notificationType || 'INFO'
                });
                return NextResponse.json({ success: true, notification });
            }

            default:
                return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'ID do usuário não fornecido' }, { status: 400 });
        }

        const deleted = deleteUser(userId);
        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Usuário removido' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
