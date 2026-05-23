"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                body: JSON.stringify({ email, code }),
            });

            if (res.ok) {
                router.push("/login");
            } else {
                setError("Código inválido. Tente novamente.");
            }
        } catch (error) {
            setError("Erro ao verificar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md z-10">
            {}
            <div className="text-center mb-8">
                <Link href="/" className="inline-block">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                        LHUB
                    </h1>
                </Link>
            </div>

            {}
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center">
                {}
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    Verifique seu E-mail
                </h2>
                <p className="text-neutral-400 text-sm mb-6">
                    Enviamos um código de verificação para{" "}
                    <span className="text-purple-400 font-medium">{email}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-neutral-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <p className="text-neutral-500 text-xs mt-2">
                            Digite o código de 6 dígitos
                        </p>
                    </div>

                    {}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {}
                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            'Verificar Conta'
                        )}
                    </button>
                </form>

                {}
                <p className="text-neutral-500 text-sm mt-6">
                    Não recebeu o código?{" "}
                    <button className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Reenviar
                    </button>
                </p>
            </div>

            {}
            <p className="text-center text-neutral-600 text-xs mt-6">
                © 2025 LHUB. Todos os direitos reservados.
            </p>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
            {}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-25%] left-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[100px] rounded-full" />
            </div>

            <Suspense fallback={
                <div className="text-white flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Carregando...
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </main>
    );
}
