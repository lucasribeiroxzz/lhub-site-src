'use client';

import Link from "next/link";
import Script from "next/script";
import { ShieldCheck, Zap, TrendingDown, ArrowRight, Star, Code, Heart, Gift, Users, Target, UserCheck, Gamepad2, Crown, Monitor, Sparkles, Package } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [stats, setStats] = useState({ totalUsers: 0, totalPassesSent: 0, totalTokensSent: 0, totalLikesSent: 0 });
  const [displayStats, setDisplayStats] = useState({ totalUsers: 0, totalPassesSent: 0, totalTokensSent: 0, totalLikesSent: 0 });
  const [loggedUser, setLoggedUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_session='));
        if (sessionCookie) {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          setLoggedUser(sessionData);
        }
      } catch (e) {
        console.error('Erro ao verificar sessão:', e);
      }
    };
    checkSession();

    const fetchData = async () => {
      try {
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const keys = ['totalUsers', 'totalPassesSent', 'totalTokensSent', 'totalLikesSent'] as const;
    const hasValues = keys.some(k => stats[k] > 0);
    if (!hasValues) return;

    const duration = 1500;
    const steps = 60;
    let current = { totalUsers: 0, totalPassesSent: 0, totalTokensSent: 0, totalLikesSent: 0 };

    const timer = setInterval(() => {
      let allDone = true;
      const next = { ...current };
      for (const key of keys) {
        const increment = stats[key] / steps;
        next[key] = current[key] + increment;
        if (next[key] >= stats[key]) {
          next[key] = stats[key];
        } else {
          allDone = false;
        }
      }
      current = next;
      setDisplayStats({
        totalUsers: Math.floor(next.totalUsers),
        totalPassesSent: Math.floor(next.totalPassesSent),
        totalTokensSent: Math.floor(next.totalTokensSent),
        totalLikesSent: Math.floor(next.totalLikesSent),
      });
      if (allDone) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats]);

  const staticProducts = [
    {
      id: 'passe', name: 'Passe de Elite', price: 'R$ 4,00',
      description: 'Entrega automática direto na sua conta Free Fire.',
      type: 'PASSE',
      badge: { text: 'MAIS VENDIDO', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
      iconBg: 'bg-purple-500/10 border-purple-500/30', iconColor: 'text-purple-400',
      icon: <Gift size={24} />
    },
    {
      id: 'diamonds', name: 'Diamantes', price: 'A partir de R$ 9,00',
      description: 'Diamantes Free Fire via Access Token.',
      type: 'DIAMONDS',
      badge: { text: 'NOVO', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
      iconBg: 'bg-blue-500/10 border-blue-500/30', iconColor: 'text-blue-400',
      icon: <Sparkles size={24} />
    },
    {
      id: 'token', name: 'Caixa Token', price: 'R$ 0,70/un',
      description: 'Caixa Token enviada direto na conta.',
      type: 'TOKEN', badge: null,
      iconBg: 'bg-yellow-500/10 border-yellow-500/30', iconColor: 'text-yellow-400',
      icon: <Package size={24} />
    },
    {
      id: 'likes', name: '100-250 Likes', price: 'R$ 0,90',
      description: 'Envia de 100 a 250 likes automaticamente.',
      type: 'LIKES', badge: null,
      iconBg: 'bg-pink-500/10 border-pink-500/30', iconColor: 'text-pink-400',
      icon: <Heart size={24} />
    },
    {
      id: 'guest', name: 'Conta Guest Nv15', price: 'R$ 0,70',
      description: 'Conta Guest UID:PASSWORD com troca de nick.',
      type: 'GUEST', badge: null,
      iconBg: 'bg-blue-500/10 border-blue-500/30', iconColor: 'text-blue-400',
      icon: <UserCheck size={24} />
    },
    {
      id: 'bypass', name: 'Bypass UID', price: 'R$ 20,00',
      description: 'Bypass para emulador — 30 dias de acesso.',
      type: 'BYPASS',
      badge: { text: 'EMULADOR', color: 'bg-gradient-to-r from-cyan-600 to-blue-600' },
      iconBg: 'bg-cyan-500/10 border-cyan-500/30', iconColor: 'text-cyan-400',
      icon: <ShieldCheck size={24} />
    },
    {
      id: 'cheat', name: 'Cheat External', price: 'A partir de R$ 8,00',
      description: 'Aimbot, Exploits e Visuals para emulador.',
      type: 'CHEAT',
      badge: { text: 'EMULADOR', color: 'bg-gradient-to-r from-orange-600 to-red-600' },
      iconBg: 'bg-orange-500/10 border-orange-500/30', iconColor: 'text-orange-400',
      icon: <Target size={24} />
    },
    {
      id: 'modapk', name: 'ModApk - Android', price: 'A partir de R$ 12,00',
      description: 'Mod completo para dispositivos Android.',
      type: 'MODAPK',
      badge: { text: 'ANDROID', color: 'bg-gradient-to-r from-green-600 to-emerald-600' },
      iconBg: 'bg-green-500/10 border-green-500/30', iconColor: 'text-green-400',
      icon: <Gamepad2 size={24} />
    },
    {
      id: 'streamings', name: 'Streamings', price: 'A partir de R$ 1,00',
      description: 'HBO, Prime Video, Disney+, Crunchyroll e mais.',
      type: 'STREAMING',
      badge: { text: 'NOVO', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
      iconBg: 'bg-purple-500/10 border-purple-500/30', iconColor: 'text-purple-400',
      icon: <Monitor size={24} />
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col font-sans selection:bg-purple-500/30">
      <Script src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" strategy="lazyOnload" />

      {}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[60%] h-[60%] bg-purple-600/20 blur-[180px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/15 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-fuchsia-600/10 blur-[120px] rounded-full animate-float-slow" style={{ animationDelay: '-4s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {}
      <nav className="fixed top-0 left-0 right-0 z-50 navbar-glass border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/lhub-logo.png" alt="LHUB Logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-lg md:text-xl font-bold text-shimmer">LHUB</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <a href="https://discord.gg/pwWBr3s83t" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-neutral-400 hover:text-purple-400 transition-all px-3 py-1.5 rounded-lg hover:bg-white/5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.094.246.194.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              Discord
            </a>
            {loggedUser ? (
              <Link href="/dashboard">
                <span className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/25">
                  <span className="hidden sm:inline">Olá,</span> {loggedUser.name.split(' ')[0]}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-xs md:text-sm font-medium text-neutral-400 hover:text-white transition-all px-3 py-1.5 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer">
                    Login
                  </span>
                </Link>
                <Link href="/register">
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/25">
                    Criar Conta
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 flex-1 flex flex-col items-center justify-center text-center pt-24 md:pt-28 pb-8 md:pb-12">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 text-purple-300 text-xs sm:text-sm font-medium mb-5 animate-slide-up">
          <Users size={14} className="text-purple-400" />
          <span className="text-white font-bold">{displayStats.totalUsers.toLocaleString('pt-BR')}</span>
          <span className="text-purple-300/80">usuários</span>
          <div className="w-px h-3.5 bg-purple-500/30" />
          <Crown size={12} className="text-purple-400" />
          <span className="tracking-wide uppercase text-[10px] sm:text-xs">Serviços Digitais</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight max-w-4xl mx-auto leading-[1.1] animate-slide-up-delay-2">
          Produtos digitais para{' '}
          <span className="text-shimmer">Free Fire</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed animate-slide-up-delay-3">
          Passe de Elite, Diamantes, Likes, Contas Guest, Bypass e Cheat.
          <span className="text-purple-400 font-medium"> Entrega automática</span> e suporte via Discord.
        </p>

        {}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mb-6 animate-slide-up-delay-3">
          <Link href="/register" className="flex-1 w-full">
            <span className="w-full h-12 text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]">
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <a href="https://discord.gg/pwWBr3s83t" target="_blank" rel="noopener noreferrer" className="flex-1 w-full">
            <span className="w-full h-12 text-sm font-medium text-neutral-300 hover:text-white transition-all border border-white/10 hover:border-purple-500/50 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-500/5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.094.246.194.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              Entrar no Discord
            </span>
          </a>
        </div>
      </section>

      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 pb-10 md:pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
          {[
            { label: 'Usuários', value: displayStats.totalUsers, icon: <Users size={18} />, iconBg: 'bg-purple-500/10', iconText: 'text-purple-400', hoverBorder: 'hover:border-purple-500/30' },
            { label: 'Passes Enviados', value: displayStats.totalPassesSent, icon: <Gift size={18} />, iconBg: 'bg-green-500/10', iconText: 'text-green-400', hoverBorder: 'hover:border-green-500/30' },
            { label: 'Tokens Enviados', value: displayStats.totalTokensSent, icon: <Package size={18} />, iconBg: 'bg-yellow-500/10', iconText: 'text-yellow-400', hoverBorder: 'hover:border-yellow-500/30' },
            { label: 'Likes Enviados', value: displayStats.totalLikesSent, icon: <Heart size={18} />, iconBg: 'bg-pink-500/10', iconText: 'text-pink-400', hoverBorder: 'hover:border-pink-500/30' },
          ].map((stat, i) => (
            <div key={i}
              className={`stat-card relative bg-neutral-900/60 border border-white/5 rounded-xl p-3 sm:p-4 text-center ${stat.hoverBorder} transition-all group`}
            >
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${stat.iconBg} ${stat.iconText} mb-2 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                {stat.value.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Nossos <span className="text-shimmer">Produtos</span>
          </h2>
          <p className="text-neutral-500 text-xs md:text-sm">Clique em um produto para ver mais detalhes</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
          {staticProducts.map((product, index) => (
            <Link href="/register" key={product.id}>
              <div
                className="product-card bg-neutral-900/60 border border-white/5 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl h-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {product.badge && (
                  <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${product.badge.color} text-white text-[8px] sm:text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold badge-featured`}>
                    {product.badge.text}
                  </div>
                )}

                <div className={`card-icon w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${product.iconBg} flex items-center justify-center mb-3 sm:mb-4 border transition-transform`}>
                  <div className={product.iconColor}>
                    {product.icon}
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">{product.name}</h3>
                <p className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-1.5 sm:mb-2">{product.price}</p>
                <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed hidden sm:block">
                  {product.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Por que escolher a <span className="text-shimmer">LHUB</span>?
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: <TrendingDown size={20} />, title: 'Menor Preço', desc: 'Passe R$4, Likes R$0,90, Guest R$0,70, Bypass R$20.', iconWrap: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20' },
            { icon: <Zap size={20} />, title: 'Entrega Automática', desc: 'Sistema automatizado. Produtos entregues em segundos.', iconWrap: 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 border-green-500/20' },
            { icon: <Monitor size={20} />, title: 'Bypass & Cheat', desc: 'Exclusivos para emulador MSI e BlueStacks.', iconWrap: 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/20' },
            { icon: <Code size={20} />, title: 'API para Revenda', desc: 'API REST para integrar em seu painel ou bot.', iconWrap: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20' },
          ].map((f, i) => (
            <div key={i} className="feature-card bg-neutral-900/60 border border-white/5 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 border ${f.iconWrap}`}>
                {f.icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold mb-1 text-white">{f.title}</h3>
              <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border border-white/5 p-5 md:p-8 rounded-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
                <Code size={12} />
                <span>API REST</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3">Integre em seu sistema</h2>
              <p className="text-neutral-400 mb-4 text-sm leading-relaxed">
                Nossa API permite enviar passes, likes, bypass, cheat e mais diretamente do seu painel ou bot.
              </p>
              <ul className="space-y-2 text-xs text-neutral-300 mb-5">
                {['Documentação completa', 'Python, JavaScript, PHP', 'Todos os produtos disponíveis', 'Desconto automático do saldo'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link href="/register">
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all inline-block cursor-pointer shadow-lg shadow-purple-500/25">
                    Criar Conta
                  </span>
                </Link>
                <Link href="/docs">
                  <span className="border border-purple-500/40 hover:border-purple-500 text-purple-300 hover:text-purple-200 px-5 py-2.5 rounded-xl font-medium text-xs transition-all inline-block cursor-pointer hover:bg-purple-500/5">
                    Ver Documentação
                  </span>
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full">
              <pre className="bg-black/60 p-4 rounded-xl text-[10px] sm:text-xs font-mono overflow-x-auto border border-neutral-800/50 shadow-2xl">
                <code className="text-neutral-300">
                  {`// Exemplo de envio de passe
const response = await fetch(
  "https://lhubff.com.br/api/v1/passe",
  {
    method: "POST",
    headers: {
      "x-api-key": "sua_api_key"
    },
    body: JSON.stringify({
      uid: "123456789"
    })
  }
);

{
  "success": true,
  "message": "Passe enviado!"
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className="relative z-10 container mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-violet-900/40 border border-purple-500/20 p-6 md:p-10">
          {}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            {}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-4">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                <span>@lhubofc</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Siga a <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">LHUB no Instagram</span>
              </h2>

              <p className="text-neutral-300 text-sm md:text-base mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Fique por dentro de tudo que acontece na LHUB. Sorteios exclusivos, cupons de desconto, novidades em primeira mao e muito mais.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto lg:mx-0">
                {[
                  { icon: <Gift size={16} />, text: 'Sorteios de passes e likes gratis' },
                  { icon: <Star size={16} />, text: 'Cupons exclusivos para seguidores' },
                  { icon: <Zap size={16} />, text: 'Novidades e lancamentos primeiro' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-300 bg-white/5 rounded-lg px-3 py-2.5 border border-white/5">
                    <span className="text-pink-400 shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://instagram.com/lhubofc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 hover:from-pink-500 hover:via-purple-500 hover:to-violet-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                Seguir @lhubofc
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {}
            <div className="hidden lg:flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
                <div className="relative w-48 h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </div>
              </div>
              <p className="text-neutral-400 text-xs">@lhubofc</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 bg-neutral-950/80">
        <div className="container mx-auto px-4 py-8 md:py-10">
          {}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <img src="/lhub-logo.png" alt="LHUB" className="w-6 h-6 rounded-md object-cover" />
              <span className="font-bold text-white text-sm">LHUB</span>
              <span className="text-neutral-600 text-xs">•</span>
              <span className="text-neutral-500 text-xs">Serviços Digitais para Gamers</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://discord.gg/pwWBr3s83t" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-[#5865F2] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.094.246.194.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              </a>
              <a href="https://instagram.com/lhubofc" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-pink-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              <a href="https://t.me/lhubff" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
              </a>
              <a href="https://play.google.com/store/apps/details?id=space.manus.lhub.forn.app.t20260212171412&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-green-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" /></svg>
              </a>
            </div>
          </div>

          {}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 max-w-lg mx-auto">
            <a href="https://discord.gg/pwWBr3s83t" target="_blank" rel="noopener noreferrer"
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-lg shadow-[#5865F2]/15 hover:scale-[1.02] active:scale-[0.98]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.076.076 0 0 0-.041-.107 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12-.098.246-.198.373-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.094.246.194.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              Discord
            </a>
            <a href="https://br.trustpilot.com/review/lhubff.com.br" target="_blank" rel="noopener noreferrer"
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00b67a] to-[#00a67a] hover:from-[#00a67a] hover:to-[#009a6a] text-white text-xs font-bold transition-all shadow-lg shadow-[#00b67a]/15 hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex items-center gap-0.5">
                <Star size={12} fill="white" className="text-white" />
                <Star size={12} fill="white" className="text-white" />
                <Star size={12} fill="white" className="text-white" />
                <Star size={12} fill="white" className="text-white" />
                <Star size={12} fill="white" className="text-white" />
              </div>
              Trustpilot
            </a>
            <a href="https://play.google.com/store/apps/details?id=space.manus.lhub.forn.app.t20260212171412&pcampaignid=web_share" target="_blank" rel="noopener noreferrer"
              className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-500/15 hover:scale-[1.02] active:scale-[0.98]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" /></svg>
              Aplicativo
            </a>
          </div>

          {}
          <div className="flex justify-center mb-5">
            <div
              className="trustpilot-widget w-full max-w-sm"
              data-locale="pt-BR"
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="697ab815794e2f0e63fbaa01"
              data-style-height="52px"
              data-style-width="100%"
              data-token="79589325-687a-4e8b-a928-cbcc80d64448"
            >
              <a href="https://br.trustpilot.com/review/lhubff.com.br" target="_blank" rel="noopener">Trustpilot</a>
            </div>
          </div>

          {}
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/termos" className="text-neutral-500 hover:text-purple-400 transition-colors text-[11px]">Termos de Uso</Link>
              <Link href="/privacidade" className="text-neutral-500 hover:text-purple-400 transition-colors text-[11px]">Privacidade</Link>
              <Link href="/docs" className="text-neutral-500 hover:text-purple-400 transition-colors text-[11px]">API Docs</Link>
            </div>
            <p className="text-neutral-600 text-[11px]">© 2026 LHUB. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
