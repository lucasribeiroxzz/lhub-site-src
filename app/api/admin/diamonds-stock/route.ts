import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { findUserByEmail, setFullDiamondStock, getDiamondStock, getDiamondStockLastUpdate, DIAMOND_PACKAGES } from '@/lib/db';

const BLN_API_BASE = process.env.BLN_API_BASE || 'https://blnhubpasses-freefire.squareweb.app';
const RESELLER_KEY = process.env.RESELLER_KEY || '';

export async function GET() {
    try {
        const stock = getDiamondStock();
        const lastUpdate = getDiamondStockLastUpdate();

        const packagesWithStock = DIAMOND_PACKAGES.map(pkg => ({
            amount: pkg.amount,
            price: pkg.price,
            stock: stock[pkg.amount.toString()] || 0,
            available: (stock[pkg.amount.toString()] || 0) > 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                lastUpdate,
                packages: packagesWithStock,
                stock
            }
        });
    } catch (error: any) {
        console.error('[Admin diamonds-stock GET] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao obter estoque'
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {

        const cookieStore = await cookies();
        const userToken = cookieStore.get('user_token');
        
        if (!userToken) {
            return NextResponse.json({
                success: false,
                error: 'Não autenticado'
            }, { status: 401 });
        }

        const tokenData = await verifyToken(userToken.value);
        if (!tokenData || !tokenData.email) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 401 });
        }

        const user = findUserByEmail(tokenData.email as string);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                error: 'Acesso negado'
            }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Body inválido'
            }, { status: 400 });
        }

        const { stock } = body;

        if (!stock || typeof stock !== 'object') {
            return NextResponse.json({
                success: false,
                error: 'Estoque inválido'
            }, { status: 400 });
        }

        setFullDiamondStock(stock);

        return NextResponse.json({
            success: true,
            message: 'Estoque atualizado com sucesso'
        });
    } catch (error: any) {
        console.error('[Admin diamonds-stock POST] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao atualizar estoque'
        }, { status: 500 });
    }
}

export async function PUT() {
    try {

        const response = await fetch(`${BLN_API_BASE}/api/estoque/diamantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ reseller_key: RESELLER_KEY })
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success || data.stock) {

                const newStock: Record<string, number> = {};
                

                if (data.stock && typeof data.stock === 'object') {
                    Object.keys(data.stock).forEach(key => {
                        newStock[key] = parseInt(data.stock[key]) || 0;
                    });
                } else if (data.packages && Array.isArray(data.packages)) {
                    data.packages.forEach((pkg: any) => {
                        if (pkg.amount && pkg.stock !== undefined) {
                            newStock[pkg.amount.toString()] = parseInt(pkg.stock) || 0;
                        }
                    });
                }

                if (Object.keys(newStock).length > 0) {
                    setFullDiamondStock(newStock);
                    
                    return NextResponse.json({
                        success: true,
                        message: 'Estoque sincronizado com sucesso',
                        data: { stock: newStock }
                    });
                }
            }
        }

        return NextResponse.json({
            success: false,
            error: 'Não foi possível sincronizar com a API externa'
        }, { status: 400 });
    } catch (error: any) {
        console.error('[Admin diamonds-stock PUT] Erro:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao sincronizar estoque'
        }, { status: 500 });
    }
}
