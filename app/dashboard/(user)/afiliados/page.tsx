'use client';

import { useState, useEffect } from 'react';
import { Gift, Users, Copy, Check, DollarSign, UserPlus, CheckCircle, Clock, Share2 } from 'lucide-react';

interface Affiliate {
    email: string;
    hasRecharged: boolean;
    rewardPaid: boolean;
    createdAt: string;
}

interface AffiliateStats {
    totalReferred: number;
    totalRecharged: number;
    totalRewardsPaid: number;
    pendingRewards: number;
}

export default function AfiliadosPage() {
    const [affiliateCode, setAffiliateCode] = useState('');
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchAffiliateData();
    }, []);

    const fetchAffiliateData = async () => {
        try {
            const res = await fetch('/api/affiliate');
            const json = await res.json();
            if (json.success) {
                setAffiliateCode(json.affiliateCode || '');
                setAffiliates(json.affiliates || []);
                setStats(json.stats || null);
            }
        } catch (e) {
            console.error('Error fetching affiliate data:', e);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(affiliateCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/register?ref=${affiliateCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = () => {
        const link = `${window.location.origin}/register?ref=${affiliateCode}`;
        const text = `🎁 Use meu código de afiliado e ganhe benefícios! Cadastre-se: ${link}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'LHUB - Código de Afiliado',
                text: text,
                url: link
            });
        } else {
            copyLink();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <Gift className="text-purple-400" />
                    Programa de Afiliados
                </h1>
                <p className="text-neutral-400 mt-2">
                    Convide amigos e ganhe R$ 5,00 quando 3 convidados recarregarem R$ 5,00 ou mais!
                </p>
            </div>

            {}
            <div className="glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Como Funciona
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            1
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Compartilhe</h3>
                            <p className="text-sm text-neutral-400">Envie seu código ou link para amigos</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            2
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Eles Recarregam</h3>
                            <p className="text-sm text-neutral-400">3 amigos precisam recarregar R$ 5+</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                            3
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Você Ganha</h3>
                            <p className="text-sm text-neutral-400">R$ 5,00 de bônus na sua conta!</p>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="glass-card rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus className="text-purple-400" />
                    Seu Código de Afiliado
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-2xl font-mono font-bold text-purple-400 tracking-wider">
                            {affiliateCode}
                        </span>
                        <button
                            onClick={copyCode}
                            className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Copiar código"
                        >
                            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-neutral-400" />}
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={copyLink}
                            className="flex-1 md:flex-none px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Copy size={18} />
                            Copiar Link
                        </button>
                        <button
                            onClick={shareLink}
                            className="flex-1 md:flex-none px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 size={18} />
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>

            {}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Users size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalReferred}</p>
                                <p className="text-xs text-neutral-400">Convidados</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalRecharged}</p>
                                <p className="text-xs text-neutral-400">Recarregaram</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <Clock size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.pendingRewards}</p>
                                <p className="text-xs text-neutral-400">Pendentes</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <DollarSign size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-400">R$ {(stats.totalRewardsPaid * 5).toFixed(2)}</p>
                                <p className="text-xs text-neutral-400">Ganhos</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {stats && stats.totalRecharged < 3 && (
                <div className="glass-card rounded-2xl p-6 border border-white/10">
                    <h2 className="text-lg font-bold text-white mb-4">Progresso para o Bônus</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Amigos que recarregaram</span>
                            <span className="text-white font-medium">{stats.totalRecharged} / 3</span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${(stats.totalRecharged / 3) * 100}%` }}
                            />
                        </div>
                        <p className="text-sm text-neutral-400">
                            Faltam <span className="text-purple-400 font-medium">{3 - stats.totalRecharged}</span> amigos recarregarem para você ganhar <span className="text-green-400 font-medium">R$ 5,00</span>!
                        </p>
                    </div>
                </div>
            )}

            {}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-purple-400" />
                        Seus Convidados ({affiliates.length})
                    </h2>
                </div>
                
                {affiliates.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users size={48} className="mx-auto text-neutral-600 mb-3" />
                        <p className="text-neutral-400">Você ainda não convidou ninguém</p>
                        <p className="text-sm text-neutral-500 mt-1">Compartilhe seu código e comece a ganhar!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {affiliates.map((affiliate, index) => (
                            <div key={index} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
                                        {affiliate.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{affiliate.email}</p>
                                        <p className="text-xs text-neutral-500">
                                            {new Date(affiliate.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {affiliate.hasRecharged ? (
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} />
                                            Recarregou
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                                            <Clock size={12} />
                                            Pendente
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
