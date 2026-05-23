const DEBUG_MODE = process.env.NODE_ENV === 'development' && process.env.DEBUG_MODE === 'true';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
    module: string;
    level?: LogLevel;
}

const colors = {
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    debug: '\x1b[90m',
    reset: '\x1b[0m'
};

export function createLogger(module: string) {
    const prefix = `[${module}]`;

    return {
        info: (message: string, data?: any) => {
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.log(`${colors.info}${timestamp} ${prefix}${colors.reset} ${message}`, data !== undefined ? data : '');
        },

        warn: (message: string, data?: any) => {
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.warn(`${colors.warn}${timestamp} ${prefix} ⚠️${colors.reset} ${message}`, data !== undefined ? data : '');
        },

        error: (message: string, data?: any) => {
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.error(`${colors.error}${timestamp} ${prefix} ❌${colors.reset} ${message}`, data !== undefined ? data : '');
        },

        debug: (message: string, data?: any) => {
            if (!DEBUG_MODE) return;
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.log(`${colors.debug}${timestamp} ${prefix} 🔍${colors.reset} ${message}`, data !== undefined ? data : '');
        },

        success: (message: string, data?: any) => {
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            console.log(`\x1b[32m${timestamp} ${prefix} ✅\x1b[0m ${message}`, data !== undefined ? data : '');
        }
    };
}

export function log(module: string, message: string, data?: any) {
    if (!DEBUG_MODE && !message.includes('Error') && !message.includes('Sucesso')) return;
    console.log(`[${module}] ${message}`, data !== undefined ? data : '');
}

export default createLogger;
