import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import {
    getTokenAccounts,
    saveTokenAccounts,
    addOrUpdateTokenAccount,
    removeTokenAccount,
    getTokenAccountStats,
    syncTokenStock,
    TokenAccount
} from '@/lib/db';

const TOKEN_RESELLER_KEY = process.env.TOKEN_RESELLER_KEY || 'lucassxamigo777';
const TOKEN_API_BASE = process.env.TOKEN_API_BASE || 'https://blnhubtokens-freefire.shardweb.app';

async function checkAdmin(): Promise<{ success: boolean; error?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token');

    if (!token) {
        return { success: false, error: 'Não autorizado' };
    }

    const session = await verifyToken(token.value);
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: 'Acesso negado' };
    }

    return { success: true };
}

export async function GET() {
    const auth = await checkAdmin();
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const accounts = getTokenAccounts();
        const stats = getTokenAccountStats();

        return NextResponse.json({
            success: true,
            data: {
                accounts: accounts.map(a => ({
                    uid: a.uid,
                    password: a.password ? '***' + a.password.slice(-4) : '',
                    diamonds: a.diamonds,
                    caixas: a.caixas,
                    status: a.status,
                    presentesSentToday: a.presentesSentToday,
                    lastCheck: a.lastCheck,
                    addedAt: a.addedAt
                })),
                stats: stats,
                total: accounts.length,
                active: stats.activeAccounts,
                totalCaixas: stats.totalCaixasAvailable
            }
        });
    } catch (error: any) {
        console.error('[Admin Token Accounts] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await checkAdmin();
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, accounts: accountsText } = body;

        if (action === 'verify') {

            try {
                const url = `${TOKEN_API_BASE}/api/contas/verificar?reseller_key=${TOKEN_RESELLER_KEY}`;

                const res = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    return NextResponse.json({
                        success: false,
                        message: 'API retornou HTML ao invés de JSON'
                    }, { status: 500 });
                }

                const data = await res.json();

                if (!res.ok || !data.contas) {
                    return NextResponse.json({
                        success: false,
                        message: `API retornou: ${data.status || data.message || 'Erro na API externa'}`
                    }, { status: 500 });
                }

                const localAccounts = getTokenAccounts();
                const passwordMap = new Map<string, string>();
                for (const acc of localAccounts) {
                    if (acc.password) {
                        passwordMap.set(acc.uid, acc.password);
                    }
                }

                const updatedAccounts: TokenAccount[] = [];
                for (const contaApi of data.contas) {
                    updatedAccounts.push({
                        uid: contaApi.uid,
                        password: passwordMap.get(contaApi.uid) || '',
                        diamonds: contaApi.diamonds || contaApi.diamantes || 0,
                        caixas: contaApi.caixas_disponiveis || contaApi.caixas || contaApi.tokens || contaApi.passes || 0,
                        presentesSentToday: contaApi.presentes_enviados_hoje || contaApi.presentesSentToday || 0,
                        status: 'ACTIVE',
                        addedAt: new Date().toISOString(),
                        lastCheck: new Date().toISOString()
                    });
                }

                saveTokenAccounts(updatedAccounts);
                syncTokenStock();

                return NextResponse.json({
                    success: true,
                    message: `Verificação concluída: ${updatedAccounts.length} contas sincronizadas`,
                    data: { verified: updatedAccounts.length, errors: 0 }
                });
            } catch (error: any) {
                return NextResponse.json({
                    success: false,
                    message: `Erro na verificação: ${error.message}`
                }, { status: 500 });
            }
        }

        if (!accountsText) {
            return NextResponse.json({ success: false, message: 'Nenhuma conta fornecida' }, { status: 400 });
        }

        let normalizedText = accountsText;

        if (!accountsText.includes('\n') && accountsText.includes(' ')) {
            normalizedText = accountsText.split(' ').join('\n');
        }

        const lines = normalizedText.split('\n').filter((l: string) => l.trim());
        const results: { uid: string; status: string; message: string }[] = [];

        console.log(`[TokenAccounts] Processando ${lines.length} linhas...`);

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            console.log(`[TokenAccounts] Processando: ${trimmed.slice(0, 30)}...`);

            const parts = trimmed.includes(':') ? trimmed.split(':') : trimmed.split(',');
            if (parts.length < 2) {
                results.push({
                    uid: trimmed.slice(0, 30),
                    status: 'ERROR',
                    message: `Formato inválido: ${trimmed.slice(0, 30)}...`
                });
                continue;
            }

            const uid = parts[0].trim();
            const password = parts.slice(1).join(':').trim();

            if (!uid || !password) {
                results.push({
                    uid: uid || 'N/A',
                    status: 'ERROR',
                    message: `UID ou senha vazio: ${trimmed.slice(0, 30)}...`
                });
                continue;
            }

            const result = await addSingleTokenAccount(uid, password);
            results.push(result);
        }

        console.log(`[TokenAccounts] Resultado: ${results.length} processadas`);

        syncTokenStock();

        const successCount = results.filter(r => r.status === 'SUCCESS').length;
        const errorCount = results.filter(r => r.status === 'ERROR').length;

        return NextResponse.json({
            success: true,
            message: `${successCount} conta(s) adicionada(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
            data: { 
                added: successCount,
                errors: results.filter(r => r.status === 'ERROR').map(r => `${r.uid}: ${r.message}`)
            }
        });

    } catch (error: any) {
        console.error('[Admin Token Accounts POST] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await checkAdmin();
    if (!auth.success) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ success: false, message: 'UID não fornecido' }, { status: 400 });
        }

        const removed = removeTokenAccount(uid);

        if (!removed) {
            return NextResponse.json({ success: false, message: 'Conta não encontrada' }, { status: 404 });
        }

        syncTokenStock();

        return NextResponse.json({
            success: true,
            message: `Conta ${uid} removida com sucesso`
        });

    } catch (error: any) {
        console.error('[Admin Token Accounts DELETE] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

async function addSingleTokenAccount(uid: string, password: string): Promise<{ uid: string; status: string; message: string }> {
    try {

        const formData = new URLSearchParams();
        formData.append('reseller_key', TOKEN_RESELLER_KEY);
        formData.append('uid', uid);
        formData.append('password', password);

        const response = await fetch(`${TOKEN_API_BASE}/api/adicionar_conta`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.status === 'CONTA_ADICIONADA') {

            addOrUpdateTokenAccount({
                uid,
                password,
                diamonds: 0,
                caixas: 0,
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
