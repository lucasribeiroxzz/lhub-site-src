"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 relative overflow-hidden">

      {}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-600/20 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-red-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[200px] rounded-full" />
      </div>

      {}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {}
      <div className={`relative z-10 w-full max-w-xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl text-center">

          {}
          <div className="mb-8">
            <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-purple-500/20">
              <Image
                src="/lhub-logo.png"
                alt="LHUB"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {}
          <div className="relative mb-6">
            <h1 className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-transparent select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center opacity-20 animate-pulse">
              <span className="text-8xl sm:text-9xl font-black tracking-tighter text-red-500 blur-sm">404</span>
            </div>
          </div>

          {}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>

          {}
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">
            Página não encontrada
          </h2>

          <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Ops! A página que você está procurando não existe, foi removida ou está temporariamente indisponível.
          </p>

          {}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
                <Home className="w-4 h-4" />
                Página inicial
              </button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-neutral-300 px-6 py-3.5 rounded-xl hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>

        {}
        <p className="mt-8 text-center text-neutral-600 text-xs">
          © 2026 LHUB • Serviços Digitais
        </p>
      </div>

      {}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
