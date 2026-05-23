import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
        return NextResponse.json({ 
            success: true, 
            data: { maintenance: false, message: '' } 
        });
    }
}
