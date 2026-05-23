import fs from 'fs';
import path from 'path';

const RESELLER_KEY = process.env.RESELLER_KEY || '';
const API_BASE = 'https://blnhubpasses-freefire.squareweb.app';
const INTERVALO = 30000;

const dbsDir = path.join(process.cwd(), 'dbs');
const contasPath = path.join(dbsDir, 'contas.json');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');
const productsPath = path.join(dbsDir, 'products.json');

interface GarenaAccount {
    uid: string;
    password: string;
    diamonds: number;
    passes: number;
    presentesSentToday: number;
    status: string;
    addedAt?: string;
    updatedAt?: string;
}

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
}

interface Product {
    id: string;
    name: string;
    type: string;
    stock: number;
    price: number;
    updatedAt?: string;
}

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

function log(msg: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ServerVerify] ${msg}`);
}

function ensureDbsDir(): void {
    if (!fs.existsSync(dbsDir)) {
        fs.mkdirSync(dbsDir, { recursive: true });
    }
}

function loadJsonFile<T>(filePath: string, defaultValue: T): T {
    ensureDbsDir();
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return defaultValue;
    }
}

function saveJsonFile<T>(filePath: string, data: T): void {
    ensureDbsDir();
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        log(`Erro ao salvar ${filePath}: ${error}`);
    }
}

async function verificar(): Promise<void> {
    if (!RESELLER_KEY) {
        log('RESELLER_KEY não configurada!');
        return;
    }

    try {

        const contas = loadJsonFile<GarenaAccount[]>(contasPath, []);
        const contasSemDimas = loadJsonFile<ContaSemDima[]>(contasSemDimasPath, []);
        const products = loadJsonFile<Product[]>(productsPath, []);
        
        const contasSemDimasUids = new Set(contasSemDimas.map(c => c.uid));

        const passwordMap = new Map<string, string>();
        for (const conta of contas) {
            if (conta.password) {
                passwordMap.set(conta.uid, conta.password);
            }
        }

        const url = `${API_BASE}/api/contas/verificar?reseller_key=${RESELLER_KEY}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            log('API retornou HTML ao invés de JSON');
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.contas || data.status === 'SEM_CONTAS_DISPONIVEIS' || data.message === 'SEM_CONTAS_DISPONIVEIS') {
            log(`API retornou: ${data.status || data.message || 'Sem contas'}`);
            

            if (contas.length > 0) {
                for (const conta of contas) {
                    if (!contasSemDimasUids.has(conta.uid)) {
                        const uid = conta.uid;
                        const password = conta.password || '';
                        contasSemDimas.push({
                            uid: uid,
                            password: password,
                            movedAt: new Date().toISOString(),
                            lastDiamonds: conta.diamonds || 0,
                            lastPasses: conta.passes || 0
                        });
                        contasSemDimasUids.add(uid);
                        log(`Conta ${uid}:${password || '(sem senha)'} -> contas_semdimas.json`);
                    }
                }
                saveJsonFile(contasSemDimasPath, contasSemDimas);
                log(`${contas.length} contas movidas para contas_semdimas.json`);
            }
            

            saveJsonFile(contasPath, []);
            

            const passeIndex = products.findIndex((p: any) => 
                p.type === 'PASSE' || p.id?.toLowerCase().includes('passe')
            );
            if (passeIndex !== -1) {
                products[passeIndex].stock = 0;
                products[passeIndex].updatedAt = new Date().toISOString();
                saveJsonFile(productsPath, products);
            }
            
            log('Estoque de passes zerado!');
            return;
        }

        const novasContas: GarenaAccount[] = [];
        let contasMovidas = 0;

        for (const contaApi of data.contas) {
            const uid = contaApi.uid;
            const diamonds = contaApi.diamonds || 0;
            const passes = contaApi.passes || 0;
            const presentesSentToday = contaApi.presentes_enviados_hoje || 0;

            if (diamonds === 0 && passes === 0) {
                if (!contasSemDimasUids.has(uid)) {
                    const password = passwordMap.get(uid) || '';
                    contasSemDimas.push({
                        uid: uid,
                        password: password,
                        movedAt: new Date().toISOString(),
                        lastDiamonds: diamonds,
                        lastPasses: passes
                    });
                    contasSemDimasUids.add(uid);
                    contasMovidas++;
                    log(`Conta ${uid}:${password || '(sem senha)'} -> contas_semdimas.json`);
                }
            } else {

                novasContas.push({
                    uid: uid,
                    password: passwordMap.get(uid) || '',
                    diamonds: diamonds,
                    passes: passes,
                    presentesSentToday: presentesSentToday,
                    status: 'ACTIVE',
                    updatedAt: new Date().toISOString()
                });
            }
        }

        saveJsonFile(contasPath, novasContas);
        

        if (contasMovidas > 0) {
            saveJsonFile(contasSemDimasPath, contasSemDimas);
        }

        const totalPasses = data.estatisticas?.total_passes_disponiveis || 
            novasContas.reduce((sum, c) => sum + (c.passes || 0), 0);
        
        const totalDiamantes = data.estatisticas?.total_diamantes ||
            novasContas.reduce((sum, c) => sum + (c.diamonds || 0), 0);

        const passeIndex = products.findIndex((p: any) => 
            p.type === 'PASSE' || p.id?.toLowerCase().includes('passe')
        );
        if (passeIndex !== -1) {
            products[passeIndex].stock = totalPasses;
            products[passeIndex].updatedAt = new Date().toISOString();
            saveJsonFile(productsPath, products);
        }

        log(`✓ Contas: ${novasContas.length} | Passes: ${totalPasses} | Diamantes: ${totalDiamantes} | Movidas: ${contasMovidas} | Sem dimas: ${contasSemDimas.length}`);

    } catch (error: any) {
        log(`Erro: ${error.message || error}`);
    }
}

export function startServerVerificador(): void {
    if (isRunning) {
        log('Verificador já está rodando');
        return;
    }

    log('='.repeat(50));
    log('INICIANDO VERIFICADOR AUTOMÁTICO');
    log(`Intervalo: ${INTERVALO / 1000} segundos`);
    log(`RESELLER_KEY: ${RESELLER_KEY ? 'Configurada' : 'NÃO CONFIGURADA!'}`);
    log('='.repeat(50));

    isRunning = true;

    verificar();

    intervalId = setInterval(verificar, INTERVALO);
}

export function stopServerVerificador(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning = false;
    log('Verificador parado');
}

export function isVerificadorRunning(): boolean {
    return isRunning;
}
