import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbsDir = path.join(process.cwd(), 'dbs');
const contasPath = path.join(dbsDir, 'contas.json');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
}

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

function ensureDbsDir(): void {
    if (!fs.existsSync(dbsDir)) {
        fs.mkdirSync(dbsDir, { recursive: true });
    }
}

function loadJsonFile<T>(filePath: string, defaultValue: T): T {
    ensureDbsDir();
    try {
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return defaultValue;
    }
}

function saveJsonFile<T>(filePath: string, data: T): void {
    ensureDbsDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid } = body;

        if (!uid) {
            return NextResponse.json({
                success: false,
                error: 'UID é obrigatório'
            }, { status: 400 });
        }

        const contasSemDimas = loadJsonFile<ContaSemDima[]>(contasSemDimasPath, []);
        const contaIndex = contasSemDimas.findIndex(c => c.uid === uid);

        if (contaIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Conta não encontrada em contas sem dimas'
            }, { status: 404 });
        }

        const conta = contasSemDimas[contaIndex];

        const contas = loadJsonFile<GarenaAccount[]>(contasPath, []);

        const existingIndex = contas.findIndex(c => c.uid === uid);
        if (existingIndex !== -1) {

            contas[existingIndex].password = conta.password;
            contas[existingIndex].status = 'ACTIVE';
            contas[existingIndex].updatedAt = new Date().toISOString();
        } else {

            contas.push({
                uid: conta.uid,
                password: conta.password,
                diamonds: 0,
                passes: 0,
                presentesSentToday: 0,
                status: 'ACTIVE',
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        contasSemDimas.splice(contaIndex, 1);

        saveJsonFile(contasPath, contas);
        saveJsonFile(contasSemDimasPath, contasSemDimas);

        return NextResponse.json({
            success: true,
            message: `Conta ${uid} restaurada com sucesso`
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Erro ao restaurar conta'
        }, { status: 500 });
    }
}
