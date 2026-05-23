import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');
const dbsDir = path.join(process.cwd(), 'dbs');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');

if (!fs.existsSync(dbsDir)) {
    fs.mkdirSync(dbsDir, { recursive: true });
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

let contasSemDimas: any[] = [];
if (fs.existsSync(contasSemDimasPath)) {
    contasSemDimas = JSON.parse(fs.readFileSync(contasSemDimasPath, 'utf-8'));
}

const contasSemDimasUids = new Set(contasSemDimas.map(c => c.uid));

const contasComDimas: any[] = [];
const contasParaMover: any[] = [];

for (const conta of db.garenaAccounts || []) {
    if (conta.diamonds === 0 && conta.passes === 0) {

        if (!contasSemDimasUids.has(conta.uid)) {
            contasParaMover.push({
                uid: conta.uid,
                password: conta.password || '',
                movedAt: new Date().toISOString(),
                lastDiamonds: conta.diamonds,
                lastPasses: conta.passes
            });
            console.log(`Movendo conta ${conta.uid} para contas_semdimas.json`);
        }
    } else {
        contasComDimas.push(conta);
    }
}

db.garenaAccounts = contasComDimas;

const totalPasses = contasComDimas.reduce((sum, c) => sum + (c.passes || 0), 0);
const passeIndex = db.products?.findIndex((p: any) => p.type === 'PASSE' || p.id?.toLowerCase().includes('passe'));
if (passeIndex !== undefined && passeIndex !== -1) {
    db.products[passeIndex].stock = totalPasses;
    db.products[passeIndex].updatedAt = new Date().toISOString();
    console.log(`Estoque de passes atualizado para: ${totalPasses}`);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`db.json salvo com ${contasComDimas.length} contas`);

if (contasParaMover.length > 0) {
    contasSemDimas.push(...contasParaMover);
    fs.writeFileSync(contasSemDimasPath, JSON.stringify(contasSemDimas, null, 2));
    console.log(`${contasParaMover.length} contas movidas para contas_semdimas.json`);
}

console.log('\\n=== RESUMO ===');
console.log(`Contas ativas: ${contasComDimas.length}`);
console.log(`Contas sem dimas: ${contasSemDimas.length}`);
console.log(`Total passes disponíveis: ${totalPasses}`);
