'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
    const [message, setMessage] = useState('Estamos em manutenção. Voltamos em breve!');

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await fetch('/api/maintenance');
                const data = await res.json();
                if (data.success && data.data) {
                    if (!data.data.maintenance) {

                        window.location.href = '/';
                    }
                    if (data.data.message) {
                        setMessage(data.data.message);
                    }
                }
            } catch (e) {
                console.error('Erro ao verificar manutenção:', e);
            }
        };

        checkMaintenance();
    }, []);

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-25%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {}
                <div className="w-24 h-24 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl">
                    🔧
                </div>

                {}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Em Manutenção
                </h1>

                {}
                <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                    {message}
                </p>

                {}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6">
                    <p className="text-neutral-300 text-sm mb-4">
                        Acompanhe nossas redes para novidades:
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/lhub'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                            </svg>
                            Instagram
                        </a>
                        <a
                            href={process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/lhub'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            Telegram
                        </a>
                    </div>
                </div>

                {}
                <p className="text-neutral-600 text-sm">
                    © 2025 <span className="text-purple-400 font-bold">LHUB</span>
                </p>
            </div>
        </main>
    );
}
