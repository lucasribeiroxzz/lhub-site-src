"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Sparkles, ArrowRight, Shield, Zap } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState("");
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [formData, setFormData] = useState({ email: "", password: "" });

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const checkExistingSession = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const discordError = urlParams.get('error');
                if (discordError === 'discord_not_linked') {
                    setError('Sua conta Discord não está vinculada. Cadastre-se com email e senha, depois conecte seu Discord na página de Perfil.');
                } else if (discordError === 'discord_denied') {
                    setError('Você cancelou o login com Discord.');
                } else if (discordError === 'discord_failed') {
                    setError('Erro ao fazer login com Discord. Tente novamente.');
                }

                const hasSessionCookie = document.cookie
                    .split('; ')
                    .some(row => row.startsWith('user_session=') || row.startsWith('user_token='));

                if (hasSessionCookie) {
                    const res = await fetch('/api/auth/me', { credentials: 'include', signal: controller.signal });
                    if (res.ok && isMounted) { router.push('/dashboard'); return; }
                }
            } catch (e) {
                if (e instanceof Error && e.name !== 'AbortError') console.error('Erro ao verificar sessão:', e);
            } finally {
                clearTimeout(timeoutId);
                if (isMounted) setCheckingSession(false);
            }
        };

        checkExistingSession();
        return () => { isMounted = false; controller.abort(); clearTimeout(timeoutId); };
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let captchaToken = token;
            if (!captchaToken) captchaToken = recaptchaRef.current?.getValue() || null;
            if (!captchaToken) { setError("Por favor, resolva o captcha"); setLoading(false); return; }

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password, captchaToken }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('user_session='));
                if (sessionCookie) {
                    try {
                        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
                        localStorage.setItem("user_session", JSON.stringify(sessionData));
                        window.dispatchEvent(new Event("storage"));
                    } catch (e) { console.error('Erro ao parsear sessao:', e); }
                }
                window.location.href = "/dashboard";
            } else {
                const errorMap: Record<string, string> = {
                    "Captcha verification failed": "Falha na verificação do captcha. Tente novamente.",
                    "Invalid credentials": "Email ou senha incorretos.",
                    "Invalid email format": "Formato de email inválido.",
                    "Invalid password format": "Formato de senha inválido (mínimo 6 caracteres).",
                    "Please complete the captcha": "Por favor, resolva o captcha.",
                };
                setError(errorMap[data.error] || data.error || "Credenciais inválidas");
                recaptchaRef.current?.reset();
                setToken(null);
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Erro ao conectar. Tente novamente.");
            recaptchaRef.current?.reset();
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                        <Sparkles className="w-4 h-4 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-neutral-400 text-xs">Verificando sessão...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen min-h-[100dvh] flex relative overflow-hidden bg-black">
            {}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-float-slow" />
                    <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] bg-violet-500/15 blur-[120px] rounded-full" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

                <div className="relative z-10 max-w-sm text-center">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                        <img src="/lhub-logo.png" alt="LHUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-purple-500/30" />
                        <span className="text-2xl font-black text-shimmer">LHUB</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-3">Bem-vindo de volta!</h1>
                    <p className="text-neutral-400 text-sm mb-8">Sua loja de serviços digitais para jogadores exigentes.</p>

                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-xs">Entrega Automática</h3>
                                <p className="text-neutral-500 text-[11px]">Produtos entregues em segundos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-xs">100% Seguro</h3>
                                <p className="text-neutral-500 text-[11px]">Seus dados estão protegidos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10">
                <div className="absolute inset-0 z-0 pointer-events-none lg:hidden">
                    <div className="absolute top-[-25%] left-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[100px] rounded-full" />
                </div>

                <div className="w-full max-w-sm z-10">
                    {}
                    <div className="text-center mb-5 lg:hidden">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <img src="/lhub-logo.png" alt="LHUB Logo" className="w-7 h-7 rounded-lg object-cover" />
                            <span className="text-xl font-black text-shimmer">LHUB</span>
                        </Link>
                    </div>

                    {}
                    <div className="bg-neutral-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-purple-500/5">
                        <div className="text-center mb-5">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Entrar</h2>
                            <p className="text-neutral-400 text-xs">Acesse sua conta para continuar</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">E-mail</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
                                    <input type="email" placeholder="seu@email.com" value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
                                    <input type="password" placeholder="••••••••" value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} required
                                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            <div className="flex justify-center [&>div]:!transform-none [&>div]:!-webkit-transform-none">
                                <ReCAPTCHA ref={recaptchaRef}
                                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                    onChange={(token) => setToken(token)} theme="dark" size="normal"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2.5 rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] text-sm">
                                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>) : (<>Entrar<ArrowRight className="w-4 h-4" /></>)}
                            </button>
                        </form>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="px-3 bg-neutral-900/70 text-neutral-500">ou continue com</span>
                            </div>
                        </div>

                        <a href="/api/auth/discord" className="block mb-3">
                            <button type="button" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 text-sm">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                Entrar com Discord
                            </button>
                        </a>

                        <Link href="/register" className="block">
                            <button className="w-full border border-neutral-700 hover:border-purple-500/50 text-neutral-300 hover:text-white font-medium py-2.5 rounded-xl transition-all hover:bg-purple-500/5 text-sm">
                                Criar nova conta
                            </button>
                        </Link>
                    </div>

                    <p className="text-center text-neutral-600 text-[10px] mt-4">
                        © 2026 LHUB. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </main>
    );
}
