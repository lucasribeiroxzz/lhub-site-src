import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { 
    findUserByEmail,
    addGuestAccounts,
    getAvailableGuestAccounts,
    getAllGuestAccounts,
    deleteGuestAccount
} from '@/lib/db';

export async function GET() {
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

        const allAccounts = getAllGuestAccounts();
        const availableAccounts = getAvailableGuestAccounts();

        return NextResponse.json({
            success: true,
            data: {
                total: allAccounts.length,
                available: availableAccounts.length,
                sold: allAccounts.length - availableAccounts.length,
                accounts: allAccounts.map(a => ({
                    ...a,

                    password: a.sold ? '******' : a.password
                }))
            }
        });

    } catch (error: any) {
        console.error('[Guest Accounts GET] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
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

        const admin = findUserByEmail(sessionPayload.email as string);
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
        }

        const body = await req.json();
        const { accounts } = body;

        if (!accounts || typeof accounts !== 'string') {
            return NextResponse.json({ 
                success: false, 
                message: "Envie as contas no formato UID:PASSWORD (uma por linha)" 
            }, { status: 400 });
        }

        const result = addGuestAccounts(accounts, sessionPayload.email as string);

        return NextResponse.json({
            success: true,
            message: `${result.added} conta(s) adicionada(s) com sucesso!`,
            data: {
                added: result.added,
                errors: result.errors
            }
        });

    } catch (error: any) {
        console.error('[Guest Accounts POST] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
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

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('id');

        if (!accountId) {
            return NextResponse.json({ success: false, message: "ID da conta não informado" }, { status: 400 });
        }

        const deleted = deleteGuestAccount(accountId);

        if (!deleted) {
            return NextResponse.json({ success: false, message: "Conta não encontrada" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Conta removida com sucesso!"
        });

    } catch (error: any) {
        console.error('[Guest Accounts DELETE] Erro:', error);
        return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
    }
}
