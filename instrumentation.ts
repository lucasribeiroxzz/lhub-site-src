export async function register() {

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Servidor Next.js iniciado');

        const { startServerVerificador } = await import('./lib/server-verificador');
        startServerVerificador();

        const { startTokenVerificador } = await import('./lib/token-verificador');
        startTokenVerificador();

        const { startLikesDeliverySystem } = await import('./lib/likes-delivery-system');

        setTimeout(() => {
            console.log('[Instrumentation] Iniciando sistema de entrega de likes...');
            startLikesDeliverySystem();
        }, 15000);

        const { startDiscordStatus } = await import('./lib/discord-status');

        setTimeout(() => {
            console.log('[Instrumentation] Iniciando webhook de status do Discord...');
            startDiscordStatus();
        }, 10000);
    }
}
