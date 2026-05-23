import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

function formatExpiration(expirationStr: string): string {
    try {
        const date = new Date(expirationStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return expirationStr;
    }
}

function calculateHoursLeft(expirationStr: string): number {
    try {
        const expiration = new Date(expirationStr);
        const now = new Date();
        const diffMs = expiration.getTime() - now.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    } catch {
        return 0;
    }
}

function isActive(expirationStr: string): boolean {
    try {
        const expiration = new Date(expirationStr);
        return expiration > new Date();
    } catch {
        return false;
    }
}

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    console.log('[Bypass API] Verificando admin_token:', token ? 'Encontrado' : 'Não encontrado');
    
    if (!token) return false;
    
    try {
        const payload = await verifyToken(token);
        if (!payload) return false;
        const isAdmin = (payload as any).role === 'ADMIN';
        console.log('[Bypass API] Payload verificado, isAdmin:', isAdmin);
        return isAdmin;
    } catch (e) {
        console.error('[Bypass API] Erro ao verificar token:', e);
        return false;
    }
}

export async function GET(request: NextRequest) {
    console.log('[Bypass API] ========== INÍCIO DA REQUISIÇÃO ==========');
    
    try {
        const isAdmin = await checkAdminAuth();
        
        if (!isAdmin) {
            console.log('[Bypass API] Erro: Não autorizado');
            return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        

        const secret = process.env.BYPASS_API_SECRET || 'rodolfoaviaochavoso007';
        const baseUrl = process.env.BYPASS_API_BASE_URL || 'http://45.126.209.85:5001';

        console.log(`[Bypass API] Action: ${action}`);
        console.log(`[Bypass API] BaseURL: ${baseUrl}`);

        if (action === 'list') {
            const apiUrl = `${baseUrl}/list?secret=${secret}`;
            console.log(`[Bypass API] Fazendo requisição para: ${apiUrl}`);
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store'
                });
                
                console.log(`[Bypass API] Status da resposta: ${response.status}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Bypass API] Erro na resposta: ${response.status} - ${errorText}`);
                    return NextResponse.json({ 
                        success: false, 
                        message: `Erro ao conectar com API externa: ${response.status}`,
                        error: errorText
                    }, { status: 500 });
                }

                const data = await response.json();
                console.log('[Bypass API] Dados recebidos, count:', data.count);
                

                const processedUids = (data.uids || []).map((uid: any) => ({
                    uid: uid.uid,
                    days_left: uid.days_left || 0,
                    hours_left: calculateHoursLeft(uid.expiration),
                    expiration: uid.expiration,
                    expiration_formatted: formatExpiration(uid.expiration),
                    active: isActive(uid.expiration)
                }));

                console.log(`[Bypass API] Total de UIDs processados: ${processedUids.length}`);

                return NextResponse.json({ 
                    success: true, 
                    data: {
                        status: data.status,
                        count: data.count || processedUids.length,
                        uids: processedUids
                    }
                });
                
            } catch (fetchError: any) {
                console.error('[Bypass API] Erro ao buscar lista:', fetchError);
                return NextResponse.json({ 
                    success: false, 
                    message: 'Erro ao conectar com a API de bypass',
                    error: fetchError?.message || 'Erro desconhecido'
                }, { status: 500 });
            }
        }

        if (action === 'stats') {
            const apiUrl = `${baseUrl}/stats?secret=${secret}`;
            console.log(`[Bypass API] Fazendo requisição stats para: ${apiUrl}`);
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    cache: 'no-store'
                });
                
                console.log(`[Bypass API] Status da resposta stats: ${response.status}`);
                
                if (!response.ok) {
                    console.error(`[Bypass API] Erro na resposta stats: ${response.status}`);
                    return NextResponse.json({ 
                        success: false, 
                        message: `Erro ao conectar com API externa: ${response.status}` 
                    }, { status: 500 });
                }

                const data = await response.json();
                console.log('[Bypass API] Stats recebidos:', data);
                
                return NextResponse.json({ 
                    success: true, 
                    data: {
                        total_uids: data.total_uids || 0,
                        active_uids: data.active_uids || 0,
                        expired_uids: data.expired_uids || 0
                    }
                });
            } catch (fetchError: any) {
                console.error('[Bypass API] Erro ao buscar stats:', fetchError);
                return NextResponse.json({ 
                    success: false, 
                    message: 'Erro ao conectar com a API de bypass',
                    error: fetchError?.message
                }, { status: 500 });
            }
        }

        console.log('[Bypass API] Ação inválida:', action);
        return NextResponse.json({ success: false, message: 'Ação inválida' }, { status: 400 });
        
    } catch (error: any) {
        console.error('[Bypass API] Erro geral:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro ao processar requisição',
            error: error?.message
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    console.log('[Bypass API DELETE] Iniciando remoção de UID');
    
    try {
        const isAdmin = await checkAdminAuth();
        
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { uid } = body;
        
        console.log('[Bypass API DELETE] UID recebido:', uid);

        if (!uid) {
            return NextResponse.json({ success: false, message: 'UID é obrigatório' }, { status: 400 });
        }

        const secret = process.env.BYPASS_API_SECRET || 'rodolfoaviaochavoso007';
        const baseUrl = process.env.BYPASS_API_BASE_URL || 'http://45.126.209.85:5001';
        const apiUrl = `${baseUrl}/remove?secret=${secret}&uid=${uid}`;

        console.log(`[Bypass API DELETE] Fazendo requisição para: ${apiUrl}`);

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });
            
            const data = await response.json();
            console.log('[Bypass API DELETE] Resposta da remoção:', data);

            if (data.status === 'success') {
                return NextResponse.json({ success: true, message: `UID ${uid} removido com sucesso` });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    message: data.message || 'Erro ao remover UID' 
                }, { status: 400 });
            }
        } catch (fetchError: any) {
            console.error('[Bypass API DELETE] Erro ao remover:', fetchError);
            return NextResponse.json({ 
                success: false, 
                message: 'Erro ao conectar com a API de bypass',
                error: fetchError?.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[Bypass API DELETE] Erro geral:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro ao remover bypass',
            error: error?.message
        }, { status: 500 });
    }
}
