import fs from 'fs';
import path from 'path';

const TOKEN_RESELLER_KEY = process.env.TOKEN_RESELLER_KEY || 'lucassxamigo777';
const TOKEN_API_BASE = process.env.TOKEN_API_BASE || 'https://blnhubtokens-freefire.shardweb.app';
const INTERVALO = 30000;

const dbsDir = path.join(process.cwd(), 'dbs');
const tokenAccountsPath = path.join(dbsDir, 'token_accounts.json');
const productsPath = path.join(dbsDir, 'products.json');

interface TokenAccount {
    uid: string;
    password: string;
    diamonds: number;
    caixas: number;
    presentesSentToday: number;
    status: string;
    addedAt?: string;
    updatedAt?: string;
    lastCheck?: string;
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
    console.log(`[${timestamp}] [TokenVerify] ${msg}`);
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

async function verificarTokens(): Promise<void> {
    if (!TOKEN_RESELLER_KEY) {
        log('TOKEN_RESELLER_KEY não configurada!');
        return;
    }

    try {

        const contas = loadJsonFile<TokenAccount[]>(tokenAccountsPath, []);
        const products = loadJsonFile<Product[]>(productsPath, []);

        const url = `${TOKEN_API_BASE}/api/contas/verificar?reseller_key=${TOKEN_RESELLER_KEY}`;
        log(`[DEBUG] Chamando API: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        log(`[DEBUG] Status: ${response.status}`);

        const contentType = response.headers.get('content-type');
        log(`[DEBUG] Content-Type: ${contentType}`);

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            log(`[DEBUG] Resposta não-JSON: ${text.slice(0, 500)}`);
            return;
        }

        const data = await response.json();
        log(`[DEBUG] Resposta JSON: ${JSON.stringify(data).slice(0, 1000)}`);

        if (!response.ok) {
            log(`API retornou erro: ${data.status || data.message || 'Erro desconhecido'}`);
            

            const tokenIndex = products.findIndex((p: any) =>
                p.type === 'TOKEN' || p.id?.toLowerCase().includes('token')
            );
            if (tokenIndex !== -1) {
                products[tokenIndex].stock = 0;
                products[tokenIndex].updatedAt = new Date().toISOString();
                saveJsonFile(productsPath, products);
            }
            return;
        }

        const passwordMap = new Map<string, string>();
        for (const conta of contas) {
            if (conta.password) {
                passwordMap.set(conta.uid, conta.password);
            }
        }

        const novasContas: TokenAccount[] = [];
        let totalCaixas = 0;
        let totalDiamantes = 0;

        if (data.contas && Array.isArray(data.contas)) {
            for (const contaApi of data.contas) {
                const uid = contaApi.uid;
                const diamonds = contaApi.diamonds || contaApi.diamantes || 0;
                const caixas = contaApi.caixas_disponiveis || contaApi.caixas || contaApi.tokens || contaApi.passes || 0;
                const presentesSentToday = contaApi.presentes_enviados_hoje || contaApi.presentesSentToday || 0;

                log(`[DEBUG] Conta: uid=${uid}, diamonds=${diamonds}, caixas=${caixas}`);

                novasContas.push({
                    uid: uid,
                    password: passwordMap.get(uid) || '',
                    diamonds: diamonds,
                    caixas: caixas,
                    presentesSentToday: presentesSentToday,
                    status: 'ACTIVE',
                    updatedAt: new Date().toISOString(),
                    lastCheck: new Date().toISOString()
                });

                totalCaixas += caixas;
                totalDiamantes += diamonds;
            }
        }

        const estoqueFromAPI = data.estatisticas?.total_caixas || 
            data.estatisticas?.total_tokens_disponiveis ||
            data.estatisticas?.total_caixas_disponiveis ||
            totalCaixas;

        saveJsonFile(tokenAccountsPath, novasContas);

        const tokenIndex = products.findIndex((p: any) =>
            p.type === 'TOKEN' || p.id?.toLowerCase().includes('token')
        );
        if (tokenIndex !== -1) {
            products[tokenIndex].stock = estoqueFromAPI;
            products[tokenIndex].updatedAt = new Date().toISOString();
            saveJsonFile(productsPath, products);
        }

        log(`✓ Contas: ${novasContas.length} | Caixas: ${estoqueFromAPI} | Diamantes: ${totalDiamantes}`);

    } catch (error: any) {
        log(`[DEBUG] Erro completo: ${error.stack || error.message || error}`);
        

        try {
            const products = loadJsonFile<Product[]>(productsPath, []);
            const tokenIndex = products.findIndex((p: any) =>
                p.type === 'TOKEN' || p.id?.toLowerCase().includes('token')
            );
            if (tokenIndex !== -1) {
                products[tokenIndex].stock = 0;
                products[tokenIndex].updatedAt = new Date().toISOString();
                saveJsonFile(productsPath, products);
            }
        } catch (saveError) {
            log(`Erro ao zerar estoque: ${saveError}`);
        }
    }
}

export function startTokenVerificador(): void {
    if (isRunning) {
        log('Verificador de Tokens já está rodando');
        return;
    }

    log('='.repeat(50));
    log('INICIANDO VERIFICADOR DE TOKENS');
    log(`Intervalo: ${INTERVALO / 1000} segundos`);
    log(`TOKEN_RESELLER_KEY: ${TOKEN_RESELLER_KEY ? 'Configurada' : 'NÃO CONFIGURADA!'}`);
    log('='.repeat(50));

    isRunning = true;

    verificarTokens();

    intervalId = setInterval(verificarTokens, INTERVALO);
}

export function stopTokenVerificador(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning = false;
    log('Verificador de Tokens parado');
}

export function isTokenVerificadorRunning(): boolean {
    return isRunning;
}
