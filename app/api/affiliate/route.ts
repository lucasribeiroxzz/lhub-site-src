import { NextRequest, NextResponse } from 'next/server';
import { getUserAffiliateCode, getAffiliatesByReferrer, getAffiliateStats, findUserByAffiliateCode, createAffiliateRelation, findUserByEmail } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

        const email = decoded.email as string;
        const user = findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
        }
        const userId = user.id;
        const affiliateCode = getUserAffiliateCode(userId);
        const affiliates = getAffiliatesByReferrer(userId);
        const stats = getAffiliateStats(userId);

        return NextResponse.json({ 
            success: true, 
            affiliateCode,
            affiliates: affiliates.map(a => ({
                email: a.referredEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
                hasRecharged: a.hasRecharged,
                rewardPaid: a.rewardPaid,
                createdAt: a.createdAt
            })),
            stats: {
                totalReferred: stats.totalInvites,
                totalRecharged: stats.rechargedCount,
                totalRewardsPaid: Math.floor(stats.totalEarned / 5),
                pendingRewards: stats.pendingReward
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, referredId, referredEmail } = body;

        if (!code || !referredId || !referredEmail) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
        }

        const referrer = findUserByAffiliateCode(code);
        if (!referrer) {
            return NextResponse.json({ success: false, error: 'Código de afiliado inválido' }, { status: 404 });
        }

        const affiliate = createAffiliateRelation(referrer.id, referredId, referredEmail);
        if (!affiliate) {
            return NextResponse.json({ success: false, error: 'Não foi possível criar relação de afiliado' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Código de afiliado aplicado!' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
