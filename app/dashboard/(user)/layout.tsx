"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Wallet, History, LogOut, Menu, X, Code, Home, Instagram, Send, Gift, Sun, Moon, Sunrise, Sunset, User, ShieldOff } from "lucide-react";
import DiscordPopup from "@/components/DiscordPopup";
import NotificationBell from "@/components/NotificationBell";

const PlayStoreIcon = ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
    </svg>
);

function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

function getGreeting(): { text: string; emoji: string; icon: any } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return { text: "Bom dia", emoji: "☀️", icon: Sunrise };
    } else if (hour >= 12 && hour < 18) {
        return { text: "Boa tarde", emoji: "🌤️", icon: Sun };
    } else if (hour >= 18 && hour < 22) {
        return { text: "Boa noite", emoji: "🌆", icon: Sunset };
    } else {
        return { text: "Boa noite", emoji: "🌙", icon: Moon };
    }
}

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [username, setUsername] = useState("Usuário");
    const [balance, setBalance] = useState(0);
    const [greeting, setGreeting] = useState(getGreeting());
    const [isBanned, setIsBanned] = useState(false);

    const fetchUserData = async () => {
        try {
            const res = await fetch("/api/auth/profile");
            const json = await res.json();

            if (json.success && json.data) {
                const { decryptData } = await import('@/lib/crypto');
                const data = decryptData(json.data);
                if (data) {
                    if (data.name) setUsername(data.name);
                    if (data.balance !== undefined) setBalance(data.balance);
                    fetchBalance();
                }
            } else {
                handleLogout();
            }
        } catch (e) {
            console.error("Failed to fetch user data", e);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await fetch("/api/user/me");
            const data = await res.json();
            if (data.success && data.data) {
                if (data.data.balance !== undefined) {
                    setBalance(data.data.balance);
                }
                if (data.data.banned === true) {
                    setIsBanned(true);
                }
            }
        } catch (e) { }
    }

    const handleLogout = () => {
        document.cookie = "user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        localStorage.removeItem("user_session");
        window.location.href = "/login";
    };

    useEffect(() => {
        const checkSession = () => {
            const local = localStorage.getItem("user_session");
            if (local) {
                try {
                    const session = JSON.parse(local);
                    if (session.name) setUsername(session.name);
                } catch (e) { }
            }
        };
        checkSession();
        fetchUserData();

        window.addEventListener('storage', checkSession);
        window.addEventListener('balance_update', fetchUserData);

        return () => {
            window.removeEventListener('storage', checkSession);
            window.removeEventListener('balance_update', fetchUserData);
        };
    }, []);

    const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=space.manus.lhub.forn.app.t20260212171412&pcampaignid=web_share";

    const navItems = [
        { name: "Loja", href: "/dashboard", icon: ShoppingBag },
        { name: "Recargas", href: "/dashboard/recargas", icon: Wallet },
        { name: "Histórico", href: "/dashboard/historico", icon: History },
        { name: "Afiliados", href: "/dashboard/afiliados", icon: Gift },
        { name: "API", href: "/dashboard/api", icon: Code },
        { name: "Perfil", href: "/dashboard/perfil", icon: User },
        { name: "Aplicativo", href: PLAYSTORE_URL, icon: PlayStoreIcon, external: true },
    ];

    return (
        <div className="min-h-screen relative flex flex-col md:flex-row bg-black">
            {}
            {isBanned && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
                    <div className="bg-neutral-900 border border-red-500/30 rounded-2xl p-8 md:p-12 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldOff size={40} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Conta Suspensa</h2>
                        <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-6">
                            Sua conta foi suspensa permanentemente por violação dos nossos termos de uso.
                            Você não pode mais utilizar os serviços da plataforma.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                            <p className="text-red-400 text-sm">
                                Se você acredita que houve um erro, entre em contato pelo nosso Discord.
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all border border-red-500/30"
                        >
                            <LogOut size={20} />
                            Sair da Conta
                        </button>
                    </div>
                </div>
            )}
            {}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-25%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 blur-[100px] rounded-full" />
            </div>

            {}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-lg border-b border-white/10">
                <Link href="/dashboard" className="font-bold text-xl bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    LHUB
                </Link>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <span className="text-green-400 font-mono text-sm bg-green-500/10 px-2 py-1 rounded-lg">
                        R$ {balance.toFixed(2)}
                    </span>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </header>

            {}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-50 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {}
            <aside className={classNames(
                "fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 bg-neutral-950/95 md:bg-transparent backdrop-blur-xl",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-4 md:p-4 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                    {}
                    <div className="flex justify-between items-center mb-6 px-2 pt-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                            LHUB
                        </h1>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {}
                    <div className="md:hidden mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{greeting.emoji}</span>
                            <span className="text-purple-300 text-sm font-medium">{greeting.text}, {username}!</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold">{username.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="text-white font-semibold">{username}</span>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                                <span className="text-green-400 font-mono text-sm font-bold">R$ {balance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {}
                    <nav className="space-y-2 flex-1">
                        {navItems.map((item) => {
                            const isActive = !item.external && pathname === item.href;
                            const linkClass = classNames(
                                "flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                            );
                            return item.external ? (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={linkClass}
                                >
                                    <item.icon size={22} />
                                    <span className="font-medium text-base">{item.name}</span>
                                </a>
                            ) : (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={linkClass}
                                >
                                    <item.icon size={22} />
                                    <span className="font-medium text-base">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {}
                    <div className="mt-auto pt-4 border-t border-white/10">
                        {}
                        <div className="hidden md:block mb-3">
                            <div className="flex items-center gap-2 px-2 mb-2">
                                <span className="text-base">{greeting.emoji}</span>
                                <span className="text-purple-300 text-sm">{greeting.text}, <span className="text-white font-semibold">{username}</span>!</span>
                            </div>
                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                                    <span className="text-white font-bold">{username.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-neutral-400">Saldo disponível</p>
                                    <p className="text-green-400 font-mono font-bold">R$ {balance.toFixed(2)}</p>
                                </div>
                                <NotificationBell />
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-xl border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sair da Conta</span>
                        </button>
                    </div>
                </div>
            </aside>

            {}
            <main className="flex-1 z-10 min-h-screen pt-16 md:pt-0 pb-4 px-3 md:p-4">
                <div className="h-full md:h-auto md:min-h-[calc(100vh-2rem)] bg-neutral-900/50 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/5 flex flex-col">
                    <div className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1" style={{ transform: 'none' }}>
                        {children}
                    </div>

                    {}
                    <footer className="hidden md:block border-t border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <p className="text-neutral-500 text-sm">© 2025 LHUB. Todos os direitos reservados.</p>
                            <div className="flex items-center gap-4">
                                <a
                                    href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/lhubofc'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-purple-400 transition-colors"
                                >
                                    <Instagram size={20} />
                                </a>
                                <a
                                    href={process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/lhubff'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-blue-400 transition-colors"
                                >
                                    <Send size={20} />
                                </a>
                                <a
                                    href={PLAYSTORE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-green-400 transition-colors"
                                >
                                    <PlayStoreIcon size={20} />
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            {}
            <DiscordPopup />

            {}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-white/10 px-2 py-2 safe-area-pb">
                <div className="flex justify-around items-center">
                    {navItems.filter(item => !item.external).slice(0, 5).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={classNames(
                                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                                    isActive
                                        ? "text-purple-400"
                                        : "text-neutral-500"
                                )}
                            >
                                <item.icon size={20} />
                                <span className="text-[9px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {}
            <div id="modal-root" />
        </div>
    );
}
