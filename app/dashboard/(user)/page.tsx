"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingCart, Check, AlertTriangle, X, Instagram, Diamond } from "lucide-react";
import { decryptData } from "@/lib/crypto";
import RatingModal from "@/components/RatingModal";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    available: boolean;
    type?: string;
}

interface DiamondPackage {
    amount: number;
    price: number;
    stock: number;
    available: boolean;
}

const LIKES_PACKAGES = [
    { amount: 250, price: 0.90 },
    { amount: 500, price: 1.80 },
    { amount: 750, price: 2.70 },
    { amount: 1000, price: 3.60 },
    { amount: 1250, price: 4.50 },
    { amount: 1500, price: 5.40 },
    { amount: 2500, price: 9.00 },
    { amount: 3500, price: 12.60 },
    { amount: 4500, price: 16.20 },
    { amount: 5500, price: 19.80 },
    { amount: 6500, price: 23.40 },
    { amount: 7500, price: 27.00 },
    { amount: 8500, price: 30.60 },
    { amount: 9500, price: 34.20 },
    { amount: 10000, price: 36.00 },
];

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [buying, setBuying] = useState<Product | null>(null);
    const [gameUid, setGameUid] = useState("");
    const [checkingUser, setCheckingUser] = useState(false);
    const [playerInfo, setPlayerInfo] = useState<{ nickname: string, level: number, region?: string } | null>(null);
    const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [userLoaded, setUserLoaded] = useState(false);
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);

    const [showRating, setShowRating] = useState(false);
    const [ratingTransactionId, setRatingTransactionId] = useState("");
    const [ratingProductName, setRatingProductName] = useState("");

    const [giftMessage, setGiftMessage] = useState("");
    const [purchaseResult, setPurchaseResult] = useState<any>(null);

    const [cheatPlanType, setCheatPlanType] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
    const [cheatStock, setCheatStock] = useState<Record<string, { stock: number; price: number }>>({});
    const [loadingCheatStock, setLoadingCheatStock] = useState(false);

    const [modapkPlanType, setModapkPlanType] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
    const [modapkStock, setModapkStock] = useState<Record<string, { stock: number; price: number }>>({});
    const [loadingModapkStock, setLoadingModapkStock] = useState(false);

    const [tokenQuantity, setTokenQuantity] = useState(1);

    const [diamondPackages, setDiamondPackages] = useState<DiamondPackage[]>([]);
    const [selectedDiamondAmount, setSelectedDiamondAmount] = useState<number>(200);
    const [loadingDiamondStock, setLoadingDiamondStock] = useState(false);
    const [accessToken, setAccessToken] = useState("");
    const [verifyingToken, setVerifyingToken] = useState(false);
    const [diamondPlayerInfo, setDiamondPlayerInfo] = useState<{ nickname: string, level: number, region: string, uid?: string } | null>(null);
    const [alreadyReceivedDiamond, setAlreadyReceivedDiamond] = useState(false);

    const [selectedLikesAmount, setSelectedLikesAmount] = useState<number>(250);

    useEffect(() => {
        loadUser().then(() => {
            syncWithBLN().then(() => fetchProducts());
        });

        const syncInterval = setInterval(() => {
            syncWithBLN().then(() => fetchProducts());
        }, 300000);

        const diamondStockInterval = setInterval(() => {
            fetch("/api/diamonds/stock")
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data?.packages) {
                        setDiamondPackages(json.data.packages);
                        console.log('[Diamantes] Estoque atualizado automaticamente:', json.data.packages.map((p: any) => `${p.amount}: ${p.stock}`).join(', '));
                    }
                })
                .catch(() => { });
        }, 10000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(diamondStockInterval);
        };
    }, []);

    const loadUser = async () => {
        try {
            const local = localStorage.getItem("user_session");
            if (local) {
                const session = JSON.parse(local);
                if (session?.email) {
                    setUserLoaded(true);
                    return;
                }
            }
            const res = await fetch("/api/user/me");
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    const data = decryptData(json.data);
                    if (data?.email) {
                        localStorage.setItem("user_session", JSON.stringify({ email: data.email }));
                    }
                }
            }
        } catch (e) { }
        setUserLoaded(true);
    };

    const syncWithBLN = async () => {
        try { await fetch("/api/admin/sync"); } catch (e) { }
    };

    const PRODUCT_ORDER: Record<string, number> = {
        'PASSE': 1,
        'DIAMONDS': 2,
        'TOKEN': 3,
        'LIKES': 4,
        'GUEST_ACCOUNT': 5,
        'BYPASS': 6,
        'CHEAT': 7,
        'MODAPK': 8,
        'STREAMING': 9
    };

    const sortProducts = (products: Product[]) => {
        return [...products].sort((a, b) => {
            const orderA = PRODUCT_ORDER[a.type || ''] || 99;
            const orderB = PRODUCT_ORDER[b.type || ''] || 99;
            return orderA - orderB;
        });
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const json = await res.json();
            if (json.data) {
                const decrypted = decryptData(json.data);
                const sorted = sortProducts(Array.isArray(decrypted) ? decrypted : []);
                setProducts(sorted);
            } else {
                const sorted = sortProducts(Array.isArray(json) ? json : []);
                setProducts(sorted);
            }
        } catch (e) { }
        setLoading(false);
    };

    const fetchCheatStock = async () => {
        setLoadingCheatStock(true);
        try {
            const res = await fetch("/api/cheat/stock");
            const json = await res.json();
            if (json.success && json.data) {
                setCheatStock(json.data);
            }
        } catch (e) { }
        setLoadingCheatStock(false);
    };

    const fetchModapkStock = async () => {
        setLoadingModapkStock(true);
        try {
            const res = await fetch("/api/modapk/stock");
            const json = await res.json();
            if (json.success && json.data) {
                setModapkStock(json.data);
            }
        } catch (e) { }
        setLoadingModapkStock(false);
    };

    const fetchDiamondStock = useCallback(async () => {
        setLoadingDiamondStock(true);
        try {
            const res = await fetch("/api/diamonds/stock");
            const json = await res.json();
            console.log('[Diamantes] Resposta da API de estoque:', JSON.stringify(json, null, 2));
            if (json.success && json.data?.packages) {
                setDiamondPackages(json.data.packages);
                console.log('[Diamantes] Estoque atualizado:', json.data.packages.map((p: DiamondPackage) => `${p.amount}: ${p.stock}`).join(', '));
            }
        } catch (e) {
            console.error('[Diamantes] Erro ao buscar estoque:', e);
        }
        setLoadingDiamondStock(false);
    }, []);

    const handleVerifyToken = async () => {
        if (!accessToken) return;
        setVerifyingToken(true);
        setErrorMsg("");
        setDiamondPlayerInfo(null);
        setAlreadyReceivedDiamond(false);

        try {
            const res = await fetch("/api/diamonds/verify", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, diamondAmount: selectedDiamondAmount.toString() })
            });
            const json = await res.json();

            if (json.success && json.data) {
                setDiamondPlayerInfo(json.data.player);
                setAlreadyReceivedDiamond(json.data.alreadyReceived || false);
                if (json.data.alreadyReceived) {
                    setErrorMsg(`Esta conta já recebeu ${selectedDiamondAmount} diamantes anteriormente.`);
                }
            } else {
                setErrorMsg(json.error || "Token inválido ou expirado");
            }
        } catch (e) {
            setErrorMsg("Erro ao verificar token");
        }
        setVerifyingToken(false);
    };

    const handleCheckUser = async () => {
        if (!gameUid) return;
        setCheckingUser(true);
        setErrorMsg("");
        try {
            const res = await fetch("/api/game/check-user", {
                method: "POST",
                body: JSON.stringify({ uid: gameUid })
            });
            const data = await res.json();
            if (data.success) {
                setPlayerInfo(data.data);
            } else {
                setPlayerInfo(null);
                setErrorMsg("Jogador não encontrado.");
            }
        } catch (e) {
            setErrorMsg("Erro ao verificar jogador.");
        }
        setCheckingUser(false);
    };

    const handleBuy = async () => {
        if (!buying) {
            setErrorMsg("Selecione um produto.");
            return;
        }

        if (buying.type === 'DIAMONDS') {
            if (!diamondPlayerInfo) {
                setErrorMsg("Verifique o token primeiro.");
                return;
            }
            if (alreadyReceivedDiamond) {
                setErrorMsg("Esta conta já recebeu este pacote de diamantes.");
                return;
            }
        } else if (buying.type !== 'GUEST_ACCOUNT' && buying.type !== 'CHEAT' && buying.type !== 'MODAPK' && buying.type !== 'TOKEN' && !gameUid) {
            setErrorMsg("Informe o UID do jogador.");
            return;
        }
        if (buying.type === 'TOKEN' && !gameUid) {
            setErrorMsg("Informe o UID do jogador para receber as caixas.");
            return;
        }

        setPurchaseStatus('processing');
        setErrorMsg("");

        try {

            let apiUrl = '/api/shop/buy';
            let bodyData: any = {
                productId: buying.id,
                gameUid: buying.type === 'GUEST_ACCOUNT' || buying.type === 'CHEAT' || buying.type === 'MODAPK' ? 'GUEST' : gameUid,
                region: 'BR',
                giftMessage: buying.type === 'PASSE' ? giftMessage : undefined,
                planType: buying.type === 'CHEAT' ? cheatPlanType : buying.type === 'MODAPK' ? modapkPlanType : undefined,
                quantity: buying.type === 'TOKEN' ? tokenQuantity : undefined
            };

            if (buying.type === 'BYPASS') {
                apiUrl = '/api/bypass/buy';
            } else if (buying.type === 'CHEAT') {
                apiUrl = '/api/cheat/buy';
            } else if (buying.type === 'MODAPK') {
                apiUrl = '/api/modapk/buy';
            } else if (buying.type === 'DIAMONDS') {
                apiUrl = '/api/diamonds/send';
                bodyData = {
                    accessToken,
                    diamondAmount: selectedDiamondAmount.toString()
                };
            } else if (buying.type === 'LIKES') {
                bodyData.likesAmount = selectedLikesAmount;
            }

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const json = await res.json();

            if (buying.type === 'DIAMONDS') {
                if (json.success) {
                    setPurchaseStatus('success');
                    setPurchaseResult({
                        diamondInfo: json.data,
                        transactionId: json.data?.transactionId
                    });
                    setSuccessMsg(`${selectedDiamondAmount} diamantes enviados com sucesso!`);
                    window.dispatchEvent(new Event('balance_update'));
                    fetchDiamondStock();

                    if (json.data?.transactionId) {
                        setRatingTransactionId(json.data.transactionId);
                        setRatingProductName(`${selectedDiamondAmount} Diamantes`);
                    }
                } else {
                    setPurchaseStatus('error');
                    setErrorMsg(json.error || "Erro ao enviar diamantes");
                }
            } else if (buying.type === 'BYPASS') {
                if (json.success) {
                    setPurchaseStatus('success');
                    setPurchaseResult({
                        bypassInfo: json.data,
                        transactionId: json.data?.transactionId
                    });
                    setSuccessMsg(`Bypass ativado com sucesso!`);
                    window.dispatchEvent(new Event('balance_update'));
                    fetchProducts();

                    if (json.data?.transactionId) {
                        setRatingTransactionId(json.data.transactionId);
                        setRatingProductName(buying.name);
                    }
                } else {
                    setPurchaseStatus('error');
                    setErrorMsg(json.message || "Erro ao ativar bypass");
                }
            } else if (buying.type === 'CHEAT') {
                if (json.success) {
                    setPurchaseStatus('success');
                    setPurchaseResult({
                        cheatInfo: json.data,
                        transactionId: json.data?.transactionId
                    });
                    setSuccessMsg(`Cheat External entregue com sucesso!`);
                    window.dispatchEvent(new Event('balance_update'));
                    fetchProducts();
                    fetchCheatStock();

                    if (json.data?.transactionId) {
                        setRatingTransactionId(json.data.transactionId);
                        setRatingProductName(buying.name);
                    }
                } else {
                    setPurchaseStatus('error');
                    setErrorMsg(json.message || "Erro ao comprar cheat");
                }
            } else if (buying.type === 'MODAPK') {
                if (json.success) {
                    setPurchaseStatus('success');
                    setPurchaseResult({
                        modapkInfo: json.data,
                        transactionId: json.data?.transactionId
                    });
                    setSuccessMsg(`ModApk Android entregue com sucesso!`);
                    window.dispatchEvent(new Event('balance_update'));
                    fetchProducts();
                    fetchModapkStock();

                    if (json.data?.transactionId) {
                        setRatingTransactionId(json.data.transactionId);
                        setRatingProductName(buying.name);
                    }
                } else {
                    setPurchaseStatus('error');
                    setErrorMsg(json.message || "Erro ao comprar ModApk");
                }
            } else if (json.success && json.data) {
                const data = decryptData(json.data);
                setPurchaseStatus('success');
                setPurchaseResult(data);

                if (data.likesInfo) {
                    setSuccessMsg(`${data.likesInfo.likesAdded} likes enviados para ${data.likesInfo.player}!`);
                } else if (data.passeInfo) {
                    setSuccessMsg(`Passe enviado com sucesso!`);
                } else if (data.guestAccount) {
                    setSuccessMsg(`Conta adquirida com sucesso! Anote suas credenciais.`);
                } else if (buying.type === 'TOKEN') {
                    setSuccessMsg(`${tokenQuantity} caixa(s) universal enviada(s) para UID ${gameUid}!`);
                } else {
                    setSuccessMsg(`${buying.name} enviado para UID ${gameUid}!`);
                }

                window.dispatchEvent(new Event('balance_update'));
                fetchProducts();

                if (data.transactionId) {
                    setRatingTransactionId(data.transactionId);
                    setRatingProductName(buying.name);
                }
            } else {
                setPurchaseStatus('error');
                setErrorMsg(json.message || "Erro desconhecido");
            }
        } catch (e) {
            setPurchaseStatus('error');
            setErrorMsg("Erro na comunicação.");
        }
    };

    const handleCloseSuccess = () => {
        setBuying(null);
        if (ratingTransactionId) {
            setTimeout(() => {
                setShowRating(true);
            }, 300);
        }
    };

    const handleSubmitRating = async (rating: number, feedback: string) => {
        await fetch('/api/rating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactionId: ratingTransactionId,
                rating,
                feedback,
                productName: ratingProductName
            })
        });
    };

    const openProductDetails = (product: Product) => {
        setSelectedProduct(product);
    };

    const startBuying = (product: Product) => {
        if (product.type === 'STREAMING') {
            window.location.href = '/dashboard/streamings';
            return;
        } else if (product.type === 'CHEAT') {
            fetchCheatStock();
        } else if (product.type === 'MODAPK') {
            fetchModapkStock();
        } else if (product.type === 'DIAMONDS') {
            fetchDiamondStock();
        } else if (product.type !== 'LIKES' && product.stock <= 0) {
            setOutOfStockProduct(product);
            setShowOutOfStock(true);
            return;
        }
        setSelectedProduct(null);
        setBuying(product);
        setGameUid("");
        setPlayerInfo(null);
        setPurchaseStatus('idle');
        setErrorMsg("");
        setSuccessMsg("");
        setRatingTransactionId("");
        setRatingProductName("");
        setGiftMessage("");
        setPurchaseResult(null);
        setCheatPlanType('daily');
        setModapkPlanType('daily');
        setAccessToken("");
        setDiamondPlayerInfo(null);
        setAlreadyReceivedDiamond(false);
        setSelectedDiamondAmount(200);
        setSelectedLikesAmount(100);
    };

    const getProductIcon = (type?: string) => {
        if (type === 'LIKES') return '❤️';
        if (type === 'PASSE') return '🎮';
        if (type === 'GUEST_ACCOUNT') return '👤';
        if (type === 'BYPASS') return '🚀';
        if (type === 'CHEAT') return '🎯';
        if (type === 'MODAPK') return '📱';
        if (type === 'TOKEN') return '🎁';
        if (type === 'DIAMONDS') return '💎';
        if (type === 'STREAMING') return '📺';
        return '📦';
    };

    const getSelectedDiamondPrice = () => {
        const pkg = diamondPackages.find(p => p.amount === selectedDiamondAmount);
        return pkg?.price || 0;
    };

    const getSelectedDiamondStock = () => {
        const pkg = diamondPackages.find(p => p.amount === selectedDiamondAmount);
        return pkg?.stock || 0;
    };

    const getSelectedLikesPrice = () => {
        const pkg = LIKES_PACKAGES.find(p => p.amount === selectedLikesAmount);
        return pkg?.price || 0;
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
            <h2 className="text-2xl font-bold text-white mb-2">Loja</h2>
            <p className="text-neutral-400 text-sm mb-4">Toque no produto para ver detalhes</p>

            {}
            <a
                href="https://instagram.com/lhubofc"
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-3 hover:border-purple-500/50 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shrink-0">
                        <Instagram size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">Marque nos stories <span className="text-purple-400">@lhubofc</span></p>
                        <p className="text-neutral-400 text-xs">Concorra a passes e likes grátis!</p>
                    </div>
                    <span className="text-purple-400 text-xs shrink-0">Seguir →</span>
                </div>
            </a>

            {}
            <div className="flex flex-wrap gap-3">
                {products.filter(p => p.available).map((product) => (
                    <div
                        key={product.id}
                        onClick={() => openProductDetails(product)}
                        className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        {}
                        <div className="aspect-square bg-gradient-to-br from-purple-900/30 to-neutral-900 flex items-center justify-center relative">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-5xl">{getProductIcon(product.type)}</span>
                            )}

                            {}
                            <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${product.type === 'PASSE' ? 'bg-purple-600' :
                                product.type === 'LIKES' ? 'bg-pink-600' :
                                    product.type === 'CHEAT' ? 'bg-orange-600' :
                                        product.type === 'MODAPK' ? 'bg-green-600' :
                                            product.type === 'BYPASS' ? 'bg-cyan-600' :
                                                product.type === 'DIAMONDS' ? 'bg-blue-600' :
                                                    product.type === 'STREAMING' ? 'bg-red-600' : 'bg-blue-600'
                                } text-white`}>
                                {product.type}
                            </span>

                            {}
                            {product.type !== 'LIKES' && product.type !== 'BYPASS' && product.type !== 'MODAPK' && product.type !== 'DIAMONDS' && product.type !== 'STREAMING' && product.stock <= 0 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-red-500 font-bold text-sm">ESGOTADO</span>
                                </div>
                            )}
                        </div>

                        {}
                        <div className="p-3">
                            <h3 className="font-bold text-white text-sm truncate">{product.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-green-400 font-bold">
                                    {product.type === 'CHEAT' ? 'A partir de R$ 8,00' :
                                        product.type === 'MODAPK' ? 'A partir de R$ 12,00' :
                                            product.type === 'DIAMONDS' ? 'A partir de R$ 9,00' :
                                                product.type === 'LIKES' ? 'A partir de R$ 0,90' :
                                                    product.type === 'STREAMING' ? 'A partir de R$ 10,00' :
                                                        `R$ ${product.price.toFixed(2)}`}
                                </span>
                                {product.type === 'LIKES' || product.type === 'BYPASS' ? (
                                    <span className="text-green-500 text-[10px]">∞ disp.</span>
                                ) : product.type === 'CHEAT' ? (
                                    <span className="text-orange-400 text-[10px]">Ver planos</span>
                                ) : product.type === 'MODAPK' ? (
                                    <span className="text-green-400 text-[10px]">Ver planos</span>
                                ) : product.type === 'DIAMONDS' ? (
                                    <span className="text-blue-400 text-[10px]">Ver pacotes</span>
                                ) : product.type === 'STREAMING' ? (
                                    <span className="text-red-400 text-[10px]">Ver plataformas</span>
                                ) : product.stock > 0 ? (
                                    <span className="text-green-500 text-[10px]">{product.stock} disp.</span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products.filter(p => p.available).length === 0 && (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">🛒</div>
                    <p className="text-neutral-400">Nenhum produto disponível</p>
                </div>
            )}

            {}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedProduct(null)}>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        {}
                        <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-neutral-900 flex items-center justify-center relative">
                            {selectedProduct.image ? (
                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-7xl">{getProductIcon(selectedProduct.type)}</span>
                            )}

                            {}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                            >
                                <X size={18} />
                            </button>

                            {}
                            <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${selectedProduct.type === 'PASSE' ? 'bg-purple-600' :
                                selectedProduct.type === 'LIKES' ? 'bg-pink-600' :
                                    selectedProduct.type === 'DIAMONDS' ? 'bg-blue-600' : 'bg-blue-600'
                                } text-white`}>
                                {selectedProduct.type}
                            </span>
                        </div>

                        {}
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.name}</h3>
                            <p className="text-neutral-400 text-sm mb-4">{selectedProduct.description}</p>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl font-bold text-green-400">
                                    {selectedProduct.type === 'DIAMONDS' ? 'A partir de R$ 9,00' :
                                        selectedProduct.type === 'LIKES' ? 'A partir de R$ 0,90' :
                                            `R$ ${selectedProduct.price.toFixed(2)}`}
                                </span>
                                {selectedProduct.type !== 'LIKES' && selectedProduct.type !== 'DIAMONDS' && (
                                    <span className={`text-sm px-3 py-1 rounded-full ${selectedProduct.stock > 0
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {selectedProduct.stock > 0 ? `${selectedProduct.stock} disponíveis` : 'Esgotado'}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => startBuying(selectedProduct)}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedProduct.type !== 'LIKES' && selectedProduct.type !== 'DIAMONDS' && selectedProduct.stock <= 0
                                    ? 'bg-neutral-800 text-neutral-500'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-[0.98]'
                                    }`}
                            >
                                <ShoppingCart size={18} />
                                {selectedProduct.type !== 'LIKES' && selectedProduct.type !== 'DIAMONDS' && selectedProduct.stock <= 0 ? 'Sem Estoque' : 'Comprar Agora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {buying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
                        {}
                        <div className="relative">
                            <div className="h-32 bg-gradient-to-br from-purple-900/30 to-neutral-900 flex items-center justify-center">
                                {buying.image ? (
                                    <img src={buying.image} alt={buying.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl">{getProductIcon(buying.type)}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setBuying(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                            >
                                <X size={18} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900 to-transparent p-4">
                                <h3 className="font-bold text-white">{buying.name}</h3>
                                <p className="text-green-400 font-bold">
                                    {buying.type === 'DIAMONDS' ? `R$ ${getSelectedDiamondPrice().toFixed(2)}` :
                                        buying.type === 'LIKES' ? `R$ ${getSelectedLikesPrice().toFixed(2)}` :
                                            `R$ ${buying.price.toFixed(2)}`}
                                </p>
                            </div>
                        </div>

                        <div className="p-4">
                            {purchaseStatus === 'success' ? (
                                <div className="text-center py-4">
                                    <Check className="w-14 h-14 text-green-500 mx-auto mb-3" />
                                    <p className="text-green-400 font-bold text-lg mb-1">Sucesso!</p>
                                    <p className="text-neutral-400 text-sm mb-4">{successMsg}</p>

                                    {}
                                    {purchaseResult?.diamondInfo && (
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 text-left">
                                            <p className="text-blue-400 text-sm font-bold mb-3 text-center">💎 Diamantes Enviados!</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Jogador</span>
                                                    <span className="text-white font-bold">{purchaseResult.diamondInfo.player?.nickname}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Diamantes</span>
                                                    <span className="text-blue-400 font-bold">+{purchaseResult.diamondInfo.diamonds}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Valor</span>
                                                    <span className="text-green-400 font-bold">R$ {purchaseResult.diamondInfo.price?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.passeInfo && (
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-4 text-left">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Jogador</span>
                                                    <span className="text-white font-bold">{purchaseResult.passeInfo.playerNick || purchaseResult.gameUid}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">UID</span>
                                                    <span className="text-neutral-300 font-mono text-sm">{purchaseResult.gameUid}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Mensagem</span>
                                                    <span className="text-purple-400 text-sm max-w-[180px] truncate">{purchaseResult.passeInfo.messageSent}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Valor</span>
                                                    <span className="text-green-400 font-bold">R$ {purchaseResult.finalPrice?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.likesInfo && (
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-4 text-left">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Jogador</span>
                                                    <span className="text-white font-bold">{purchaseResult.likesInfo.player}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Likes Enviados</span>
                                                    <span className="text-pink-400 font-bold">+{purchaseResult.likesInfo.likesAdded}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Total de Likes</span>
                                                    <span className="text-neutral-300">{purchaseResult.likesInfo.finalLikes}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.guestAccount && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 text-left">
                                            <p className="text-green-400 text-sm font-bold mb-3 text-center">🎉 Suas Credenciais</p>
                                            <div className="bg-neutral-950 rounded-lg p-3">
                                                <span className="text-neutral-500 text-xs block mb-1">Conta (UID:PASSWORD)</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-mono font-bold text-sm break-all">
                                                        {purchaseResult.guestAccount.uid}:{purchaseResult.guestAccount.password}
                                                    </span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(`${purchaseResult.guestAccount.uid}:${purchaseResult.guestAccount.password}`)}
                                                        className="text-purple-400 text-xs hover:text-purple-300 ml-2 whitespace-nowrap"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-yellow-400 text-xs mt-3 text-center">
                                                ⚠️ Anote essas credenciais! Elas também foram enviadas para seu email.
                                            </p>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.cheatInfo && (
                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4 text-left">
                                            <p className="text-orange-400 text-sm font-bold mb-3 text-center">🎯 Cheat External Entregue!</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Plano</span>
                                                    <span className="text-white font-bold">{purchaseResult.cheatInfo.planName}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Duração</span>
                                                    <span className="text-orange-400 font-bold">{purchaseResult.cheatInfo.days} dias</span>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-950 rounded-lg p-3 mt-3">
                                                <span className="text-neutral-500 text-xs block mb-1">Sua Key</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-mono font-bold text-sm break-all">
                                                        {purchaseResult.cheatInfo.key}
                                                    </span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(purchaseResult.cheatInfo.key)}
                                                        className="text-purple-400 text-xs hover:text-purple-300 ml-2 whitespace-nowrap"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <a
                                                    href={purchaseResult.cheatInfo.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    💾 Download
                                                </a>
                                                <a
                                                    href={purchaseResult.cheatInfo.tutorialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    📖 Tutorial
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.modapkInfo && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 text-left">
                                            <p className="text-green-400 text-sm font-bold mb-3 text-center">📱 ModApk Android Ativado!</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Plano</span>
                                                    <span className="text-white font-bold">{purchaseResult.modapkInfo.planName}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Duração</span>
                                                    <span className="text-green-400 font-bold">{purchaseResult.modapkInfo.days} dias</span>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-950 rounded-lg p-3 mt-3">
                                                <span className="text-neutral-500 text-xs block mb-1">Sua Key</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-mono font-bold text-sm break-all">
                                                        {purchaseResult.modapkInfo.key}
                                                    </span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(purchaseResult.modapkInfo.key)}
                                                        className="text-purple-400 text-xs hover:text-purple-300 ml-2 whitespace-nowrap"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <a
                                                    href={purchaseResult.modapkInfo.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    💾 Download
                                                </a>
                                                <a
                                                    href={purchaseResult.modapkInfo.tutorialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    📖 Tutorial
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {}
                                    {purchaseResult?.bypassInfo && (
                                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4 text-left">
                                            <p className="text-cyan-400 text-sm font-bold mb-3 text-center">🚀 Bypass Ativado!</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">UID</span>
                                                    <span className="text-white font-mono font-bold">{purchaseResult.bypassInfo.uid}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Duração</span>
                                                    <span className="text-cyan-400 font-bold">{purchaseResult.bypassInfo.days} dias</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 text-xs">Expira em</span>
                                                    <span className="text-yellow-400 font-bold">{purchaseResult.bypassInfo.expiration}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <a
                                                    href={purchaseResult.bypassInfo.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    💾 Download
                                                </a>
                                                <a
                                                    href={purchaseResult.bypassInfo.tutorialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-center py-2 rounded-lg text-sm font-bold"
                                                >
                                                    📖 Tutorial
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCloseSuccess}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium"
                                    >
                                        Avaliar Compra ⭐
                                    </button>
                                    <a
                                        href="https://br.trustpilot.com/review/lhubff.com.br"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00b67a] to-[#00a67a] hover:from-[#00a67a] hover:to-[#009a6a] text-white py-2.5 rounded-lg font-medium mt-2"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Avaliar no Trustpilot
                                    </a>
                                    <button
                                        onClick={() => setBuying(null)}
                                        className="w-full bg-neutral-800 text-neutral-400 py-2 rounded-lg mt-2 text-sm"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {}
                                    {(buying.type as string) === 'DIAMONDS' ? (
                                        <>
                                            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-4">
                                                <p className="text-blue-400 text-sm font-medium mb-2">💎 Diamantes</p>
                                                <p className="text-neutral-300 text-sm">
                                                    Selecione a quantidade e informe o <span className="text-white font-bold">Access Token</span> da conta Garena.
                                                </p>
                                                <p className="text-yellow-400 text-xs mt-2">
                                                    ⚠️ Cada conta só pode receber o mesmo pacote 1 única vez!
                                                </p>
                                            </div>

                                            {}
                                            <div className="mb-4">
                                                <label className="block text-sm text-neutral-300 mb-2">Escolha o Pacote</label>
                                                <select
                                                    value={selectedDiamondAmount}
                                                    onChange={(e) => {
                                                        setSelectedDiamondAmount(Number(e.target.value));
                                                        setDiamondPlayerInfo(null);
                                                        setAlreadyReceivedDiamond(false);
                                                        setErrorMsg("");
                                                    }}
                                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-white focus:border-blue-500 outline-none"
                                                >
                                                    {diamondPackages.map((pkg) => (
                                                        <option key={pkg.amount} value={pkg.amount} disabled={pkg.stock <= 0}>
                                                            {pkg.amount} 💎 - R$ {pkg.price.toFixed(2)} {pkg.stock > 0 ? `(${pkg.stock} disp.)` : '(Sem estoque)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {}
                                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400 text-sm">Preço:</span>
                                                    <span className="text-green-400 font-bold text-lg">
                                                        R$ {getSelectedDiamondPrice().toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-neutral-400 text-sm">Estoque:</span>
                                                    <span className={`font-bold ${getSelectedDiamondStock() > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {loadingDiamondStock ? 'Carregando...' : `${getSelectedDiamondStock()} disponíveis`}
                                                    </span>
                                                </div>
                                            </div>

                                            {}
                                            <label className="block text-sm text-neutral-300 mb-2">Access Token da Conta</label>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    value={accessToken}
                                                    onChange={(e) => setAccessToken(e.target.value)}
                                                    placeholder="Cole o access token aqui..."
                                                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 outline-none text-sm"
                                                />
                                                <button
                                                    onClick={handleVerifyToken}
                                                    disabled={verifyingToken || !accessToken || getSelectedDiamondStock() <= 0}
                                                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                                                >
                                                    {verifyingToken ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verificar'}
                                                </button>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}

                                            {diamondPlayerInfo && !alreadyReceivedDiamond && (
                                                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg mb-3">
                                                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
                                                        <Check size={14} />
                                                        Jogador verificado!
                                                    </div>
                                                    <div className="text-neutral-300 text-sm">
                                                        <span className="text-white font-bold">{diamondPlayerInfo.nickname}</span> • Nível {diamondPlayerInfo.level} • {diamondPlayerInfo.region}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (buying.type as string) === 'LIKES' ? (
                                        <>
                                            {}
                                            <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-lg mb-4">
                                                <p className="text-pink-400 text-sm font-medium mb-2">❤️ Likes</p>
                                                <p className="text-neutral-300 text-sm">
                                                    Selecione a quantidade de likes e informe o <span className="text-white font-bold">UID</span> do jogador.
                                                </p>
                                            </div>

                                            {}
                                            <div className="mb-4">
                                                <label className="block text-sm text-neutral-300 mb-2">Escolha a Quantidade</label>
                                                <select
                                                    value={selectedLikesAmount}
                                                    onChange={(e) => setSelectedLikesAmount(Number(e.target.value))}
                                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-white focus:border-pink-500 outline-none"
                                                >
                                                    {LIKES_PACKAGES.map((pkg) => (
                                                        <option key={pkg.amount} value={pkg.amount}>
                                                            {pkg.amount.toLocaleString()} ❤️ - R$ {pkg.price.toFixed(2)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {}
                                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400 text-sm">Preço:</span>
                                                    <span className="text-green-400 font-bold text-lg">
                                                        R$ {getSelectedLikesPrice().toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-neutral-400 text-sm">Estoque:</span>
                                                    <span className="text-green-400 font-bold">∞ disponíveis</span>
                                                </div>
                                            </div>

                                            {}
                                            <label className="block text-sm text-neutral-300 mb-2">UID do Jogador</label>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={gameUid}
                                                    onChange={(e) => setGameUid(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Digite o UID..."
                                                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:border-pink-500 outline-none"
                                                />
                                                <button
                                                    onClick={handleCheckUser}
                                                    disabled={checkingUser || !gameUid}
                                                    className="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                                                >
                                                    {checkingUser ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verificar'}
                                                </button>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}

                                            {playerInfo && (
                                                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg mb-3">
                                                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                                        <Check size={14} />
                                                        {playerInfo.nickname} • Nível {playerInfo.level}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (buying.type as string) === 'GUEST_ACCOUNT' ? (
                                        <>
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-4">
                                                <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Atenção</p>
                                                <p className="text-neutral-300 text-sm">
                                                    Você está comprando uma <span className="text-white font-bold">conta Guest</span> no formato UID:PASSWORD.
                                                </p>
                                                <p className="text-neutral-400 text-xs mt-2">
                                                    As credenciais serão exibidas após a compra e enviadas para seu email.
                                                </p>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}
                                        </>
                                    ) : (buying.type as string) === 'CHEAT' ? (
                                        <>
                                            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg mb-4">
                                                <p className="text-orange-400 text-sm font-medium mb-2">🎯 Cheat External</p>
                                                <p className="text-neutral-300 text-sm">
                                                    <span className="text-white font-bold">APENAS para emulador MSI ou BlueStacks!</span>
                                                </p>
                                                <p className="text-neutral-400 text-xs mt-2">
                                                    Não funciona em celular. A key será entregue após a compra.
                                                </p>
                                            </div>

                                            {}
                                            <div className="mb-4">
                                                <label className="block text-sm text-neutral-300 mb-2">Escolha o Plano</label>
                                                <select
                                                    value={cheatPlanType}
                                                    onChange={(e) => setCheatPlanType(e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly')}
                                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-white focus:border-orange-500 outline-none"
                                                >
                                                    <option value="daily">Diário (1 dia) - R$ 8,00 {cheatStock.daily ? `(${cheatStock.daily.stock} disp.)` : ''}</option>
                                                    <option value="weekly">Semanal (7 dias) - R$ 12,00 {cheatStock.weekly ? `(${cheatStock.weekly.stock} disp.)` : ''}</option>
                                                    <option value="biweekly">Quinzenal (15 dias) - R$ 28,00 {cheatStock.biweekly ? `(${cheatStock.biweekly.stock} disp.)` : ''}</option>
                                                    <option value="monthly">Mensal (30 dias) - R$ 40,00 {cheatStock.monthly ? `(${cheatStock.monthly.stock} disp.)` : ''}</option>
                                                </select>
                                            </div>

                                            {}
                                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400 text-sm">Preço:</span>
                                                    <span className="text-green-400 font-bold text-lg">
                                                        R$ {cheatPlanType === 'daily' ? '8,00' : cheatPlanType === 'weekly' ? '12,00' : cheatPlanType === 'biweekly' ? '28,00' : '40,00'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-neutral-400 text-sm">Estoque:</span>
                                                    <span className={`font-bold ${cheatStock[cheatPlanType]?.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {loadingCheatStock ? 'Carregando...' : cheatStock[cheatPlanType]?.stock ?? 0} disponíveis
                                                    </span>
                                                </div>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}
                                        </>
                                    ) : (buying.type as string) === 'MODAPK' ? (
                                        <>
                                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mb-4">
                                                <p className="text-green-400 text-sm font-medium mb-2">📱 ModApk Android</p>
                                                <p className="text-neutral-300 text-sm">
                                                    <span className="text-white font-bold">Para todos os dispositivos Android!</span>
                                                </p>
                                                <p className="text-neutral-400 text-xs mt-2">
                                                    A key será entregue após a compra.
                                                </p>
                                            </div>

                                            {}
                                            <div className="mb-4">
                                                <label className="block text-sm text-neutral-300 mb-2">Escolha o Plano</label>
                                                <select
                                                    value={modapkPlanType}
                                                    onChange={(e) => setModapkPlanType(e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly')}
                                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-white focus:border-green-500 outline-none"
                                                >
                                                    <option value="daily">Diário (1 dia) - R$ 12,00 {modapkStock.daily ? `(${modapkStock.daily.stock} disp.)` : ''}</option>
                                                    <option value="weekly">Semanal (7 dias) - R$ {modapkStock.weekly?.price?.toFixed(2) || '999,00'} {modapkStock.weekly ? `(${modapkStock.weekly.stock} disp.)` : ''}</option>
                                                    <option value="biweekly">Quinzenal (15 dias) - R$ {modapkStock.biweekly?.price?.toFixed(2) || '999,00'} {modapkStock.biweekly ? `(${modapkStock.biweekly.stock} disp.)` : ''}</option>
                                                    <option value="monthly">Mensal (30 dias) - R$ {modapkStock.monthly?.price?.toFixed(2) || '999,00'} {modapkStock.monthly ? `(${modapkStock.monthly.stock} disp.)` : ''}</option>
                                                </select>
                                            </div>

                                            {}
                                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400 text-sm">Preço:</span>
                                                    <span className="text-green-400 font-bold text-lg">
                                                        R$ {modapkStock[modapkPlanType]?.price?.toFixed(2) || (modapkPlanType === 'daily' ? '12,00' : '999,00')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-neutral-400 text-sm">Estoque:</span>
                                                    <span className={`font-bold ${modapkStock[modapkPlanType]?.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {loadingModapkStock ? 'Carregando...' : modapkStock[modapkPlanType]?.stock ?? 0} disponíveis
                                                    </span>
                                                </div>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {}
                                            <label className="block text-sm text-neutral-300 mb-2">UID do Jogador</label>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={gameUid}
                                                    onChange={(e) => setGameUid(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Digite o UID..."
                                                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:border-purple-500 outline-none"
                                                />
                                                <button
                                                    onClick={handleCheckUser}
                                                    disabled={checkingUser || !gameUid}
                                                    className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                                                >
                                                    {checkingUser ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verificar'}
                                                </button>
                                            </div>

                                            {errorMsg && (
                                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg mb-3">
                                                    <AlertTriangle size={14} />
                                                    {errorMsg}
                                                </div>
                                            )}

                                            {playerInfo && (
                                                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg mb-3">
                                                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                                        <Check size={14} />
                                                        {playerInfo.nickname} • Nível {playerInfo.level}
                                                    </div>
                                                </div>
                                            )}

                                            {}
                                            {buying.type === 'PASSE' && playerInfo && (
                                                <div className="mb-3">
                                                    <label className="block text-sm text-neutral-300 mb-2">
                                                        Mensagem do Presente <span className="text-neutral-500">(opcional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={giftMessage}
                                                        onChange={(e) => setGiftMessage(e.target.value)}
                                                        placeholder="Aqui está o seu presente! 🎁"
                                                        maxLength={100}
                                                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:border-purple-500 outline-none text-sm"
                                                    />
                                                    <p className="text-neutral-600 text-xs mt-1">
                                                        {giftMessage.length}/100 caracteres
                                                    </p>
                                                </div>
                                            )}

                                            {}
                                            {(buying.type as string) === 'TOKEN' && playerInfo && (
                                                <div className="mb-3">
                                                    <label className="block text-sm text-neutral-300 mb-2">
                                                        Quantidade de Caixas
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setTokenQuantity(Math.max(1, tokenQuantity - 1))}
                                                            className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xl font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={tokenQuantity}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 1;
                                                                setTokenQuantity(Math.max(1, Math.min(100, val)));
                                                            }}
                                                            min="1"
                                                            max="100"
                                                            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:border-purple-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => setTokenQuantity(Math.min(100, tokenQuantity + 1))}
                                                            className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xl font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <p className="text-neutral-500 text-xs">Mín: 1 | Máx: 100</p>
                                                        <p className="text-green-400 font-bold text-sm">
                                                            Total: R$ {(buying.price * tokenQuantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {}
                                    <button
                                        onClick={handleBuy}
                                        disabled={
                                            purchaseStatus === 'processing' ||
                                            ((buying.type as string) === 'DIAMONDS' && (!diamondPlayerInfo || alreadyReceivedDiamond || getSelectedDiamondStock() <= 0)) ||
                                            ((buying.type as string) === 'LIKES' && !playerInfo) ||
                                            ((buying.type as string) !== 'GUEST_ACCOUNT' && (buying.type as string) !== 'CHEAT' && (buying.type as string) !== 'MODAPK' && (buying.type as string) !== 'DIAMONDS' && (buying.type as string) !== 'LIKES' && !playerInfo) ||
                                            ((buying.type as string) === 'CHEAT' && (cheatStock[cheatPlanType]?.stock ?? 0) <= 0) ||
                                            ((buying.type as string) === 'MODAPK' && (modapkStock[modapkPlanType]?.stock ?? 0) <= 0) ||
                                            ((buying.type as string) === 'TOKEN' && !playerInfo)
                                        }
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {purchaseStatus === 'processing' ? (
                                            <><Loader2 className="animate-spin w-4 h-4" /> Processando...</>
                                        ) : (
                                            <><ShoppingCart size={16} /> Confirmar Compra</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            {showOutOfStock && outOfStockProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-sm p-5 text-center">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-2">Sem Estoque</h3>
                        <p className="text-neutral-400 text-sm mb-4">
                            <span className="text-white font-bold">{outOfStockProduct.name}</span> está indisponível.
                        </p>
                        <p className="text-purple-400 text-xs mb-4">📢 Siga <span className="font-bold">@lhubofc</span> para saber quando voltar!</p>

                        <div className="flex gap-2 mb-3">
                            <a
                                href="https://instagram.com/lhubofc"
                                target="_blank"
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-lg text-sm"
                            >
                                Instagram
                            </a>
                            <a
                                href={process.env.NEXT_PUBLIC_TELEGRAM_URL || '#'}
                                target="_blank"
                                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-sm"
                            >
                                Telegram
                            </a>
                        </div>
                        <button
                            onClick={() => { setShowOutOfStock(false); setOutOfStockProduct(null); }}
                            className="w-full bg-neutral-800 text-white py-2 rounded-lg text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {}
            <RatingModal
                isOpen={showRating}
                onClose={() => {
                    setShowRating(false);
                    setRatingTransactionId("");
                    setRatingProductName("");
                }}
                transactionId={ratingTransactionId}
                productName={ratingProductName}
                onSubmit={handleSubmitRating}
            />
        </div>
    );
}
