import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { validateCoupon } from '@/lib/db';

export async function POST(req: Request) {
    console.log('[Coupon] Validando cupom');
    
    try {

        const cookieStore = await cookies();
        const token = cookieStore.get('user_token')?.value;
        
        if (!token) {
            console.log('[Coupon] Usuário não autenticado');
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const userId = payload.email as string;
        const body = await req.json();
        const { code, amount } = body;

        console.log('[Coupon] Dados:', { code, amount, userId });

        if (!code) {
            return NextResponse.json({ 
                success: false, 
                message: 'Código do cupom é obrigatório' 
            }, { status: 400 });
        }

        const result = validateCoupon(code, userId, Number(amount) || 0);
        console.log('[Coupon] Resultado:', result);

        return NextResponse.json({
            success: result.valid,
            discount: result.discount,
            message: result.message
        });
    } catch (error: any) {
        console.error('[Coupon] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
