import fs from 'fs';
import path from 'path';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const API_BASE = 'https://blnhubpasses-freefire.squareweb.app';
const INTERVALO = 50 * 1000;

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

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

function log(msg: string) {
    const timestamp = new Date().toISOString();
    console.log(`[AutoVerify ${timestamp}] ${msg}`);
}

function loadDb(): Database | null {
    try {
        if (!fs.existsSync(dbPath)) return null;
        const content = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        log(`Erro ao carregar db: ${error}`);
        return null;
    }
}

function saveDb(data: Database): void {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        log(`Erro ao salvar db: ${error}`);
    }
}

function loadContasSemDimas(): ContaSemDima[] {
    try {
        if (!fs.existsSync(contasSemDimasPath)) {

            if (!fs.existsSync(dbsDir)) {
                fs.mkdirSync(dbsDir, { recursive: true });
            }
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
        log(`Erro ao salvar contas sem dimas: ${error}`);
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
    } catch (error) {
        log(`Erro ao separar db: ${error}`);
    }
}

async function verificarContas(): Promise<void> {
    if (!RESELLER_KEY) {
        log('RESELLER_KEY não configurada!');
        return;
    }

    log('Iniciando verificação...');

    try {

        const db = loadDb();
        if (!db) {
            log('Erro ao carregar db.json');
            return;
        }

        const url = `${API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`;
        log(`Chamando API: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            log(`API retornou HTML/texto ao invés de JSON: ${text.substring(0, 100)}...`);
            log('Usando dados locais...');
            

            separarDb(db);
            
            const totalPasses = db.garenaAccounts
                .filter(c => c.status === 'ACTIVE')
                .reduce((sum, c) => sum + (c.passes || 0), 0);
            
            const totalDiamantes = db.garenaAccounts.reduce((sum, c) => sum + (c.diamonds || 0), 0);
            log(`✓ Dados locais: Contas: ${db.garenaAccounts.length} | Passes: ${totalPasses} | Diamantes: ${totalDiamantes}`);
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.contas) {
            log(`API retornou: ${data.status || data.message || 'Erro'}`);
            return;
        }

        log(`API retornou ${data.contas.length} contas`);

        const contasSemDimas = loadContasSemDimas();
        const contasSemDimasUids = new Set(contasSemDimas.map(c => c.uid));

        const garenaDict = new Map(db.garenaAccounts.map(c => [c.uid, c]));

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
                    log(`Conta ${uid} movida para contas_semdimas.json`);
                }
            } else {

                if (garenaDict.has(uid)) {
                    const conta = garenaDict.get(uid)!;
                    conta.diamonds = diamonds;
                    conta.passes = passes;
                    conta.presentesSentToday = contaApi.presentes_enviados_hoje || 0;
                    conta.status = 'ACTIVE';
                    conta.updatedAt = new Date().toISOString();
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
                }
                contasAtualizadas++;
            }
        }

        db.garenaAccounts = Array.from(garenaDict.values());

        if (contasMovidas > 0) {
            saveContasSemDimas(contasSemDimas);
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
        }

        saveDb(db);

        separarDb(db);

        const totalDiamantes = db.garenaAccounts.reduce((sum, c) => sum + (c.diamonds || 0), 0);
        log(`✓ Contas: ${db.garenaAccounts.length} | Passes: ${totalPasses} | Diamantes: ${totalDiamantes} | Movidas: ${contasMovidas} | Sem dimas total: ${contasSemDimas.length}`);

    } catch (error) {
        log(`Erro na verificação: ${error}`);
    }
}

export function iniciarVerificacaoAutomatica(): void {
    if (isRunning) {
        log('Verificação automática já está rodando');
        return;
    }

    log('='.repeat(50));
    log('INICIANDO VERIFICAÇÃO AUTOMÁTICA');
    log(`Intervalo: ${INTERVALO / 1000} segundos`);
    log(`API: ${API_BASE}`);
    log(`RESELLER_KEY: ${RESELLER_KEY ? 'Configurada' : 'NÃO CONFIGURADA!'}`);
    log('='.repeat(50));

    if (!fs.existsSync(dbsDir)) {
        fs.mkdirSync(dbsDir, { recursive: true });
    }
    if (!fs.existsSync(contasSemDimasPath)) {
        fs.writeFileSync(contasSemDimasPath, '[]');
    }

    isRunning = true;

    verificarContas();

    intervalId = setInterval(verificarContas, INTERVALO);
}

export function pararVerificacaoAutomatica(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning = false;
    log('Verificação automática parada');
}

if (typeof window === 'undefined') {

    iniciarVerificacaoAutomatica();
}
