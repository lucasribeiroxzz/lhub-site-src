import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbsDir = path.join(process.cwd(), 'dbs');

        let totalUsers = 0;
        let totalPassesSent = 0;
        let totalTokensSent = 0;
        let totalLikesSent = 0;
        let totalDeposits = 0;

        try {
            const usersData = JSON.parse(fs.readFileSync(path.join(dbsDir, 'users.json'), 'utf-8'));
            totalUsers = Array.isArray(usersData) ? usersData.length : 0;
        } catch { }

        try {
            const txData = JSON.parse(fs.readFileSync(path.join(dbsDir, 'transactions.json'), 'utf-8'));
            const transactions = Array.isArray(txData) ? txData : [];

            for (const tx of transactions) {
                if (tx.type === 'PURCHASE' && tx.status === 'COMPLETED') {
                    const desc = (tx.description || tx.productName || '').toLowerCase();
                    if (desc.includes('passe') || desc.includes('elite')) {
                        totalPassesSent += (tx.quantity || 1);
                    } else if (desc.includes('token') || desc.includes('caixa')) {
                        totalTokensSent += (tx.quantity || 1);
                    } else if (desc.includes('like')) {
                        totalLikesSent += (tx.likesAdded || tx.quantity || 1);
                    }
                }
                if (tx.type === 'DEPOSIT' && tx.status === 'COMPLETED') {
                    totalDeposits++;
                }
            }
        } catch { }

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalPassesSent,
                totalTokensSent,
                totalLikesSent,
                totalDeposits
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
