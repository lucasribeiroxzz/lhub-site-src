'use client';

import { useState, useEffect } from 'react';
import { Monitor, Copy, Check, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import RatingModal from '@/components/RatingModal';

interface StreamingPlatform {
    id: string;
    name: string;
    icon: string;
    price: number;
    stock: number;
}

interface PurchaseResult {
    key: string;
    platform: string;
    platformIcon: string;
    price: number;
    transactionId: string;
    newBalance: number;
}

export default function StreamingsPage() {
    const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<PurchaseResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await fetch('/api/streaming/stock');
            const data = await res.json();
            if (data.success) {
                setPlatforms(data.platforms);
            }
        } catch (error) {
            console.error('Erro ao buscar estoque:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPlatform) {
            setError('Selecione uma plataforma');
            return;
        }

        setIsPurchasing(true);
        setError('');

        try {
            const res = await fetch('/api/streaming/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    couponCode: couponCode || undefined
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess({
                    key: data.key,
                    platform: data.platform,
                    platformIcon: data.platformIcon,
                    price: data.price,
                    transactionId: data.transactionId,
                    newBalance: data.newBalance
                });
                fetchStock();

                setTimeout(() => {
                    setShowRatingModal(true);
                }, 3000);
            } else {
                setError(data.message || 'Erro ao processar compra');
            }
        } catch (error) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedPlatformInfo = platforms.find(p => p.id === selectedPlatform);

    if (success) {
        return (
            <div className="min-h-screen bg-[#09090b] p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/30 rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} className="text-green-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            {success.platformIcon} Compra Realizada!
                        </h1>
                        <p className="text-zinc-400 mb-8">
                            Sua conta de {success.platform} foi entregue com sucesso!
                        </p>

                        {}
                        <div className="bg-black/40 rounded-xl p-6 mb-6 border border-zinc-800">
                            <p className="text-zinc-400 text-sm mb-2">Dados de Acesso</p>
                            <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-4">
                                <code className="text-green-400 font-mono text-sm break-all">
                                    {success.key}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(success.key)}
                                    className="ml-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    {copied ? (
                                        <Check size={18} className="text-green-400" />
                                    ) : (
                                        <Copy size={18} className="text-zinc-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-black/30 rounded-lg p-4">
                                <p className="text-zinc-500 text-xs mb-1">Plataforma</p>
                                <p className="text-white font-semibold">{success.platform}</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4">
                                <p className="text-zinc-500 text-xs mb-1">Valor Pago</p>
                                <p className="text-green-400 font-semibold">R$ {success.price.toFixed(2)}</p>
                            </div>
                        </div>

                        {}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                            <p className="text-yellow-400 text-sm">
                                <strong>Importante:</strong> Guarde os dados de acesso em um local seguro!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href="/dashboard"
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Voltar ao Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setSuccess(null);
                                    setSelectedPlatform('');
                                    setCouponCode('');
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all"
                            >
                                Comprar Outro
                            </button>
                        </div>
                    </div>
                </div>

                <RatingModal
                    isOpen={showRatingModal}
                    onClose={() => setShowRatingModal(false)}
                    productName={`Streaming - ${success.platform}`}
                    transactionId={success.transactionId}
                    onSubmit={async (rating, feedback) => {
                        await fetch('/api/rating', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                transactionId: success.transactionId,
                                productName: `Streaming - ${success.platform}`,
                                rating,
                                feedback
                            })
                        });
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] p-6">
            <div className="max-w-4xl mx-auto">
                {}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                            <Monitor size={28} className="text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Streamings</h1>
                            <p className="text-zinc-400">Contas Premium entregues na hora!</p>
                        </div>
                    </div>
                </div>

                {}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-zinc-900/50 rounded-xl p-4 animate-pulse border border-zinc-800">
                                <div className="h-12 bg-zinc-800 rounded mb-3"></div>
                                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                            </div>
                        ))
                    ) : (
                        platforms.map((platform) => (
                            <button
                                key={platform.id}
                                onClick={() => setSelectedPlatform(platform.id)}
                                disabled={platform.stock === 0}
                                className={`relative p-5 rounded-xl border transition-all text-left ${selectedPlatform === platform.id
                                    ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/10 border-purple-500/50 ring-2 ring-purple-500/30'
                                    : platform.stock === 0
                                        ? 'bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed'
                                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                                    }`}
                            >
                                <div className="text-3xl mb-3">{platform.icon}</div>
                                <h3 className="text-white font-semibold mb-1">{platform.name}</h3>
                                <p className="text-purple-400 font-bold text-lg">
                                    R$ {platform.price.toFixed(2)}
                                </p>
                                <p className={`text-sm mt-2 ${platform.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {platform.stock > 0 ? `${platform.stock} disponível` : 'Sem estoque'}
                                </p>

                                {selectedPlatform === platform.id && (
                                    <div className="absolute top-3 right-3">
                                        <Check size={20} className="text-purple-400" />
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {}
                {selectedPlatform && selectedPlatformInfo && (
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-purple-400" />
                            Confirmar Compra
                        </h2>

                        {}
                        <div className="bg-black/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{selectedPlatformInfo.icon}</span>
                                    <div>
                                        <p className="text-white font-medium">{selectedPlatformInfo.name}</p>
                                        <p className="text-zinc-500 text-sm">Streamings</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-400 font-bold text-xl">
                                        R$ {selectedPlatformInfo.price.toFixed(2)}
                                    </p>
                                    <p className="text-green-400 text-sm">{selectedPlatformInfo.stock} em estoque</p>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="mb-6">
                            <label className="text-zinc-400 text-sm mb-2 block">Cupom de Desconto (opcional)</label>
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Digite seu cupom"
                                className="w-full bg-black/30 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                                <AlertCircle size={20} className="text-red-400" />
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}

                        {}
                        <button
                            onClick={handlePurchase}
                            disabled={isPurchasing || selectedPlatformInfo.stock === 0}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isPurchasing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Comprar por R$ {selectedPlatformInfo.price.toFixed(2)}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {}
                <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <h3 className="text-purple-400 font-semibold mb-2">ℹ️ Como funciona</h3>
                    <ul className="text-zinc-400 text-sm space-y-1">
                        <li>• Selecione a plataforma de streaming desejada</li>
                        <li>• Confirme a compra e receba os dados de acesso instantaneamente</li>
                        <li>• Os dados também serão enviados para seu email</li>
                        <li>• Em caso de problemas, entre em contato pelo Discord</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
