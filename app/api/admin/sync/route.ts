import { NextResponse } from 'next/server';
import { 
    getDb, 
    saveDb, 
    syncPasseStock,
    getGarenaAccountStats 
} from '@/lib/db';
import { encryptData } from '@/lib/crypto';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const BLN_API_BASE = 'https://blnhubpasses-freefire.squareweb.app';

export async function GET() {
    
    try {
        const db = getDb();
        

        if (!db.garenaAccounts || db.garenaAccounts.length === 0) {
            return NextResponse.json({
                success: true,
                data: encryptData({
                    accounts: [],
                    stats: {
                        totalAccounts: 0,
                        activeAccounts: 0,
                        errorAccounts: 0,
                        totalDiamonds: 0,
                        totalPassesAvailable: 0
                    },
                    synced: false
                })
            });
        }

        const res = await fetch(`${BLN_API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {

            const stats = getGarenaAccountStats();
            return NextResponse.json({
                success: true,
                data: encryptData({
                    accounts: db.garenaAccounts,
                    stats,
                    synced: false,
                    error: 'API BLN indisponível'
                })
            });
        }

        const blnData = await res.json();

        if (blnData.status === 'SUCCESS' && blnData.contas) {

            const existingAccountsMap = new Map<string, any>();
            db.garenaAccounts.forEach(acc => {
                existingAccountsMap.set(acc.uid, acc);
            });
            

            const updatedAccounts = blnData.contas.map((conta: any) => {
                const existingAccount = existingAccountsMap.get(conta.uid);
                

                const preservedPassword = existingAccount?.password || '';
                
                return {
                    uid: conta.uid,

                    password: preservedPassword,
                    diamonds: conta.diamonds || 0,
                    passes: conta.passes || 0,
                    presentesSentToday: conta.presentes_enviados_hoje || 0,
                    status: 'ACTIVE',
                    lastCheck: new Date().toISOString(),
                    addedAt: existingAccount?.addedAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            db.garenaAccounts = updatedAccounts;
            saveDb(db);

            syncPasseStock();

            const stats = {
                totalAccounts: blnData.estatisticas?.total_contas || updatedAccounts.length,
                activeAccounts: (blnData.estatisticas?.total_contas || updatedAccounts.length) - (blnData.estatisticas?.contas_com_erro || 0),
                errorAccounts: blnData.estatisticas?.contas_com_erro || 0,
                totalDiamonds: blnData.estatisticas?.total_diamantes || 0,
                totalPassesAvailable: blnData.estatisticas?.total_passes_disponiveis || 0
            };

            return NextResponse.json({
                success: true,
                data: encryptData({
                    accounts: updatedAccounts.map((a: any) => ({
                        uid: a.uid,
                        diamonds: a.diamonds,
                        passes: a.passes,
                        presentesSentToday: a.presentesSentToday,
                        status: a.status,
                        lastCheck: a.lastCheck
                    })),
                    stats,
                    synced: true,
                    syncedAt: new Date().toISOString()
                })
            });
        }

        const stats = getGarenaAccountStats();
        return NextResponse.json({
            success: true,
            data: encryptData({
                accounts: db.garenaAccounts,
                stats,
                synced: false,
                error: blnData.message || 'Erro desconhecido'
            })
        });

    } catch (error: any) {
        

        const stats = getGarenaAccountStats();
        return NextResponse.json({
            success: true,
            data: encryptData({
                accounts: [],
                stats,
                synced: false,
                error: error.message
            })
        });
    }
}

export async function POST() {
    return GET();
}
