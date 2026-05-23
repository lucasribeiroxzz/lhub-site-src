import { NextResponse } from 'next/server';
import { getCheatStockByPlan, CHEAT_PLAN_PRICES, CHEAT_PLAN_NAMES } from '@/lib/db';

export async function GET() {
    try {
        const stock = getCheatStockByPlan();
        

        const data: Record<string, { stock: number; price: number }> = {};
        
        Object.keys(stock).forEach(planType => {
            data[planType] = {
                stock: stock[planType],
                price: CHEAT_PLAN_PRICES[planType]
            };
        });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('[Cheat Stock] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro ao buscar estoque' 
        }, { status: 500 });
    }
}
