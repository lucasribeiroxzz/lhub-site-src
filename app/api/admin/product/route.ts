import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptData } from '@/lib/crypto';
import { verifyToken } from '@/lib/auth';
import { getAllProducts, upsertProduct } from '@/lib/db';

export async function GET() {
    try {
        const products = getAllProducts();
        return NextResponse.json({ data: encryptData(products) });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || (payload as any).role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        
        const { id, name, description, price, image, stock, available, type } = body;

        const stockValue = typeof stock === 'number' ? stock : parseInt(stock) || 0;

        const savedProduct = upsertProduct({
            id: id || `product_${Date.now()}`,
            name,
            description,
            price: typeof price === 'number' ? price : parseFloat(price) || 0,
            image,
            stock: stockValue,
            available: available ?? true,
            type: type || 'OTHER'
        });

        return NextResponse.json({ success: true, message: 'Product saved', product: savedProduct });
    } catch (error) {
        console.error('[Admin Product POST] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {

    return POST(req);
}
