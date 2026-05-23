import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    findCouponById
} from '@/lib/db';

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return false;
    
    try {
        const payload = await verifyToken(token);
        if (!payload) return false;
        return (payload as any).role === 'ADMIN';
    } catch {
        return false;
    }
}

export async function GET() {
    console.log('[Coupons] Listando cupons');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            console.log('[Coupons] Não autorizado');
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const coupons = getAllCoupons();
        console.log('[Coupons] Total de cupons:', coupons.length);

        return NextResponse.json({
            success: true,
            data: encryptData(coupons)
        });
    } catch (error: any) {
        console.error('[Coupons] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log('[Coupons] Criando cupom');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            console.log('[Coupons] Não autorizado');
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { code, type, value, minPurchase, maxUses, expiresAt, active } = body;

        console.log('[Coupons] Dados recebidos:', { code, type, value, minPurchase, maxUses });

        if (!code || !type || value === undefined) {
            console.log('[Coupons] Campos obrigatórios faltando');
            return NextResponse.json({ 
                success: false, 
                message: 'Código, tipo e valor são obrigatórios' 
            }, { status: 400 });
        }

        if (!['PERCENTAGE', 'FIXED'].includes(type)) {
            return NextResponse.json({ 
                success: false, 
                message: 'Tipo deve ser PERCENTAGE ou FIXED' 
            }, { status: 400 });
        }

        const coupon = createCoupon({
            code: code.toUpperCase(),
            type,
            value: Number(value),
            minPurchase: Number(minPurchase) || 0,
            maxUses: Number(maxUses) || 0,
            expiresAt: expiresAt || undefined,
            active: active !== false
        });

        console.log('[Coupons] Cupom criado:', coupon.id);

        return NextResponse.json({
            success: true,
            data: encryptData(coupon),
            message: 'Cupom criado com sucesso'
        });
    } catch (error: any) {
        console.error('[Coupons] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    console.log('[Coupons] Atualizando cupom');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID do cupom é obrigatório' }, { status: 400 });
        }

        const existingCoupon = findCouponById(id);
        if (!existingCoupon) {
            return NextResponse.json({ success: false, message: 'Cupom não encontrado' }, { status: 404 });
        }

        if (updates.code) {
            updates.code = updates.code.toUpperCase();
        }

        const updatedCoupon = updateCoupon(id, updates);
        console.log('[Coupons] Cupom atualizado:', id);

        return NextResponse.json({
            success: true,
            data: encryptData(updatedCoupon),
            message: 'Cupom atualizado com sucesso'
        });
    } catch (error: any) {
        console.error('[Coupons] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    console.log('[Coupons] Removendo cupom');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID do cupom é obrigatório' }, { status: 400 });
        }

        const deleted = deleteCoupon(id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Cupom não encontrado' }, { status: 404 });
        }

        console.log('[Coupons] Cupom removido:', id);

        return NextResponse.json({
            success: true,
            message: 'Cupom removido com sucesso'
        });
    } catch (error: any) {
        console.error('[Coupons] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
