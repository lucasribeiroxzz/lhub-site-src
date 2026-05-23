import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const API_BASE = 'https://blnhubpasses-freefire.squareweb.app';

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
    updatedAt?: string;
    lastCheck?: string;
}

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
}

function loadDb(): any {
    try {
        if (!fs.existsSync(dbPath)) return null;
        const content = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('[CronVerify] Erro ao carregar db:', error);
        return null;
    }
}

function saveDb(data: any): void {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[CronVerify] Erro ao salvar db:', error);
    }
}

function loadContasSemDimas(): ContaSemDima[] {
    try {
        if (!fs.existsSync(dbsDir)) {
            fs.mkdirSync(dbsDir, { recursive: true });
        }
        if (!fs.existsSync(contasSemDimasPath)) {
            fs.writeFileSync(contasSemDimasPath, '[]');
            return [];
        }
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
    } catch (error) {
        console.error('[CronVerify] Erro ao salvar contas sem dimas:', error);
    }
}

function separarDb(db: any): void {
    try {
        if (!fs.existsSync(dbsDir)) {
            fs.mkdirSync(dbsDir, { recursive: true });
        }

        const contasComCredenciais = (db.garenaAccounts || []).map((c: any) => ({
            uid: c.uid,
            password: c.password || '',
            diamonds: c.diamonds || 0,
            passes: c.passes || 0,
            status: c.status || 'ACTIVE',
            presentesSentToday: c.presentesSentToday || 0,
            addedAt: c.addedAt,
            updatedAt: c.updatedAt
        }));

        const colecoes: Record<string, any> = {
            'users.json': db.users || [],
            'contas.json': contasComCredenciais,
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
    } catch (error) {
        console.error('[CronVerify] Erro ao separar db:', error);
    }
}

export async function GET(req: Request) {
    console.log('[CronVerify] Iniciando verificação automática...');
    
    const startTime = Date.now();
    
    try {
        if (!RESELLER_KEY) {
            console.error('[CronVerify] RESELLER_KEY não configurada!');
            return NextResponse.json({
                success: false,
                error: 'RESELLER_KEY não configurada'
            }, { status: 500 });
        }

        const db = loadDb();
        if (!db) {
            return NextResponse.json({
                success: false,
                error: 'Erro ao carregar db.json'
            }, { status: 500 });
        }

        const url = `${API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`;
        console.log('[CronVerify] Chamando API:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[CronVerify] API retornou HTML:', text.substring(0, 100));
            

            separarDb(db);
            
            return NextResponse.json({
                success: false,
                error: 'API externa retornou HTML ao invés de JSON',
                localData: {
                    contas: db.garenaAccounts?.length || 0,
                    passes: db.garenaAccounts?.reduce((sum: number, c: any) => sum + (c.passes || 0), 0) || 0
                }
            }, { status: 502 });
        }

        const data = await response.json();
        console.log('[CronVerify] Resposta API:', JSON.stringify(data).substring(0, 200));

        if (!response.ok || !data.contas) {
            console.log('[CronVerify] API retornou erro:', data.status || data.message);
            

            separarDb(db);
            
            return NextResponse.json({
                success: false,
                error: data.status || data.message || 'Erro na API externa',
                localData: {
                    contas: db.garenaAccounts?.length || 0
                }
            }, { status: 400 });
        }

        console.log('[CronVerify] Contas recebidas:', data.contas.length);

        const contasSemDimas = loadContasSemDimas();
        const contasSemDimasUids = new Set(contasSemDimas.map(c => c.uid));

        const garenaDict = new Map<string, GarenaAccount>(
            (db.garenaAccounts || []).map((c: GarenaAccount) => [c.uid, c])
        );

        let contasMovidas = 0;
        let contasAtualizadas = 0;

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
                    garenaDict.delete(uid);
                    contasMovidas++;
                    console.log(`[CronVerify] Conta ${uid} movida para contas_semdimas.json`);
                }
            } else {

                if (garenaDict.has(uid)) {
                    const conta = garenaDict.get(uid)!;
                    conta.diamonds = diamonds;
                    conta.passes = passes;
                    conta.presentesSentToday = contaApi.presentes_enviados_hoje || 0;
                    conta.status = 'ACTIVE';
                    conta.updatedAt = new Date().toISOString();
                    conta.lastCheck = new Date().toISOString();
                    contasAtualizadas++;
                }
            }
        }

        db.garenaAccounts = Array.from(garenaDict.values());

        if (contasMovidas > 0) {
            saveContasSemDimas(contasSemDimas);
        }

        const totalPasses = db.garenaAccounts
            .filter((c: GarenaAccount) => c.status === 'ACTIVE')
            .reduce((sum: number, c: GarenaAccount) => sum + (c.passes || 0), 0);
        
        const totalDiamantes = db.garenaAccounts
            .reduce((sum: number, c: GarenaAccount) => sum + (c.diamonds || 0), 0);

        const passeIndex = db.products?.findIndex((p: any) => 
            p.type === 'PASSE' || p.id?.toLowerCase().includes('passe')
        );
        if (passeIndex !== undefined && passeIndex !== -1) {
            db.products[passeIndex].stock = totalPasses;
            db.products[passeIndex].updatedAt = new Date().toISOString();
        }

        saveDb(db);

        separarDb(db);

        const tempoProcessamento = (Date.now() - startTime) / 1000;

        console.log(`[CronVerify] ✓ Contas: ${db.garenaAccounts.length} | Passes: ${totalPasses} | Diamantes: ${totalDiamantes} | Movidas: ${contasMovidas} | Tempo: ${tempoProcessamento}s`);

        return NextResponse.json({
            success: true,
            message: 'Verificação concluída',
            data: {
                contas: db.garenaAccounts.length,
                contasAtualizadas,
                contasMovidas,
                contasSemDimasTotal: contasSemDimas.length,
                totalPasses,
                totalDiamantes,
                tempoProcessamento: `${tempoProcessamento}s`,
                ultimaVerificacao: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('[CronVerify] Erro:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Erro interno'
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    return GET(req);
}
