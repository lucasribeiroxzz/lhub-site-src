import { NextResponse } from 'next/server';
import { getStreamingStockByPlatform, STREAMING_PRODUCTS, STREAMING_PRICES } from '@/lib/db';

export async function GET() {
    try {
        const stock = getStreamingStockByPlatform();

        const platforms = Object.entries(STREAMING_PRODUCTS).map(([key, value]) => ({
            id: key,
            name: value.name,
            icon: value.icon,
            price: STREAMING_PRICES[key as keyof typeof STREAMING_PRICES],
            stock: stock[key as keyof typeof stock] || 0
        }));

        return NextResponse.json({
            success: true,
            platforms,
            stock
        });

    } catch (error) {
        console.error('[Streaming Stock] Erro:', error);
        return NextResponse.json({
            success: false,
            message: "Erro ao buscar estoque"
        }, { status: 500 });
    }
}
