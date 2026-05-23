import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/crypto';
import fs from 'fs';
import path from 'path';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const BLN_API_BASE = 'https://blnhubpasses-freefire.squareweb.app';

const dbPath = path.join(process.cwd(), 'db.json');
const dbsDir = path.join(process.cwd(), 'dbs');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');

interface GarenaAccount {
    uid: string;
    password: string;
    diamonds: number;
    passes: number;
    presentesSentToday: number;
    status: string;
    addedAt: string;
    updatedAt: string;
}

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
}

interface Database {
    users: any[];
    products: any[];
    transactions: any[];
    garenaAccounts: GarenaAccount[];
    coupons: any[];
    likesOrders: any[];
    apiKeys: any[];
    settings: any;
}

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

function loadDb(): Database | null {
    try {
        if (!fs.existsSync(dbPath)) return null;
        const content = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('[AutoVerify] Erro ao carregar db:', error);
        return null;
    }
}

function saveDb(data: Database): void {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log('[AutoVerify] db.json salvo');
    } catch (error) {
        console.error('[AutoVerify] Erro ao salvar db:', error);
    }
}

function loadContasSemDimas(): ContaSemDima[] {
    try {
        if (!fs.existsSync(contasSemDimasPath)) return [];
        const content = fs.readFileSync(contasSemDimasPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

function saveContasSemDimas(contas: ContaSemDima[]): void {
    try {
        if (!fs.existsSync(dbsDir)) {
            fs.mkdirSync(dbsDir, { recursive: true });
        }
        fs.writeFileSync(contasSemDimasPath, JSON.stringify(contas, null, 2));
        console.log('[AutoVerify] contas_semdimas.json salvo');
    } catch (error) {
        console.error('[AutoVerify] Erro ao salvar contas sem dimas:', error);
    }
}

function separarDb(db: Database): void {
    try {
        if (!fs.existsSync(dbsDir)) {
            fs.mkdirSync(dbsDir, { recursive: true });
        }

        const colecoes: Record<string, any> = {
            'users.json': db.users || [],
            'contas.json': db.garenaAccounts || [],
            'transactions.json': db.transactions || [],
            'coupons.json': db.coupons || [],
            'likesOrders.json': db.likesOrders || [],
            'apiKeys.json': db.apiKeys || [],
            'settings.json': db.settings || {},
            'products.json': db.products || []
        };

        for (const [arquivo, dados] of Object.entries(colecoes)) {
            const caminho = path.join(dbsDir, arquivo);
            fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
        }

        console.log('[AutoVerify] DB separado em arquivos individuais');
    } catch (error) {
        console.error('[AutoVerify] Erro ao separar db:', error);
    }
}

export async function POST() {
    console.log('[AutoVerify] Iniciando verificação automática...');
    
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const db = loadDb();
        if (!db) {
            return NextResponse.json({ success: false, message: 'Erro ao carregar db.json' }, { status: 500 });
        }

        console.log('[AutoVerify] Chamando API BLN...');
        const response = await fetch(`${BLN_API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`, {
            method: 'GET'
        });

        const data = await response.json();
        console.log('[AutoVerify] Resposta BLN:', data.contas?.length || 0, 'contas');

        let contasMovidas: string[] = [];
        let contasAtualizadas = 0;

        if (response.ok && data.contas) {

            const contasSemDimas = loadContasSemDimas();
            const contasSemDimasUids = new Set(contasSemDimas.map(c => c.uid));

            const garenaDict = new Map(db.garenaAccounts.map(c => [c.uid, c]));

            for (const contaApi of data.contas) {
                const uid = contaApi.uid;
                const diamonds = contaApi.diamonds || 0;
                const passes = contaApi.passes || 0;

                if (diamonds === 0 && passes === 0) {
                    const contaLocal = garenaDict.get(uid);
                    
                    if (contaLocal && !contasSemDimasUids.has(uid)) {

                        contasSemDimas.push({
                            uid: uid,
                            password: contaLocal.password || '',
                            movedAt: new Date().toISOString(),
                            lastDiamonds: diamonds,
                            lastPasses: passes
                        });
                        contasSemDimasUids.add(uid);
                        contasMovidas.push(uid);
                        console.log(`[AutoVerify] Conta ${uid} movida para contas_semdimas.json`);
                    }
                } else {

                    if (garenaDict.has(uid)) {
                        const conta = garenaDict.get(uid)!;
                        conta.diamonds = diamonds;
                        conta.passes = passes;
                        conta.presentesSentToday = contaApi.presentes_enviados_hoje || 0;
                        conta.status = 'ACTIVE';
                        conta.updatedAt = new Date().toISOString();
                        contasAtualizadas++;
                    } else {
                        garenaDict.set(uid, {
                            uid: uid,
                            password: '',
                            diamonds: diamonds,
                            passes: passes,
                            presentesSentToday: contaApi.presentes_enviados_hoje || 0,
                            status: 'ACTIVE',
                            addedAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        contasAtualizadas++;
                    }
                }
            }

            for (const uid of contasMovidas) {
                garenaDict.delete(uid);
            }

            db.garenaAccounts = Array.from(garenaDict.values());

            if (contasMovidas.length > 0) {
                saveContasSemDimas(contasSemDimas);
            }
        }

        const totalPasses = db.garenaAccounts
            .filter(c => c.status === 'ACTIVE')
            .reduce((sum, c) => sum + (c.passes || 0), 0);

        const passeIndex = db.products.findIndex((p: any) => 
            p.type === 'PASSE' || p.id?.toLowerCase().includes('passe')
        );
        if (passeIndex !== -1) {
            db.products[passeIndex].stock = totalPasses;
            db.products[passeIndex].updatedAt = new Date().toISOString();
            console.log(`[AutoVerify] Estoque de passes atualizado: ${totalPasses}`);
        }

        saveDb(db);

        separarDb(db);

        const stats = {
            totalContas: db.garenaAccounts.length,
            contasAtivas: db.garenaAccounts.filter(c => c.status === 'ACTIVE').length,
            totalDiamantes: db.garenaAccounts.reduce((sum, c) => sum + (c.diamonds || 0), 0),
            totalPasses: totalPasses,
            contasMovidasParaSemDimas: contasMovidas.length,
            contasAtualizadas: contasAtualizadas,
            contasSemDimasTotal: loadContasSemDimas().length
        };

        console.log('[AutoVerify] Estatísticas:', stats);

        return NextResponse.json({
            success: true,
            data: encryptData({
                stats,
                contasMovidas,
                lastUpdate: new Date().toISOString()
            })
        });

    } catch (error: any) {
        console.error('[AutoVerify] Erro:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Erro na verificação automática'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const db = loadDb();
        if (!db) {
            return NextResponse.json({ success: false, message: 'Erro ao carregar db.json' }, { status: 500 });
        }

        const contasSemDimas = loadContasSemDimas();

        const stats = {
            totalContas: db.garenaAccounts.length,
            contasAtivas: db.garenaAccounts.filter(c => c.status === 'ACTIVE').length,
            totalDiamantes: db.garenaAccounts.reduce((sum, c) => sum + (c.diamonds || 0), 0),
            totalPasses: db.garenaAccounts
                .filter(c => c.status === 'ACTIVE')
                .reduce((sum, c) => sum + (c.passes || 0), 0),
            contasSemDimasTotal: contasSemDimas.length
        };

        return NextResponse.json({
            success: true,
            data: encryptData({
                stats,
                contasSemDimas: contasSemDimas.map(c => ({
                    uid: c.uid,
                    movedAt: c.movedAt
                }))
            })
        });

    } catch (error: any) {
        console.error('[AutoVerify] Erro:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Erro ao obter status'
        }, { status: 500 });
    }
}
