import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    getAllGarenaAccounts,
    addGarenaAccount,
    getGarenaAccountStats,
    syncPasseStock
} from '@/lib/db';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const BLN_API_BASE = 'https://blnhubpasses-freefire.squareweb.app';

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

export async function POST() {
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!RESELLER_KEY) {
            return NextResponse.json({
                success: false,
                message: 'RESELLER_KEY não configurada no .env'
            }, { status: 500 });
        }

        
        const response = await fetch(`${BLN_API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            

            const localAccounts = getAllGarenaAccounts();
            const localStats = getGarenaAccountStats();
            
            return NextResponse.json({
                success: true,
                data: encryptData({
                    contas: localAccounts.map(a => ({
                        uid: a.uid,
                        diamonds: a.diamonds,
                        passes: a.passes,
                        presentes_enviados_hoje: a.presentesSentToday
                    })),
                    estatisticas: {
                        total_contas: localStats.totalAccounts,
                        contas_com_erro: localStats.errorAccounts,
                        total_diamantes: localStats.totalDiamonds,
                        total_passes_disponiveis: localStats.totalPassesAvailable
                    },
                    message: 'Dados locais (API externa indisponível)',
                    lastUpdate: new Date().toISOString()
                })
            });
        }

        const data = await response.json();

        if (response.ok && data.contas) {
            

            for (const conta of data.contas) {
                

                addGarenaAccount({
                    uid: conta.uid,
                    password: '',
                    diamonds: conta.diamonds || 0,
                    passes: conta.passes || 0,
                    presentesSentToday: conta.presentes_enviados_hoje || 0,
                    status: 'ACTIVE'
                });
            }

            syncPasseStock();

            const localStats = getGarenaAccountStats();

            return NextResponse.json({
                success: true,
                data: encryptData({
                    contas: data.contas,
                    estatisticas: {
                        ...data.estatisticas,
                        ...localStats
                    },
                    lastUpdate: new Date().toISOString()
                })
            });
        } else if (data.status === 'SEM_CONTAS_DISPONIVEIS') {
            return NextResponse.json({
                success: true,
                data: encryptData({
                    contas: [],
                    estatisticas: {
                        total_contas: 0,
                        contas_com_erro: 0,
                        total_diamantes: 0,
                        total_passes_disponiveis: 0
                    },
                    message: 'Nenhuma conta disponível'
                })
            });
        } else {
            

            const localAccounts = getAllGarenaAccounts();
            const localStats = getGarenaAccountStats();
            
            return NextResponse.json({
                success: true,
                data: encryptData({
                    contas: localAccounts.map(a => ({
                        uid: a.uid,
                        diamonds: a.diamonds,
                        passes: a.passes,
                        presentes_enviados_hoje: a.presentesSentToday
                    })),
                    estatisticas: {
                        total_contas: localStats.totalAccounts,
                        contas_com_erro: localStats.errorAccounts,
                        total_diamantes: localStats.totalDiamonds,
                        total_passes_disponiveis: localStats.totalPassesAvailable
                    },
                    message: data.message || data.status || 'Usando dados locais',
                    lastUpdate: new Date().toISOString()
                })
            });
        }
    } catch (error: any) {
        console.error('[Verify] Erro:', error);
        

        try {
            const localAccounts = getAllGarenaAccounts();
            const localStats = getGarenaAccountStats();
            
            return NextResponse.json({
                success: true,
                data: encryptData({
                    contas: localAccounts.map(a => ({
                        uid: a.uid,
                        diamonds: a.diamonds,
                        passes: a.passes,
                        presentes_enviados_hoje: a.presentesSentToday
                    })),
                    estatisticas: {
                        total_contas: localStats.totalAccounts,
                        contas_com_erro: localStats.errorAccounts,
                        total_diamantes: localStats.totalDiamonds,
                        total_passes_disponiveis: localStats.totalPassesAvailable
                    },
                    message: 'Dados locais (erro na API externa: ' + error.message + ')',
                    lastUpdate: new Date().toISOString()
                })
            });
        } catch {
            return NextResponse.json({
                success: false,
                message: error.message || 'Erro de conexão com API'
            }, { status: 500 });
        }
    }
}

export async function GET() {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const accounts = getAllGarenaAccounts();
        const stats = getGarenaAccountStats();

        return NextResponse.json({
            success: true,
            data: encryptData({
                accounts: accounts.map(a => ({
                    uid: a.uid,
                    diamonds: a.diamonds,
                    passes: a.passes,
                    presentesSentToday: a.presentesSentToday,
                    status: a.status,
                    lastCheck: a.lastCheck
                })),
                stats,
                lastUpdate: accounts.length > 0 
                    ? accounts.reduce((latest: string, a) => {
                        const aCheck = a.lastCheck || a.addedAt || '';
                        if (aCheck && latest && new Date(aCheck) > new Date(latest)) {
                            return aCheck;
                        }
                        return latest;
                    }, accounts[0].lastCheck || accounts[0].addedAt || new Date().toISOString())
                    : null
            })
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
