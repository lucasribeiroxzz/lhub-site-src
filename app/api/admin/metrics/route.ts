import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import { getDb, getGarenaAccountStats } from '@/lib/db';

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return false;
    
    try {
        const payload = await verifyToken(token);
        if (!payload) return false;
        return (payload as any).role === 'ADMIN';
    } catch {
        return false;
    }
}

export async function GET() {
    console.log('[Metrics] Buscando métricas do sistema');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            console.log('[Metrics] Erro: Não autorizado');
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const accountStats = getGarenaAccountStats();
        

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const allTransactions = db.transactions;
        

        const deposits = allTransactions.filter(t => t.type === 'DEPOSIT');
        const completedDeposits = deposits.filter(t => t.status === 'COMPLETED');
        const pendingDeposits = deposits.filter(t => t.status === 'PENDING');
        

        const depositsToday = completedDeposits.filter(t => new Date(t.date) >= today);
        const depositsTodayTotal = depositsToday.reduce((sum, t) => sum + t.amount, 0);
        

        const depositsThisWeek = completedDeposits.filter(t => new Date(t.date) >= thisWeek);
        const depositsThisWeekTotal = depositsThisWeek.reduce((sum, t) => sum + t.amount, 0);
        

        const depositsThisMonth = completedDeposits.filter(t => new Date(t.date) >= thisMonth);
        const depositsThisMonthTotal = depositsThisMonth.reduce((sum, t) => sum + t.amount, 0);
        

        const totalDeposits = completedDeposits.reduce((sum, t) => sum + t.amount, 0);

        const purchases = allTransactions.filter(t => t.type === 'PURCHASE');
        const completedPurchases = purchases.filter(t => t.status === 'COMPLETED');
        

        const purchasesToday = completedPurchases.filter(t => new Date(t.date) >= today);
        const purchasesTodayTotal = purchasesToday.reduce((sum, t) => sum + t.amount, 0);
        

        const purchasesThisWeek = completedPurchases.filter(t => new Date(t.date) >= thisWeek);
        const purchasesThisWeekTotal = purchasesThisWeek.reduce((sum, t) => sum + t.amount, 0);
        

        const purchasesThisMonth = completedPurchases.filter(t => new Date(t.date) >= thisMonth);
        const purchasesThisMonthTotal = purchasesThisMonth.reduce((sum, t) => sum + t.amount, 0);
        

        const totalPurchases = completedPurchases.reduce((sum, t) => sum + t.amount, 0);

        const totalUsers = db.users.length;
        const usersToday = db.users.filter(u => new Date(u.createdAt) >= today).length;
        const usersThisWeek = db.users.filter(u => new Date(u.createdAt) >= thisWeek).length;
        const usersThisMonth = db.users.filter(u => new Date(u.createdAt) >= thisMonth).length;
        

        const totalUserBalance = db.users.reduce((sum, u) => sum + (u.balance || 0), 0);

        const passesEnviados = completedPurchases.filter(t => 
            t.description.toLowerCase().includes('passe')
        ).length;
        
        const passesEnviadosHoje = purchasesToday.filter(t => 
            t.description.toLowerCase().includes('passe')
        ).length;

        const metrics = {

            summary: {
                totalUsers,
                totalDeposits,
                totalPurchases,
                totalUserBalance,
                passesEnviados
            },
            

            deposits: {
                today: {
                    count: depositsToday.length,
                    total: depositsTodayTotal
                },
                thisWeek: {
                    count: depositsThisWeek.length,
                    total: depositsThisWeekTotal
                },
                thisMonth: {
                    count: depositsThisMonth.length,
                    total: depositsThisMonthTotal
                },
                allTime: {
                    count: completedDeposits.length,
                    total: totalDeposits
                },
                pending: {
                    count: pendingDeposits.length
                }
            },
            

            sales: {
                today: {
                    count: purchasesToday.length,
                    total: purchasesTodayTotal,
                    passes: passesEnviadosHoje
                },
                thisWeek: {
                    count: purchasesThisWeek.length,
                    total: purchasesThisWeekTotal
                },
                thisMonth: {
                    count: purchasesThisMonth.length,
                    total: purchasesThisMonthTotal
                },
                allTime: {
                    count: completedPurchases.length,
                    total: totalPurchases,
                    passes: passesEnviados
                }
            },
            

            users: {
                total: totalUsers,
                today: usersToday,
                thisWeek: usersThisWeek,
                thisMonth: usersThisMonth,
                totalBalance: totalUserBalance
            },
            

            accounts: accountStats,
            

            recentTransactions: allTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(t => ({
                    id: t.id,
                    type: t.type,
                    amount: t.amount,
                    status: t.status,
                    date: t.date,
                    description: t.description
                })),
            

            generatedAt: new Date().toISOString()
        };

        console.log('[Metrics] Métricas geradas com sucesso');

        return NextResponse.json({
            success: true,
            data: encryptData(metrics)
        });
    } catch (error: any) {
        console.error('[Metrics] Erro:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
