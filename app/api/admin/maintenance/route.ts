import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';

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
    try {
        const db = getDb();
        const maintenance = db.settings?.maintenance || false;
        const maintenanceMessage = db.settings?.maintenanceMessage || 'Estamos em manutenção. Voltamos em breve!';
        
        return NextResponse.json({
            success: true,
            data: {
                maintenance,
                message: maintenanceMessage
            }
        });
    } catch (error) {
        console.error('[Maintenance] Erro:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { maintenance, message } = body;

        const db = getDb();
        
        if (!db.settings) {
            db.settings = { maintenance: false };
        }
        
        if (typeof maintenance === 'boolean') {
            db.settings.maintenance = maintenance;
        }
        
        if (message) {
            db.settings.maintenanceMessage = message;
        }

        saveDb(db);

        console.log('[Maintenance] Status atualizado:', db.settings.maintenance);

        return NextResponse.json({
            success: true,
            data: {
                maintenance: db.settings.maintenance,
                message: db.settings.maintenanceMessage || 'Estamos em manutenção. Voltamos em breve!'
            }
        });
    } catch (error) {
        console.error('[Maintenance] Erro:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
