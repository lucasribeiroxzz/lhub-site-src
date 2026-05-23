import { NextResponse } from 'next/server';
import { encryptData } from '@/lib/crypto';
import { getAllProducts, syncPasseStock } from '@/lib/db';

export async function GET() {
    try {

        syncPasseStock();
        
        const products = getAllProducts();
        

        const typeOrder: Record<string, number> = {
            'PASSE': 1,
            'LIKES': 2,
            'GUEST_ACCOUNT': 3,
            'BYPASS': 4,
            'CHEAT': 5,
            'DIAMONDS': 6,
            'OTHER': 7
        };
        
        const availableProducts = products
            .filter(p => p.available)
            .sort((a, b) => {
                const orderA = typeOrder[a.type] || 99;
                const orderB = typeOrder[b.type] || 99;
                return orderA - orderB;
            });
        
        return NextResponse.json({ 
            success: true,
            data: encryptData(availableProducts) 
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Internal Server Error' 
        }, { status: 500 });
    }
}
