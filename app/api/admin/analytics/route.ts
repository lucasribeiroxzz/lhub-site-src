import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
    getVisitsByState,
    getVisitsByCity,
    getPurchasesByState,
    getPurchasesByCity,
    getAnalyticsSummary,
    getAnalyticsData
} from '@/lib/db';

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    console.log('[Analytics API] Verificando admin_token:', token ? 'Encontrado' : 'Não encontrado');
    
    if (!token) return false;
    
    try {
        const payload = await verifyToken(token);
        if (!payload) return false;
        const isAdmin = (payload as any).role === 'ADMIN';
        console.log('[Analytics API] Payload verificado, isAdmin:', isAdmin);
        return isAdmin;
    } catch (e) {
        console.error('[Analytics API] Erro ao verificar token:', e);
        return false;
    }
}

export async function GET(req: Request) {
    try {
        const isAdmin = await checkAdminAuth();
        
        if (!isAdmin) {
            console.log('[Analytics API] Erro: Não autorizado');
            return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
        }
        
        console.log('[Analytics API] Buscando dados de analytics...');
        

        const rawData = getAnalyticsData();
        console.log(`[Analytics API] Dados brutos - Visitas: ${rawData.visits.length}, Compras: ${rawData.purchases.length}`);
        

        const summary = getAnalyticsSummary();
        console.log('[Analytics API] Summary:', summary);
        
        const visitsByState = getVisitsByState().slice(0, 10);
        const visitsByCity = getVisitsByCity().slice(0, 15);
        const purchasesByState = getPurchasesByState().slice(0, 10);
        const purchasesByCity = getPurchasesByCity().slice(0, 15);
        
        console.log(`[Analytics API] visitsByState: ${visitsByState.length}, visitsByCity: ${visitsByCity.length}`);
        
        return NextResponse.json({
            success: true,
            data: {
                summary,
                visitsByState,
                visitsByCity,
                purchasesByState,
                purchasesByCity,

                debug: {
                    totalVisits: rawData.visits.length,
                    totalPurchases: rawData.purchases.length
                }
            }
        });
        
    } catch (error) {
        console.error('[Analytics] Erro:', error);
        return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
    }
}
