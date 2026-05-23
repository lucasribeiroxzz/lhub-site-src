import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbsDir = path.join(process.cwd(), 'dbs');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
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

export async function GET() {
    try {
        const contas = loadContasSemDimas();
        
        return NextResponse.json({
            success: true,
            data: contas,
            total: contas.length
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Erro ao carregar contas sem dimas'
        }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        if (!fs.existsSync(dbsDir)) {
            fs.mkdirSync(dbsDir, { recursive: true });
        }
        fs.writeFileSync(contasSemDimasPath, '[]');
        
        return NextResponse.json({
            success: true,
            message: 'Todas as contas sem dimas foram removidas'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Erro ao limpar contas sem dimas'
        }, { status: 500 });
    }
}
