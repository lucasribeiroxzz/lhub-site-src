import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';

const DISCORD_FEEDBACK_WEBHOOK = process.env.DISCORD_FEEDBACK_WEBHOOK_URL || 'https://discord.com/api/webhooks/1459567711813239090/z2XpnEA1hQwQdFJtPkPU2ypqZfOT_ZNoyteF-YqInuFrVGiOEV99lfVBP1DXkFBibWqo';

async function sendRatingToDiscord(data: {
    userName: string;
    productName: string;
    rating: number;
    feedback: string;
    transactionId: string;
}) {
    const stars = '⭐'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
    
    const ratingEmoji = data.rating >= 4 ? '🎉' : data.rating >= 3 ? '👍' : '😔';
    const ratingColor = data.rating >= 4 ? 0x22c55e : data.rating >= 3 ? 0xeab308 : 0xef4444;

    const fields: { name: string; value: string; inline: boolean }[] = [
        {
            name: '👤 Usuário',
            value: data.userName,
            inline: true
        },
        {
            name: '📦 Produto',
            value: data.productName,
            inline: true
        },
        {
            name: '⭐ Avaliação',
            value: `${stars}\n**${data.rating}/5 estrelas**`,
            inline: false
        }
    ];

    if (data.feedback && data.feedback.trim()) {
        fields.push({
            name: '💬 Feedback',
            value: data.feedback.length > 1000 ? data.feedback.substring(0, 997) + '...' : data.feedback,
            inline: false
        });
    }

    const embed = {
        title: `${ratingEmoji} Nova Avaliação Recebida!`,
        color: ratingColor,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
            text: '🚀 LHUB • Avaliações',
            icon_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg'
        }
    };

    try {
        console.log('[Rating] Enviando para webhook de FEEDBACKS:', DISCORD_FEEDBACK_WEBHOOK);
        
        const response = await fetch(DISCORD_FEEDBACK_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'LHUB Avaliações',
                avatar_url: 'https://i.ibb.co/xKKFRVTd/5116432151766305762.jpg',
                embeds: [embed]
            })
        });

        if (!response.ok) {
            console.error('[Rating] Erro na resposta:', response.status, await response.text());
        } else {
            console.log('[Rating] ✅ Avaliação enviada para webhook de FEEDBACKS com sucesso!');
        }
    } catch (error) {
        console.error('[Rating] Erro ao enviar para Discord:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('user_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
        }

        const userId = decoded.email as string;
        const body = await request.json();
        const { transactionId, rating, feedback, productName } = body;

        if (!transactionId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
        }

        const db = getDb();
        

        const transaction = db.transactions?.find(t => t.id === transactionId && t.userId === userId);
        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
        }

        if ((transaction as any).rated) {
            return NextResponse.json({ success: false, error: 'Transação já foi avaliada' }, { status: 400 });
        }

        const user = db.users.find(u => u.email === userId);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
        }

        const transIndex = db.transactions?.findIndex(t => t.id === transactionId);
        if (transIndex !== undefined && transIndex !== -1 && db.transactions) {
            (db.transactions[transIndex] as any).rated = true;
            (db.transactions[transIndex] as any).rating = rating;
            (db.transactions[transIndex] as any).feedback = feedback || '';
            (db.transactions[transIndex] as any).ratedAt = new Date().toISOString();
            saveDb(db);
        }

        await sendRatingToDiscord({
            userName: user.name,
            productName: productName || transaction.description || 'Produto',
            rating,
            feedback: feedback || '',
            transactionId
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Avaliação enviada com sucesso!' 
        });
    } catch (error) {
        console.error('[Rating] Erro:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('user_token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
        }

        const userId = decoded.email as string;
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');

        if (!transactionId) {
            return NextResponse.json({ success: false, error: 'ID da transação não fornecido' }, { status: 400 });
        }

        const db = getDb();
        const transaction = db.transactions?.find(t => t.id === transactionId && t.userId === userId);
        
        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            rated: (transaction as any).rated || false,
            rating: (transaction as any).rating || null
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
