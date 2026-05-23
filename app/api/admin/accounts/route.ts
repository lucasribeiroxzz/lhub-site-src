import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    getAllGarenaAccounts,
    addGarenaAccount,
    removeGarenaAccount,
    getGarenaAccountStats,
    syncPasseStock,
    GarenaAccount
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
                    password: a.password || '',
                    diamonds: a.diamonds,
                    passes: a.passes,
                    presentesSentToday: a.presentesSentToday,
                    status: a.status,
                    lastCheck: a.lastCheck,
                    addedAt: a.addedAt
                })),
                stats
            })
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { accounts: accountsText, singleAccount } = body;

        const results: { uid: string; status: string; message: string }[] = [];

        if (singleAccount) {
            const { uid, password } = singleAccount;
            const result = await addSingleAccount(uid, password);
            results.push(result);
        }

        else if (accountsText) {
            const lines = accountsText.split('\n').filter((line: string) => line.trim());
            
            for (const line of lines) {
                const [uid, password] = line.trim().split(':');
                if (uid && password) {
                    const result = await addSingleAccount(uid.trim(), password.trim());
                    results.push(result);
                } else {
                    results.push({
                        uid: line,
                        status: 'ERROR',
                        message: 'Formato inválido. Use uid:password'
                    });
                }
            }
        }

        syncPasseStock();

        const successCount = results.filter(r => r.status === 'SUCCESS').length;
        const errorCount = results.filter(r => r.status === 'ERROR').length;

        return NextResponse.json({
            success: true,
            data: encryptData({
                results,
                summary: {
                    total: results.length,
                    success: successCount,
                    errors: errorCount
                }
            })
        });
    } catch (error) {
        console.error('Error adding accounts:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await req.json();
        
        if (!uid) {
            return NextResponse.json({ success: false, message: 'UID is required' }, { status: 400 });
        }

        const removed = removeGarenaAccount(uid);
        
        if (removed) {
            syncPasseStock();
            return NextResponse.json({ success: true, message: 'Conta removida com sucesso' });
        } else {
            return NextResponse.json({ success: false, message: 'Conta não encontrada' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error removing account:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

async function addSingleAccount(uid: string, password: string): Promise<{ uid: string; status: string; message: string }> {
    try {

        const formData = new URLSearchParams();
        formData.append('reseller_key', RESELLER_KEY);
        formData.append('uid', uid);
        formData.append('password', password);

        const response = await fetch(`${BLN_API_BASE}/api/adicionar_conta`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.status === 'CONTA_ADICIONADA') {

            addGarenaAccount({
                uid,
                password,
                diamonds: 0,
                passes: 0,
                presentesSentToday: 0,
                status: 'ACTIVE'
            });

            return {
                uid,
                status: 'SUCCESS',
                message: data.message || 'Conta adicionada com sucesso'
            };
        } else {
            return {
                uid,
                status: 'ERROR',
                message: data.message || data.status || 'Erro ao adicionar conta'
            };
        }
    } catch (error: any) {
        return {
            uid,
            status: 'ERROR',
            message: error.message || 'Erro de conexão com API'
        };
    }
}
