"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingCart, Check, AlertTriangle, X, Download, BookOpen, Copy } from "lucide-react";
import { decryptData } from "@/lib/crypto";
import RatingModal from "@/components/RatingModal";

interface CheatPlan {
    type: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    name: string;
    days: number;
    price: number;
    stock: number;
}

const CHEAT_PLANS: CheatPlan[] = [
    { type: 'daily', name: 'Diário', days: 1, price: 8.00, stock: 0 },
    { type: 'weekly', name: 'Semanal', days: 7, price: 12.00, stock: 0 },
    { type: 'biweekly', name: 'Quinzenal', days: 15, price: 28.00, stock: 0 },
    { type: 'monthly', name: 'Mensal', days: 30, price: 40.00, stock: 0 },
];

export default function CheatExternalPage() {
    const [plans, setPlans] = useState<CheatPlan[]>(CHEAT_PLANS);
    const [selectedPlan, setSelectedPlan] = useState<CheatPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const [purchaseResult, setPurchaseResult] = useState<any>(null);
    

    const [showRating, setShowRating] = useState(false);
    const [ratingTransactionId, setRatingTransactionId] = useState("");

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await fetch('/api/cheat/stock');
            const json = await res.json();
            
            if (json.success && json.data) {
                const updatedPlans = CHEAT_PLANS.map(plan => ({
                    ...plan,
                    stock: json.data[plan.type] || 0
                }));
                setPlans(updatedPlans);
            }
        } catch (e) {
            console.error('Error fetching stock:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        if (!selectedPlan) return;
        
        setPurchaseStatus('processing');
        setErrorMsg("");
        
        try {
            const res = await fetch('/api/cheat/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: selectedPlan.type })
            });
            
            const json = await res.json();
            
            if (json.success) {
                setPurchaseStatus('success');
                setPurchaseResult(json.data);
                setRatingTransactionId(json.data.transactionId || '');
                fetchStock();
            } else {
                setPurchaseStatus('error');
                setErrorMsg(json.message || 'Erro ao processar compra');
            }
        } catch (e) {
            setPurchaseStatus('error');
            setErrorMsg('Erro de conexão');
        }
    };

    const handleCloseSuccess = () => {
        setBuying(false);
        setSelectedPlan(null);
        setPurchaseStatus('idle');
        setPurchaseResult(null);
        if (ratingTransactionId) {
            setTimeout(() => setShowRating(true), 300);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('✅ Copiado!');
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            </div>
        );
    }

    return (
        <div className="pb-20 md:pb-4">
            {}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    🎯 Cheat External
                </h2>
                <p className="text-neutral-400 text-sm">
                    Cheat externo para Free Fire com diversas funções
                </p>
            </div>

            {}
            <div className="glass-card rounded-xl border border-white/10 p-4 mb-6">
                <h3 className="text-white font-bold mb-4">📋 Funções Incluídas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <h4 className="text-red-400 font-bold text-sm mb-2">🎯 Aimbot</h4>
                        <ul className="text-neutral-300 text-xs space-y-1">
                            <li>• AimTrick Ombro</li>
                            <li>• Aimbot Collider Lite</li>
                            <li>• Aimbot Collider Rage</li>
                            <li>• Sniper Scope</li>
                        </ul>
                    </div>

                    {}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <h4 className="text-yellow-400 font-bold text-sm mb-2">⚡ Exploits</h4>
                        <ul className="text-neutral-300 text-xs space-y-1">
                            <li>• Magnétic Peito/Head</li>
                            <li>• Teleport Map</li>
                            <li>• Teleport Enemy</li>
                            <li>• Ghost Hack</li>
                            <li>• Camera Direita</li>
                            <li>• Long Parachute</li>
                        </ul>
                    </div>

                    {}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                        <h4 className="text-cyan-400 font-bold text-sm mb-2">👁️ Visuals</h4>
                        <ul className="text-neutral-300 text-xs space-y-1">
                            <li>• Draw Lines</li>
                            <li>• Draw Box</li>
                            <li>• Draw Health</li>
                            <li>• Draw Skeleton</li>
                            <li>• Draw Name</li>
                            <li>• Draw Distance</li>
                        </ul>
                    </div>
                </div>
            </div>

            {}
            <h3 className="text-white font-bold mb-4">🛒 Escolha seu Plano</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {plans.map((plan) => (
                    <div
                        key={plan.type}
                        onClick={() => plan.stock > 0 && setSelectedPlan(plan)}
                        className={`relative bg-neutral-900 border rounded-xl p-4 cursor-pointer transition-all ${
                            selectedPlan?.type === plan.type 
                                ? 'border-purple-500 ring-2 ring-purple-500/30' 
                                : plan.stock > 0 
                                    ? 'border-neutral-800 hover:border-purple-500/50' 
                                    : 'border-neutral-800 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        {}
                        <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            plan.type === 'daily' ? 'bg-blue-600' :
                            plan.type === 'weekly' ? 'bg-green-600' :
                            plan.type === 'biweekly' ? 'bg-yellow-600' :
                            'bg-purple-600'
                        } text-white`}>
                            {plan.days} {plan.days === 1 ? 'dia' : 'dias'}
                        </span>

                        <h4 className="text-white font-bold mb-1">{plan.name}</h4>
                        <p className="text-green-400 font-bold text-lg mb-2">
                            R$ {plan.price.toFixed(2)}
                        </p>
                        
                        {}
                        <p className={`text-xs ${plan.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {plan.stock > 0 ? `${plan.stock} disponíveis` : 'Sem estoque'}
                        </p>

                        {}
                        {selectedPlan?.type === plan.type && (
                            <div className="absolute top-2 left-2">
                                <Check size={16} className="text-purple-400" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {}
            <button
                onClick={() => selectedPlan && setBuying(true)}
                disabled={!selectedPlan || selectedPlan.stock <= 0}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
                <ShoppingCart size={20} />
                {selectedPlan 
                    ? `Comprar ${selectedPlan.name} - R$ ${selectedPlan.price.toFixed(2)}`
                    : 'Selecione um plano'
                }
            </button>

            {}
            {buying && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-sm overflow-hidden">
                        {}
                        <div className="relative">
                            <div className="h-32 bg-gradient-to-br from-purple-900/50 to-neutral-900 flex items-center justify-center">
                                <span className="text-6xl">🎯</span>
                            </div>
                            <button 
                                onClick={() => { setBuying(false); setPurchaseStatus('idle'); setErrorMsg(''); }}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                            >
                                <X size={18} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900 to-transparent p-4">
                                <h3 className="font-bold text-white">Cheat External - {selectedPlan.name}</h3>
                                <p className="text-green-400 font-bold">R$ {selectedPlan.price.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="p-4">
                            {purchaseStatus === 'success' && purchaseResult ? (
                                <div className="text-center py-4">
                                    <Check className="w-14 h-14 text-green-500 mx-auto mb-3" />
                                    <p className="text-green-400 font-bold text-lg mb-1">Compra Realizada!</p>
                                    <p className="text-neutral-400 text-sm mb-4">Sua key foi gerada com sucesso</p>
                                    
                                    {}
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 text-left">
                                        <p className="text-purple-400 text-sm font-bold mb-3 text-center">🔑 Sua Key</p>
                                        <div className="bg-neutral-950 rounded-lg p-3 mb-3">
                                            <span className="text-neutral-500 text-xs block mb-1">Key de Ativação</span>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-mono font-bold text-sm break-all">
                                                    {purchaseResult.cheatKey}
                                                </span>
                                                <button 
                                                    onClick={() => copyToClipboard(purchaseResult.cheatKey)}
                                                    className="text-purple-400 hover:text-purple-300 ml-2"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Plano</span>
                                                <span className="text-white font-bold">{purchaseResult.planName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Duração</span>
                                                <span className="text-cyan-400">{purchaseResult.days} dias</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Valor</span>
                                                <span className="text-green-400">R$ {purchaseResult.price?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {}
                                    <div className="flex gap-2 mb-4">
                                        <a 
                                            href={purchaseResult.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-center py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            Download
                                        </a>
                                        <a 
                                            href={purchaseResult.tutorialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-center py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <BookOpen size={16} />
                                            Tutorial
                                        </a>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const info = `🎯 CHEAT EXTERNAL ATIVADO!

🔑 Key: ${purchaseResult.cheatKey}
📅 Plano: ${purchaseResult.planName}
⏰ Duração: ${purchaseResult.days} dias

💾 Download: ${purchaseResult.downloadUrl}
📖 Tutorial: ${purchaseResult.tutorialUrl}`;
                                            copyToClipboard(info);
                                        }}
                                        className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 mb-3"
                                    >
                                        <Copy size={14} />
                                        Copiar Tudo
                                    </button>

                                    <p className="text-yellow-400 text-xs mb-4">
                                        ⚠️ Os detalhes também foram enviados para seu email.
                                    </p>
                                    
                                    <button 
                                        onClick={handleCloseSuccess}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium"
                                    >
                                        Avaliar Compra ⭐
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {}
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-4">
                                        <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Atenção</p>
                                        <p className="text-neutral-300 text-sm">
                                            Você está comprando uma <span className="text-white font-bold">key de {selectedPlan.days} {selectedPlan.days === 1 ? 'dia' : 'dias'}</span> do Cheat External.
                                        </p>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            A key será exibida após a compra e enviada para seu email.
                                        </p>
                                    </div>

                                    {}
                                    <div className="bg-neutral-950 rounded-lg p-3 mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-neutral-400">Plano</span>
                                            <span className="text-white font-bold">{selectedPlan.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-neutral-400">Duração</span>
                                            <span className="text-cyan-400">{selectedPlan.days} {selectedPlan.days === 1 ? 'dia' : 'dias'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-400">Estoque</span>
                                            <span className="text-green-400">{selectedPlan.stock} disponíveis</span>
                                        </div>
                                    </div>
                                    
                                    {errorMsg && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                            <AlertTriangle size={14} />
                                            {errorMsg}
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={handleBuy}
                                        disabled={purchaseStatus === 'processing'}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {purchaseStatus === 'processing' ? (
                                            <><Loader2 className="animate-spin w-4 h-4" /> Processando...</>
                                        ) : (
                                            <><ShoppingCart size={16} /> Confirmar - R$ {selectedPlan.price.toFixed(2)}</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            <RatingModal
                isOpen={showRating}
                onClose={() => {
                    setShowRating(false);
                    setRatingTransactionId("");
                }}
                transactionId={ratingTransactionId}
                productName="Cheat External"
                onSubmit={async (rating, feedback) => {
                    await fetch('/api/rating', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId: ratingTransactionId,
                            rating,
                            feedback,
                            productName: 'Cheat External'
                        })
                    });
                }}
            />
        </div>
    );
}
