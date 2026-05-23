"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen relative overflow-hidden text-neutral-200 font-sans selection:bg-purple-500/30">

            {}
            <div className="fixed inset-0 z-0 bg-transparent">
                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {}
                <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/20">
                                A
                            </div>
                            <span className="font-bold text-white tracking-tight">Admin<span className="text-purple-500">Panel</span></span>
                        </div>

                        <nav className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                                Voltar para Loja
                            </Link>
                            <button className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                                <LogOut size={16} />
                                Sair
                            </button>
                        </nav>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
