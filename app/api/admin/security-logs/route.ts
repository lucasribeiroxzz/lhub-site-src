import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getSecurityLogs } from '@/lib/security';

export async function GET() {
    try {

        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token');

        if (!token) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        const payload = await verifyToken(token.value);
        if (!payload || (payload as any).role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        const logs = getSecurityLogs(100);

        return NextResponse.json({
            success: true,
            data: {
                logs,
                total: logs.length
            }
        });

    } catch (error: any) {
        console.error('[Security Logs] Erro:', error);
        return NextResponse.json({
            success: false,
            message: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
