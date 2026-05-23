"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, User, Loader2, Gift, Sparkles, ArrowRight, Shield, Zap, CheckCircle } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const checkExistingSession = async () => {
            try {
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

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) setReferralCode(ref);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!token) { setError("Por favor, resolva o captcha"); return; }
        if (formData.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres"); return; }
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ ...formData, captchaToken: token, referralCode }),
            });
            const data = await res.json();
            if (res.ok) { window.location.href = "/dashboard"; }
            else { setError(data.error || "Erro ao criar conta"); recaptchaRef.current?.reset(); setToken(null); }
        } catch (error) {
            setError("Erro ao conectar. Tente novamente.");
            recaptchaRef.current?.reset();
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10">
                <div className="flex items-center gap-3 text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Verificando sessão...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <div className="absolute inset-0 z-0 pointer-events-none lg:hidden">
                <div className="absolute top-[-25%] right-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[100px] rounded-full" />
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
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Criar Conta</h2>
                        <p className="text-neutral-400 text-xs">Junte-se a milhares de jogadores</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
                                <input type="text" placeholder="Seu username" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

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
                                <input type="password" placeholder="Mínimo 6 caracteres" value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                                Código de Afiliado <span className="text-neutral-500 font-normal">(opcional)</span>
                            </label>
                            <div className="relative group">
                                <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
                                <input type="text" placeholder="Ex: ABC123" value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all uppercase"
                                />
                            </div>
                            {referralCode && (
                                <p className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1">
                                    <CheckCircle size={10} /> Código de afiliado aplicado!
                                </p>
                            )}
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
                            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</>) : (<>Criar Conta<ArrowRight className="w-4 h-4" /></>)}
                        </button>
                    </form>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="px-3 bg-neutral-900/70 text-neutral-500">ou</span>
                        </div>
                    </div>

                    <Link href="/login" className="block">
                        <button className="w-full border border-neutral-700 hover:border-purple-500/50 text-neutral-300 hover:text-white font-medium py-2.5 rounded-xl transition-all hover:bg-purple-500/5 text-sm">
                            Já tenho uma conta
                        </button>
                    </Link>
                </div>

                <p className="text-center text-neutral-600 text-[10px] mt-4">
                    © 2026 LHUB. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}

function RegisterLoading() {
    return (
        <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <Sparkles className="w-4 h-4 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-neutral-400 text-xs">Carregando...</p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen min-h-[100dvh] flex relative overflow-hidden bg-black">
            {}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-10">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[20%] right-[10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-float-slow" />
                    <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] bg-violet-500/15 blur-[120px] rounded-full" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

                <div className="relative z-10 max-w-sm text-center">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                        <img src="/lhub-logo.png" alt="LHUB Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-purple-500/30" />
                        <span className="text-2xl font-black text-shimmer">LHUB</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-3">Crie sua conta grátis</h1>
                    <p className="text-neutral-400 text-sm mb-8">Tenha acesso a todos os nossos produtos e serviços.</p>

                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-xs">Entrega Instantânea</h3>
                                <p className="text-neutral-500 text-[11px]">Receba seus produtos em segundos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-xs">Pagamento Seguro</h3>
                                <p className="text-neutral-500 text-[11px]">PIX com proteção total</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 flex-shrink-0">
                                <Gift size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-xs">Programa de Afiliados</h3>
                                <p className="text-neutral-500 text-[11px]">Ganhe dinheiro indicando amigos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <Suspense fallback={<RegisterLoading />}>
                <RegisterForm />
            </Suspense>
        </main>
    );
}
