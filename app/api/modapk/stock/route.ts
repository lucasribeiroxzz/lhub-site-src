import { NextResponse } from 'next/server';
import { getModApkStockByPlan, MODAPK_PLAN_PRICES } from '@/lib/db';

export async function GET() {
    try {
        const stock = getModApkStockByPlan();
        

        const data: Record<string, { stock: number; price: number }> = {};
        
        Object.keys(stock).forEach(planType => {
            data[planType] = {
                stock: stock[planType],
                price: MODAPK_PLAN_PRICES[planType]
            };
        });

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: any) {
        console.error('[ModApk Stock] Erro:', error);
        return NextResponse.json({
            success: false,
            message: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
