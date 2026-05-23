import { NextResponse } from 'next/server';

export async function POST(req: Request) {

    const { uid } = await req.json();

    if (!uid) {
        return NextResponse.json({ success: false, message: 'UID requerido' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://freefireapis.shardweb.app/api/info_player?uid=${uid}&region=BR`);

        if (!response.ok) {

            return NextResponse.json({ success: false, message: 'Jogador não encontrado' });
        }

        const data = await response.json();

        if (data && data.basicInfo && data.basicInfo.nickname) {
            return NextResponse.json({
                success: true,
                data: {
                    nickname: data.basicInfo.nickname,

                    uid: data.basicInfo.accountId || uid,
                    level: data.basicInfo.level
                }
            });
        }

        return NextResponse.json({ success: false, message: 'Jogador não encontrado' });

    } catch (error) {
        console.error("API Error", error);
        return NextResponse.json({ success: false, message: 'Erro ao consultar API' }, { status: 500 });
    }
}
