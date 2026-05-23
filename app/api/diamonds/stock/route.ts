import { NextResponse } from 'next/server';
import { DIAMOND_PACKAGES, getDiamondStock, setFullDiamondStock, getDiamondStockLastUpdate } from '@/lib/db';

const DIAMONDS_API_BASE = 'https://freefireshop.com.br';
const BLN_DIAMONDS_KEY = process.env.BLN_DIAMONDS_KEY || '';

export async function GET() {
    try {
        const timestamp = new Date().toISOString();
        

        if (!BLN_DIAMONDS_KEY) {
            console.log(`[${timestamp}] [Diamonds Stock] API Key não configurada, usando estoque local`);
            const localStock = getDiamondStock();
            const lastUpdate = getDiamondStockLastUpdate();
            
            const packagesWithStock = DIAMOND_PACKAGES.map(pkg => ({
                amount: pkg.amount,
                price: pkg.price,
                stock: localStock[pkg.amount.toString()] || 0,
                available: (localStock[pkg.amount.toString()] || 0) > 0
            }));

            return NextResponse.json({
                success: true,
                data: {
                    available: packagesWithStock.some(pkg => pkg.available),
                    lastUpdate: lastUpdate,
                    packages: packagesWithStock,
                    stock: localStock
                }
            });
        }

        try {
            console.log(`[${timestamp}] [Diamonds Stock] Chamando API: ${DIAMONDS_API_BASE}/api/v1/diamonds/stock`);
            
            const response = await fetch(`${DIAMONDS_API_BASE}/api/v1/diamonds/stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '1075559249092034580',
                    key: BLN_DIAMONDS_KEY
                }),
                signal: AbortSignal.timeout(10000)
            });

            const data = await response.json();
            console.log(`[${timestamp}] [Diamonds Stock] Resposta JSON:`, JSON.stringify(data));

            if (data.status === 'OK' && data.data) {
                const stock = data.data.stock || {};
                

                setFullDiamondStock(stock);

                const totalStock = Object.values(stock).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                console.log(`[${timestamp}] [Diamonds Stock] ✓ Estoque: ${Object.entries(stock).map(([k, v]) => `${k}: ${v}`).join(' | ')} | Total: ${totalStock}`);

                const packagesWithStock = DIAMOND_PACKAGES.map(pkg => ({
                    amount: pkg.amount,
                    price: pkg.price,
                    stock: stock[pkg.amount.toString()] || 0,
                    available: (stock[pkg.amount.toString()] || 0) > 0
                }));

                return NextResponse.json({
                    success: true,
                    data: {
                        available: data.data.available !== false && packagesWithStock.some(pkg => pkg.available),
                        lastUpdate: data.data.updatedAt || new Date().toISOString(),
                        packages: packagesWithStock,
                        stock: stock
                    }
                });
            }
        } catch (apiError: any) {
            console.error(`[${timestamp}] [Diamonds Stock] Erro na API externa:`, apiError.message);
        }

        console.log(`[${timestamp}] [Diamonds Stock] Usando estoque local como fallback`);
        const localStock = getDiamondStock();
        const lastUpdate = getDiamondStockLastUpdate();
        
        const packagesWithStock = DIAMOND_PACKAGES.map(pkg => ({
            amount: pkg.amount,
            price: pkg.price,
            stock: localStock[pkg.amount.toString()] || 0,
            available: (localStock[pkg.amount.toString()] || 0) > 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                available: packagesWithStock.some(pkg => pkg.available),
                lastUpdate: lastUpdate,
                packages: packagesWithStock,
                stock: localStock
            }
        });

    } catch (error: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [Diamonds Stock] Erro:`, error.message);
        

        const localStock = getDiamondStock();
        const packagesWithStock = DIAMOND_PACKAGES.map(pkg => ({
            amount: pkg.amount,
            price: pkg.price,
            stock: localStock[pkg.amount.toString()] || 0,
            available: (localStock[pkg.amount.toString()] || 0) > 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                available: packagesWithStock.some(pkg => pkg.available),
                lastUpdate: new Date().toISOString(),
                packages: packagesWithStock,
                stock: localStock
            }
        });
    }
}
