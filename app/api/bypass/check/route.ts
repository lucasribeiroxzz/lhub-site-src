import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ success: false, message: 'UID é obrigatório' }, { status: 400 });
        }

        if (!/^\d+$/.test(uid)) {
            return NextResponse.json({ success: false, message: 'UID deve conter apenas números' }, { status: 400 });
        }

        const checkUrl = process.env.BYPASS_CHECK_URL || 'http://45.126.209.85:5001/check';
        const secret = process.env.BYPASS_API_SECRET || '';

        const response = await fetch(`${checkUrl}?secret=${secret}&uid=${uid}`);
        const data = await response.json();

        if (data.status === 'success') {
            return NextResponse.json({
                success: true,
                exists: data.exists,
                active: data.active,
                uid: data.uid,
                daysLeft: data.days_left,
                hoursLeft: data.hours_left,
                expiration: data.expiration,
                expirationFormatted: data.expiration_formatted
            });
        } else {
            return NextResponse.json({
                success: true,
                exists: false,
                active: false,
                uid: uid,
                message: 'UID não encontrado no sistema'
            });
        }
    } catch (error) {
        console.error('Erro ao verificar bypass:', error);
        return NextResponse.json({ success: false, message: 'Erro ao verificar bypass' }, { status: 500 });
    }
}
