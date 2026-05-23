import { NextResponse } from 'next/server';
import { recordVisit } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { page, userId } = body;

        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || undefined;

        let locationData: any = {};

        if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '::1') {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query`, {
                    signal: AbortSignal.timeout(5000)
                });
                const geoData = await geoRes.json();

                if (geoData.status === 'success') {
                    locationData = {
                        country: geoData.country,
                        region: geoData.regionName,
                        city: geoData.city,
                        state: geoData.regionName
                    };
                }
            } catch (e) {

            }
        }

        try {
            recordVisit({
                userId,
                ip,
                page: page || '/',
                userAgent,
                ...locationData
            });
        } catch (dbError) {
            return NextResponse.json({ success: false, error: 'Erro ao salvar visita' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Track] Erro:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API de tracking funcionando',
        timestamp: new Date().toISOString()
    });
}
