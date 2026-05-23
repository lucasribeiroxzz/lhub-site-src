import { NextResponse } from 'next/server';
import { getProducts, getProductPrice } from '@/lib/db';

export async function GET() {
    try {
        const products = getProducts();
        

        const prices = {
            passe: getProductPrice('PASSE') || parseFloat(process.env.PASSE_PRICE || '3.50'),
            likes: getProductPrice('LIKES') || parseFloat(process.env.LIKES_PRICE || '0.90'),
            guest: getProductPrice('GUEST_ACCOUNT') || parseFloat(process.env.GUEST_PRICE || '0.70'),
            bypass: parseFloat(process.env.BYPASS_PRICE || '20.00'),
            cheat_daily: parseFloat(process.env.CHEAT_PRICE_DAILY || '8.00'),
            cheat_weekly: parseFloat(process.env.CHEAT_PRICE_WEEKLY || '12.00'),
            cheat_biweekly: parseFloat(process.env.CHEAT_PRICE_BIWEEKLY || '28.00'),
            cheat_monthly: parseFloat(process.env.CHEAT_PRICE_MONTHLY || '40.00'),
            modapk_daily: parseFloat(process.env.MODAPK_PRICE_DAILY || '12.00'),
            modapk_weekly: parseFloat(process.env.MODAPK_PRICE_WEEKLY || '999.00'),
            modapk_biweekly: parseFloat(process.env.MODAPK_PRICE_BIWEEKLY || '999.00'),
            modapk_monthly: parseFloat(process.env.MODAPK_PRICE_MONTHLY || '999.00')
        };

        const passeProduct = products.find(p => p.type === 'PASSE');
        const likesProduct = products.find(p => p.type === 'LIKES');
        const guestProduct = products.find(p => p.type === 'GUEST_ACCOUNT');

        return NextResponse.json({
            success: true,
            data: {
                prices,
                stock: {
                    passe: passeProduct?.stock || 0,
                    likes: -1,
                    guest: guestProduct?.stock || 0,
                    bypass: -1,
                    cheat: -1,
                    modapk: -1
                }
            }
        });
    } catch (error) {
        console.error('[API internal/prices] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao buscar preços'
        }, { status: 500 });
    }
}
