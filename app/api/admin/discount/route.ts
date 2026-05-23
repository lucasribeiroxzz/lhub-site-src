import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { 
    findUserByEmail, 
    searchUsers, 
    setUserCustomDiscount, 
    removeUserCustomDiscount,
    getUsersWithCustomDiscount,
    findUserById
} from '@/lib/db';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const listDiscounts = searchParams.get('listDiscounts');

        if (listDiscounts === 'true') {
            const usersWithDiscount = getUsersWithCustomDiscount();
            return NextResponse.json({ 
                success: true, 
                data: usersWithDiscount 
            });
        }

        if (query && query.length >= 2) {
            const users = searchUsers(query);
            return NextResponse.json({ 
                success: true, 
                data: users.slice(0, 20)
            });
        }

        return NextResponse.json({ 
            success: false, 
            message: "Parâmetro 'query' ou 'listDiscounts' necessário" 
        }, { status: 400 });

    } catch (error: any) {
        console.error('[Admin Discount GET] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Erro interno" 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const adminEmail = sessionPayload.email as string;
        const admin = findUserByEmail(adminEmail);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, type, value, expiresAt, appliesTo } = body;

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "ID do usuário é obrigatório" 
            }, { status: 400 });
        }

        if (!type || !['PERCENT', 'FIXED'].includes(type)) {
            return NextResponse.json({ 
                success: false, 
                message: "Tipo deve ser 'PERCENT' ou 'FIXED'" 
            }, { status: 400 });
        }

        if (typeof value !== 'number' || value <= 0) {
            return NextResponse.json({ 
                success: false, 
                message: "Valor deve ser um número positivo" 
            }, { status: 400 });
        }

        if (type === 'PERCENT' && value > 100) {
            return NextResponse.json({ 
                success: false, 
                message: "Porcentagem não pode ser maior que 100%" 
            }, { status: 400 });
        }

        const targetUser = findUserById(userId);
        if (!targetUser) {
            return NextResponse.json({ 
                success: false, 
                message: "Usuário não encontrado" 
            }, { status: 404 });
        }

        const updatedUser = setUserCustomDiscount(
            userId,
            {
                type,
                value,
                expiresAt: expiresAt || undefined,
                appliesTo: appliesTo && appliesTo.length > 0 ? appliesTo : undefined
            },
            adminEmail
        );

        if (!updatedUser) {
            return NextResponse.json({ 
                success: false, 
                message: "Erro ao definir desconto" 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Desconto definido com sucesso!",
            data: updatedUser
        });

    } catch (error: any) {
        console.error('[Admin Discount POST] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Erro interno" 
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("user_token");

        if (!token) {
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }

        const sessionPayload = await verifyToken(token.value);
        if (!sessionPayload || !sessionPayload.email) {
            return NextResponse.json({ success: false, message: "Sessão inválida" }, { status: 401 });
        }

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                message: "ID do usuário é obrigatório" 
            }, { status: 400 });
        }

        const updatedUser = removeUserCustomDiscount(userId);

        if (!updatedUser) {
            return NextResponse.json({ 
                success: false, 
                message: "Usuário não encontrado" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Desconto removido com sucesso!",
            data: updatedUser
        });

    } catch (error: any) {
        console.error('[Admin Discount DELETE] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Erro interno" 
        }, { status: 500 });
    }
}
