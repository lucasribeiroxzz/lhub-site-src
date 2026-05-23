"use client";

import { useEffect, useRef, useCallback } from 'react';

interface AutoVerifierProps {
    enabled: boolean;
    interval?: number;
    onVerify?: (data: any) => void;
    onError?: (error: string) => void;
}

export default function AutoVerifier({ 
    enabled, 
    interval = 50, 
    onVerify, 
    onError 
}: AutoVerifierProps) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isVerifyingRef = useRef(false);

    const verificarContas = useCallback(async () => {
        if (isVerifyingRef.current) {
            console.log('[AutoVerifier] Verificação já em andamento, pulando...');
            return;
        }

        isVerifyingRef.current = true;
        console.log('[AutoVerifier] Iniciando verificação automática...');

        try {
            const res = await fetch('/api/admin/accounts/verify', {
                method: 'POST'
            });

            if (res.ok) {
                const json = await res.json();
                console.log('[AutoVerifier] Verificação concluída:', json);
                
                if (onVerify) {
                    onVerify(json);
                }
            } else {
                const error = await res.text();
                console.error('[AutoVerifier] Erro na verificação:', error);
                if (onError) {
                    onError(error);
                }
            }
        } catch (error: any) {
            console.error('[AutoVerifier] Erro:', error);
            if (onError) {
                onError(error.message || 'Erro na verificação');
            }
        } finally {
            isVerifyingRef.current = false;
        }
    }, [onVerify, onError]);

    useEffect(() => {
        if (enabled) {
            console.log(`[AutoVerifier] Iniciando verificação automática a cada ${interval} segundos`);
            

            verificarContas();
            

            intervalRef.current = setInterval(verificarContas, interval * 1000);
        } else {
            console.log('[AutoVerifier] Verificação automática desabilitada');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, interval, verificarContas]);

    return null;
}
