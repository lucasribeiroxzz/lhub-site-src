"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Heart, RefreshCw, AlertTriangle, Calendar, TrendingUp, Loader2, X, Copy, ExternalLink, Receipt, ShoppingBag, Wallet, User, QrCode, Check, Zap, Search, Download, BookOpen, Pause, Play } from "lucide-react";
import { decryptData } from "@/lib/crypto";

interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'PURCHASE';
    description: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    pixCode?: string;
    qrCodeUrl?: string;

    gameUid?: string;
    playerNick?: string;
    productName?: string;
    likesAdded?: number;
    couponCode?: string;
    discount?: number;

    guestAccountUid?: string;
    guestAccountPassword?: string;
}

interface LikesDelivery {
    date: string;
    likesAdded: number;
    success: boolean;
    error?: string;
}

interface LikesOrder {
    id: string;
    playerId: string;
    playerName?: string;
    region: string;
    totalLikes: number;
    likesDelivered: number;
    likesPerDay: number;
    daysTotal: number;
    daysCompleted: number;
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ERROR';
    lastDelivery?: string;
    nextDelivery?: string;
    errorCount: number;
    lastError?: string;
    createdAt: string;
    history: LikesDelivery[];
}

interface PurchaseDetails {
    productName: string;
    uid: string;
    nick?: string;
    likesAdded?: number;
    coupon?: string;
    discount?: number;
}

interface BypassStatus {
    exists: boolean;
    active: boolean;
    uid: string;
    daysLeft?: number;
    hoursLeft?: number;
    expiration?: string;
    expirationFormatted?: string;
    message?: string;
}

export default function HistoricoPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [likesOrders, setLikesOrders] = useState<LikesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLikes, setLoadingLikes] = useState(true);
    const [activeTab, setActiveTab] = useState<'transactions' | 'likes' | 'bypass'>('transactions');
    const [filter, setFilter] = useState<'ALL' | 'recargas' | 'compras'>('ALL');
    const [selectedOrder, setSelectedOrder] = useState<LikesOrder | null>(null);
    const [userName, setUserName] = useState<string>('');

    const [bypassUid, setBypassUid] = useState('');
    const [bypassStatus, setBypassStatus] = useState<BypassStatus | null>(null);
    const [loadingBypass, setLoadingBypass] = useState(false);
    const [bypassError, setBypassError] = useState('');

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [copied, setCopied] = useState(false);

    const [pendingPixTransaction, setPendingPixTransaction] = useState<Transaction | null>(null);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [togglingOrder, setTogglingOrder] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (selectedTransaction || pendingPixTransaction) {

            window.scrollTo(0, 0);

            const scrollContainer = document.querySelector('.overflow-y-auto.flex-1');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }

            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedTransaction, pendingPixTransaction]);

    useEffect(() => {
        fetchData();
        fetchLikesOrders();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (pendingPixTransaction && pendingPixTransaction.status === 'PENDING') {
            setCheckingPayment(true);

            interval = setInterval(async () => {
                try {
                    const res = await fetch("/api/wallet/check", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            transactionId: pendingPixTransaction.id
                        })
                    });
                    const data = await res.json();

                    if (data.success && data.status === "COMPLETO") {
                        clearInterval(interval);
                        setCheckingPayment(false);
                        setPaymentSuccess(true);
                        window.dispatchEvent(new Event("balance_update"));

                        fetchData();

                        setTimeout(() => {
                            setPendingPixTransaction(null);
                            setPaymentSuccess(false);
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [pendingPixTransaction]);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/user/me");
            const data = await res.json();
            if (data.success && data.data) {
                setTransactions(data.data.transactions || []);
                setUserName(data.data.name || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLikesOrders = async () => {
        try {
            const res = await fetch("/api/likes/orders");
            const data = await res.json();
            if (data.success && data.data) {
                const decrypted = decryptData(data.data);
                setLikesOrders(decrypted || []);
            }
        } catch (e) {
            console.error("Erro ao buscar pedidos de likes:", e);
        } finally {
            setLoadingLikes(false);
        }
    };

    const toggleLikesOrder = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        setTogglingOrder(orderId);
        try {
            const res = await fetch('/api/likes/orders/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await res.json();

            if (data.success) {

                fetchLikesOrders();
            } else {
                console.error('Erro ao alternar pausa:', data.message);
            }
        } catch (e) {
            console.error('Erro ao alternar pausa:', e);
        } finally {
            setTogglingOrder(null);
        }
    };

    const checkBypassStatus = async () => {
        if (!bypassUid.trim()) {
            setBypassError('Digite um UID para verificar');
            return;
        }

        if (!/^\d+$/.test(bypassUid)) {
            setBypassError('UID deve conter apenas números');
            return;
        }

        setLoadingBypass(true);
        setBypassError('');
        setBypassStatus(null);

        try {
            const res = await fetch('/api/bypass/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: bypassUid })
            });
            const data = await res.json();

            if (data.success) {
                setBypassStatus({
                    exists: data.exists,
                    active: data.active,
                    uid: data.uid,
                    daysLeft: data.daysLeft,
                    hoursLeft: data.hoursLeft,
                    expiration: data.expiration,
                    expirationFormatted: data.expirationFormatted,
                    message: data.message
                });
            } else {
                setBypassError(data.message || 'Erro ao verificar bypass');
            }
        } catch (e) {
            console.error('Erro ao verificar bypass:', e);
            setBypassError('Erro ao conectar com o servidor');
        } finally {
            setLoadingBypass(false);
        }
    };

    const filtered = transactions.filter(t => {
        if (filter === 'recargas') return t.type === 'DEPOSIT';
        if (filter === 'compras') return t.type === 'PURCHASE';
        return true;
    });

    const extractPurchaseDetails = (description: string): PurchaseDetails => {
        const details: PurchaseDetails = {
            productName: 'Produto',
            uid: ''
        };

        const productMatch = description.match(/Compra:\s*([^para]+)\s*para/i);
        if (productMatch) {
            details.productName = productMatch[1].trim();
        }

        const uidMatch = description.match(/UID\s*(\d+)/i);
        if (uidMatch) {
            details.uid = uidMatch[1];
        }

        const likesMatch = description.match(/\+(\d+)\s*likes/i);
        if (likesMatch) {
            details.likesAdded = parseInt(likesMatch[1]);
        }

        const couponMatch = description.match(/Cupom:\s*([^,)]+)/i);
        if (couponMatch) {
            details.coupon = couponMatch[1].trim();
        }

        const discountMatch = description.match(/Desconto:\s*R\$\s*([\d.,]+)/i);
        if (discountMatch) {
            details.discount = parseFloat(discountMatch[1].replace(',', '.'));
        }

        return details;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-green-500 bg-green-500/10';
            case 'COMPLETED': return 'text-blue-500 bg-blue-500/10';
            case 'PAUSED': return 'text-yellow-500 bg-yellow-500/10';
            case 'ERROR': return 'text-red-500 bg-red-500/10';
            default: return 'text-neutral-500 bg-neutral-500/10';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Ativo';
            case 'COMPLETED': return 'Concluído';
            case 'PAUSED': return 'Pausado';
            case 'ERROR': return 'Erro';
            case 'PENDING': return 'Pendente';
            case 'FAILED': return 'Falhou';
            default: return status;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysRemaining = (order: LikesOrder) => {
        const remaining = order.daysTotal - order.daysCompleted;
        return remaining > 0 ? remaining : 0;
    };

    const getProgress = (order: LikesOrder) => {
        return Math.round((order.likesDelivered / order.totalLikes) * 100);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const PurchaseReceiptModal = ({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) => {

        const fallbackDetails = extractPurchaseDetails(transaction.description);

        const productName = transaction.productName || fallbackDetails.productName;
        const gameUid = transaction.gameUid || fallbackDetails.uid;
        const playerNick = transaction.playerNick || fallbackDetails.nick;
        const likesAdded = transaction.likesAdded || fallbackDetails.likesAdded;
        const couponCode = transaction.couponCode || fallbackDetails.coupon;
        const discount = transaction.discount || fallbackDetails.discount;
        const guestAccountUid = transaction.guestAccountUid;
        const guestAccountPassword = transaction.guestAccountPassword;
        const isGuestAccount = productName?.toLowerCase().includes('nível 15') || productName?.toLowerCase().includes('guest');

        return (
            <div
                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    overflowY: 'auto'
                }}
            >
                <div
                    className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-[340px] sm:max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        margin: 'auto',
                        position: 'relative'
                    }}
                >
                    {}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-3 sm:p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Comprovante</h3>
                                    <p className="text-purple-200 text-[10px] sm:text-xs md:text-sm">Compra realizada</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="p-3 sm:p-4 md:p-6 space-y-2.5 sm:space-y-3 md:space-y-4">
                        {}
                        <div className="flex justify-center">
                            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${transaction.status === 'COMPLETED'
                                ? 'bg-green-500/20 text-green-400'
                                : transaction.status === 'PENDING'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                {transaction.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                                {transaction.status === 'PENDING' && <Clock className="w-3 h-3 sm:w-4 sm:h-4" />}
                                {transaction.status === 'FAILED' && <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                                {getStatusLabel(transaction.status)}
                            </div>
                        </div>

                        {}
                        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                            {}
                            <div className="bg-neutral-800/50 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Produto</p>
                                <p className="text-white font-semibold text-xs sm:text-sm md:text-base">{productName}</p>
                            </div>

                            {}
                            {gameUid && !isGuestAccount && (
                                <div className="bg-neutral-800/50 rounded-xl p-2.5 sm:p-3 md:p-4">
                                    <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">UID do Jogador</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-white font-mono font-semibold text-xs sm:text-sm md:text-base">{gameUid}</p>
                                        <button
                                            onClick={() => copyToClipboard(gameUid)}
                                            className="p-1 sm:p-1.5 hover:bg-neutral-700 rounded-lg transition-colors"
                                            title="Copiar UID"
                                        >
                                            <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {}
                            {isGuestAccount && guestAccountUid && guestAccountPassword && (
                                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-2.5 sm:p-3 md:p-4">
                                    <p className="text-green-300 text-[10px] sm:text-xs mb-2 sm:mb-3 font-semibold text-center">🔐 Credenciais da Conta</p>
                                    <div className="bg-neutral-950/50 rounded-lg p-2 sm:p-3">
                                        <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5">Conta (UID:PASSWORD)</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-white font-mono font-bold text-xs sm:text-sm break-all">{guestAccountUid}:{guestAccountPassword}</p>
                                            <button
                                                onClick={() => copyToClipboard(`${guestAccountUid}:${guestAccountPassword}`)}
                                                className="p-1 hover:bg-neutral-700 rounded-lg transition-colors ml-2 flex-shrink-0"
                                                title="Copiar Conta"
                                            >
                                                <Copy className="w-3 h-3 text-neutral-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-yellow-400 text-[10px] sm:text-xs mt-2 text-center">
                                        ⚠️ Guarde essas credenciais!
                                    </p>
                                </div>
                            )}

                            {}
                            {playerNick && (
                                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-2.5 sm:p-3 md:p-4">
                                    <p className="text-blue-300 text-[10px] sm:text-xs mb-0.5 sm:mb-1 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        Nickname do Jogador
                                    </p>
                                    <p className="text-white font-bold text-sm sm:text-base md:text-lg">{playerNick}</p>
                                </div>
                            )}

                            {}
                            <div className="bg-neutral-800/50 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Comprador</p>
                                <p className="text-white font-semibold text-xs sm:text-sm md:text-base">{userName || 'Usuário'}</p>
                            </div>

                            {}
                            {likesAdded && (
                                <div className="bg-neutral-800/50 rounded-xl p-2.5 sm:p-3 md:p-4">
                                    <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Likes Enviados</p>
                                    <p className="text-green-400 font-semibold text-xs sm:text-sm md:text-base">+{likesAdded} likes</p>
                                </div>
                            )}

                            {}
                            {couponCode && (
                                <div className="bg-neutral-800/50 rounded-xl p-2.5 sm:p-3 md:p-4">
                                    <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Cupom Aplicado</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-purple-400 font-semibold text-xs sm:text-sm md:text-base">{couponCode}</p>
                                        {discount && (
                                            <span className="text-green-400 text-xs sm:text-sm">-R$ {discount.toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {}
                            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <p className="text-purple-300 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Valor Pago</p>
                                <p className="text-white font-bold text-lg sm:text-xl md:text-2xl">R$ {transaction.amount.toFixed(2)}</p>
                            </div>

                            {}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="bg-neutral-800/50 rounded-xl p-2 sm:p-3">
                                    <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Data</p>
                                    <p className="text-white text-[10px] sm:text-xs md:text-sm">{formatDate(transaction.date)}</p>
                                </div>
                                <div className="bg-neutral-800/50 rounded-xl p-2 sm:p-3">
                                    <p className="text-neutral-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">ID</p>
                                    <p className="text-white text-[10px] sm:text-xs font-mono truncate" title={transaction.id}>
                                        {transaction.id.slice(0, 10)}...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="p-3 sm:p-4 md:p-6 pt-0">
                        <button
                            onClick={onClose}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 sm:py-3 text-sm sm:text-base rounded-xl transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-20 md:pb-0">
            {}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Histórico</h2>
                <p className="text-neutral-400 text-xs sm:text-sm mt-1">Suas transações e pedidos</p>
            </div>

            {}
            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-1 px-1">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${activeTab === 'transactions'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-800/50 text-neutral-400 hover:text-white border border-neutral-700'
                        }`}
                >
                    <Wallet size={14} className="sm:w-4 sm:h-4" />
                    Transações
                </button>
                <button
                    onClick={() => setActiveTab('likes')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm ${activeTab === 'likes'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-800/50 text-neutral-400 hover:text-white border border-neutral-700'
                        }`}
                >
                    <Heart size={14} className="sm:w-4 sm:h-4" />
                    Meus Likes
                    {likesOrders.filter(o => o.status === 'ACTIVE').length > 0 && (
                        <span className="bg-green-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                            {likesOrders.filter(o => o.status === 'ACTIVE').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('bypass')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm ${activeTab === 'bypass'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-neutral-800/50 text-neutral-400 hover:text-white border border-neutral-700'
                        }`}
                >
                    <Zap size={14} className="sm:w-4 sm:h-4" />
                    Verificar Bypass
                </button>
            </div>

            {}
            {activeTab === 'transactions' && (
                <>
                    {}
                    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-1 px-1">
                        {[
                            { key: 'ALL', label: 'Todos', icon: null },
                            { key: 'recargas', label: 'Recargas', icon: <ArrowDownLeft size={12} className="sm:w-[14px] sm:h-[14px]" /> },
                            { key: 'compras', label: 'Compras', icon: <ShoppingBag size={12} className="sm:w-[14px] sm:h-[14px]" /> }
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key as any)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-1.5 ${filter === f.key
                                    ? 'bg-white text-black'
                                    : 'bg-neutral-800/50 text-neutral-400 hover:text-white'
                                    }`}
                            >
                                {f.icon}
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {}
                    <div className="space-y-2 sm:space-y-3">
                        {loading && (
                            <div className="text-center py-8 sm:py-12">
                                <Loader2 className="animate-spin mx-auto mb-3 sm:mb-4 text-purple-500 w-6 h-6 sm:w-8 sm:h-8" />
                                <p className="text-neutral-500 text-sm">Carregando...</p>
                            </div>
                        )}

                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-8 sm:py-12 text-neutral-500">
                                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📋</div>
                                <p className="text-sm">Nenhuma transação encontrada.</p>
                            </div>
                        )}

                        {filtered.map(t => (
                            <div
                                key={t.id}
                                className={`bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 transition-all ${(t.type === 'PURCHASE' && t.status === 'COMPLETED') || (t.type === 'DEPOSIT' && t.status === 'PENDING')
                                    ? 'cursor-pointer hover:border-purple-500/50 hover:bg-neutral-800/50 active:scale-[0.99]'
                                    : ''
                                    }`}
                                onClick={() => {
                                    if (t.type === 'PURCHASE' && t.status === 'COMPLETED') {
                                        setSelectedTransaction(t);
                                    } else if (t.type === 'DEPOSIT' && t.status === 'PENDING' && t.pixCode && t.qrCodeUrl) {
                                        setPendingPixTransaction(t);
                                    }
                                }}
                            >
                                {}
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${t.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-purple-500/10 text-purple-500'
                                    }`}>
                                    {t.type === 'DEPOSIT' ? <ArrowDownLeft size={18} className="sm:w-5 sm:h-5" /> : <ShoppingBag size={18} className="sm:w-5 sm:h-5" />}
                                </div>

                                {}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-xs sm:text-sm md:text-base truncate">{t.description}</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500">{new Date(t.date).toLocaleString('pt-BR')}</p>
                                </div>

                                {}
                                <div className="text-right shrink-0">
                                    <p className={`font-bold text-xs sm:text-sm md:text-base ${t.type === 'DEPOSIT' ? 'text-green-400' : 'text-white'}`}>
                                        {t.type === 'DEPOSIT' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5 sm:mt-1">
                                        {t.status === 'COMPLETED' && <CheckCircle size={10} className="sm:w-3 sm:h-3 text-green-500" />}
                                        {t.status === 'PENDING' && <Clock size={10} className="sm:w-3 sm:h-3 text-yellow-500" />}
                                        {t.status === 'FAILED' && <XCircle size={10} className="sm:w-3 sm:h-3 text-red-500" />}
                                        <span className="text-[10px] sm:text-xs text-neutral-500">
                                            {t.status === 'COMPLETED' ? 'Concluído' : t.status === 'PENDING' ? 'Pendente' : 'Falhou'}
                                        </span>
                                    </div>

                                    {}
                                    {t.type === 'PURCHASE' && t.status === 'COMPLETED' && (
                                        <p className="text-[9px] sm:text-[10px] text-purple-400 mt-0.5 sm:mt-1 flex items-center justify-end gap-0.5 sm:gap-1">
                                            <Receipt size={9} className="sm:w-[10px] sm:h-[10px]" />
                                            Ver comprovante
                                        </p>
                                    )}

                                    {}
                                    {t.type === 'DEPOSIT' && t.status === 'PENDING' && t.pixCode && (
                                        <p className="text-[9px] sm:text-[10px] text-yellow-400 mt-0.5 sm:mt-1 flex items-center justify-end gap-0.5 sm:gap-1">
                                            <QrCode size={9} className="sm:w-[10px] sm:h-[10px]" />
                                            Ver QR Code
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {}
            {activeTab === 'likes' && (
                <div className="space-y-3 sm:space-y-4">
                    {}
                    {likesOrders.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-400 mb-0.5 sm:mb-1">
                                    <Heart size={12} className="sm:w-[14px] sm:h-[14px]" />
                                    <span className="text-[10px] sm:text-xs">Total</span>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl font-bold text-white">
                                    {likesOrders.reduce((sum, o) => sum + o.totalLikes, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-400 mb-0.5 sm:mb-1">
                                    <TrendingUp size={12} className="sm:w-[14px] sm:h-[14px]" />
                                    <span className="text-[10px] sm:text-xs">Enviados</span>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl font-bold text-green-400">
                                    {likesOrders.reduce((sum, o) => sum + o.likesDelivered, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-400 mb-0.5 sm:mb-1">
                                    <RefreshCw size={12} className="sm:w-[14px] sm:h-[14px]" />
                                    <span className="text-[10px] sm:text-xs">Ativos</span>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl font-bold text-blue-400">
                                    {likesOrders.filter(o => o.status === 'ACTIVE').length}
                                </p>
                            </div>
                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 sm:p-3 md:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-400 mb-0.5 sm:mb-1">
                                    <Calendar size={12} className="sm:w-[14px] sm:h-[14px]" />
                                    <span className="text-[10px] sm:text-xs">Dias Rest.</span>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-400">
                                    {likesOrders.filter(o => o.status === 'ACTIVE').reduce((sum, o) => sum + getDaysRemaining(o), 0)}
                                </p>
                            </div>
                        </div>
                    )}

                    {loadingLikes && (
                        <div className="text-center py-8 sm:py-12">
                            <Loader2 className="animate-spin mx-auto mb-3 sm:mb-4 text-purple-500 w-6 h-6 sm:w-8 sm:h-8" />
                            <p className="text-neutral-500 text-sm">Carregando pedidos...</p>
                        </div>
                    )}

                    {!loadingLikes && likesOrders.length === 0 && (
                        <div className="text-center py-8 sm:py-12 text-neutral-500">
                            <Heart size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                            <p className="font-medium text-sm">Você ainda não tem pedidos de likes.</p>
                            <p className="text-xs sm:text-sm mt-1 sm:mt-2">Compre likes na loja para começar!</p>
                        </div>
                    )}

                    {}
                    {likesOrders.map(order => (
                        <div
                            key={order.id}
                            className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 sm:p-4 md:p-5 cursor-pointer hover:border-purple-500/30 transition-colors"
                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        >
                            {}
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}>
                                        <Heart size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm sm:text-base md:text-lg">
                                            {order.totalLikes.toLocaleString()} Likes
                                        </p>
                                        <p className="text-[10px] sm:text-xs md:text-sm text-neutral-400">
                                            UID: {order.playerId}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>

                            {}
                            <div className="mb-3 sm:mb-4">
                                <div className="flex justify-between text-[10px] sm:text-xs md:text-sm mb-1.5 sm:mb-2">
                                    <span className="text-neutral-400">Progresso</span>
                                    <span className="text-white font-medium">
                                        {order.likesDelivered.toLocaleString()} / {order.totalLikes.toLocaleString()} ({getProgress(order)}%)
                                    </span>
                                </div>
                                <div className="h-1.5 sm:h-2 md:h-3 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${order.status === 'COMPLETED' ? 'bg-blue-500' :
                                            order.status === 'ERROR' ? 'bg-red-500' :
                                                'bg-green-500'
                                            }`}
                                        style={{ width: `${getProgress(order)}%` }}
                                    />
                                </div>
                            </div>

                            {}
                            {order.status !== 'COMPLETED' && (
                                <div className="mb-3 sm:mb-4">
                                    <button
                                        onClick={(e) => toggleLikesOrder(order.id, e)}
                                        disabled={togglingOrder === order.id}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${order.status === 'PAUSED'
                                            ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                                            : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {togglingOrder === order.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : order.status === 'PAUSED' ? (
                                            <>
                                                <Play size={16} />
                                                Retomar Envio
                                            </>
                                        ) : (
                                            <>
                                                <Pause size={16} />
                                                Pausar Envio
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 text-center">
                                <div className="bg-neutral-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-neutral-500 mb-0.5">Dias</p>
                                    <p className="font-bold text-white text-xs sm:text-sm">{order.daysCompleted}/{order.daysTotal}</p>
                                </div>
                                <div className="bg-neutral-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-neutral-500 mb-0.5">Por Dia</p>
                                    <p className="font-bold text-white text-xs sm:text-sm">{order.likesPerDay}</p>
                                </div>
                                <div className="bg-neutral-800/50 rounded-lg p-1.5 sm:p-2 md:p-3">
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-neutral-500 mb-0.5">Restantes</p>
                                    <p className="font-bold text-yellow-400 text-xs sm:text-sm">{getDaysRemaining(order)}</p>
                                </div>
                            </div>

                            {}
                            {order.status === 'ERROR' && order.lastError && (
                                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-1.5 sm:gap-2">
                                    <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-red-400 font-medium text-xs sm:text-sm">Erro no envio</p>
                                        <p className="text-[10px] sm:text-xs text-red-300/70 truncate">{order.lastError}</p>
                                    </div>
                                </div>
                            )}

                            {}
                            {selectedOrder?.id === order.id && order.history.length > 0 && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-800">
                                    <h4 className="font-bold text-white text-xs sm:text-sm mb-2 sm:mb-3">Histórico de Entregas</h4>
                                    <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                                        {order.history.slice().reverse().map((delivery, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm ${delivery.success ? 'bg-green-500/10' : 'bg-red-500/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    {delivery.success ? (
                                                        <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px] text-green-500" />
                                                    ) : (
                                                        <XCircle size={12} className="sm:w-[14px] sm:h-[14px] text-red-500" />
                                                    )}
                                                    <span className="text-[10px] sm:text-xs text-neutral-300">
                                                        {formatDate(delivery.date)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    {delivery.success ? (
                                                        <span className="text-green-400 font-medium text-[10px] sm:text-xs">
                                                            +{delivery.likesAdded}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-400 text-[10px] sm:text-xs">
                                                            Falha
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {}
            {activeTab === 'bypass' && (
                <div className="space-y-4 sm:space-y-6">
                    {}
                    <div className="bg-gradient-to-br from-cyan-900/20 to-neutral-900 border border-cyan-500/20 rounded-2xl p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white">Verificar Bypass</h3>
                                <p className="text-xs sm:text-sm text-neutral-400">Consulte o status do seu bypass</p>
                            </div>
                        </div>

                        {}
                        <div className="flex gap-2 sm:gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={bypassUid}
                                    onChange={(e) => setBypassUid(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Digite o UID do jogador"
                                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 text-sm sm:text-base"
                                    onKeyDown={(e) => e.key === 'Enter' && checkBypassStatus()}
                                />
                            </div>
                            <button
                                onClick={checkBypassStatus}
                                disabled={loadingBypass}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white px-4 sm:px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                {loadingBypass ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                                <span className="hidden sm:inline">Verificar</span>
                            </button>
                        </div>

                        {}
                        {bypassError && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-400 text-sm">{bypassError}</p>
                            </div>
                        )}

                        {}
                        {bypassStatus && (
                            <div className={`mt-4 p-4 sm:p-5 rounded-xl border ${bypassStatus.exists && bypassStatus.active
                                ? 'bg-green-500/10 border-green-500/20'
                                : bypassStatus.exists && !bypassStatus.active
                                    ? 'bg-yellow-500/10 border-yellow-500/20'
                                    : 'bg-neutral-800/50 border-neutral-700'
                                }`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {bypassStatus.exists && bypassStatus.active ? (
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    ) : bypassStatus.exists && !bypassStatus.active ? (
                                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-neutral-400" />
                                    )}
                                    <div>
                                        <h4 className="font-bold text-white text-sm sm:text-base">
                                            {bypassStatus.exists && bypassStatus.active
                                                ? 'Bypass Ativo!'
                                                : bypassStatus.exists && !bypassStatus.active
                                                    ? 'Bypass Expirado'
                                                    : 'Bypass Não Encontrado'}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-neutral-400">UID: {bypassStatus.uid}</p>
                                    </div>
                                </div>

                                {bypassStatus.exists && (
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-neutral-800/50 rounded-lg p-3">
                                            <p className="text-[10px] sm:text-xs text-neutral-500 mb-1">Dias Restantes</p>
                                            <p className={`text-lg sm:text-xl font-bold ${bypassStatus.active ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {bypassStatus.daysLeft || 0}
                                            </p>
                                        </div>
                                        <div className="bg-neutral-800/50 rounded-lg p-3">
                                            <p className="text-[10px] sm:text-xs text-neutral-500 mb-1">Horas Restantes</p>
                                            <p className={`text-lg sm:text-xl font-bold ${bypassStatus.active ? 'text-cyan-400' : 'text-red-400'
                                                }`}>
                                                {bypassStatus.hoursLeft || 0}
                                            </p>
                                        </div>
                                        <div className="col-span-2 bg-neutral-800/50 rounded-lg p-3">
                                            <p className="text-[10px] sm:text-xs text-neutral-500 mb-1">Expira em</p>
                                            <p className="text-sm sm:text-base font-bold text-white">
                                                {bypassStatus.expirationFormatted || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!bypassStatus.exists && (
                                    <p className="text-neutral-400 text-sm text-center py-2">
                                        Este UID não possui bypass ativo. Adquira na loja!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
                        <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            Como funciona o Bypass?
                        </h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-neutral-400">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">•</span>
                                O bypass permite acessar recursos exclusivos por 30 dias
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">•</span>
                                Após a compra, você recebe o link de download e tutorial
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">•</span>
                                Use esta página para verificar quantos dias restam
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">•</span>
                                Renove antes de expirar para não perder o acesso
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {}
            {selectedTransaction && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedTransaction(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div
                        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Receipt className="w-6 h-6 text-white" />
                                    <h3 className="text-lg font-bold text-white">Comprovante</h3>
                                </div>
                                <button onClick={() => setSelectedTransaction(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="bg-neutral-800/50 rounded-xl p-3">
                                <p className="text-neutral-400 text-xs mb-1">Produto</p>
                                <p className="text-white font-semibold">{selectedTransaction.productName || selectedTransaction.description}</p>
                            </div>
                            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-3">
                                <p className="text-purple-300 text-xs mb-1">Valor</p>
                                <p className="text-white font-bold text-xl">R$ {selectedTransaction.amount.toFixed(2)}</p>
                            </div>
                            <div className="bg-neutral-800/50 rounded-xl p-3">
                                <p className="text-neutral-400 text-xs mb-1">Data</p>
                                <p className="text-white">{formatDate(selectedTransaction.date)}</p>
                            </div>
                        </div>
                        <div className="p-4 pt-0">
                            <button onClick={() => setSelectedTransaction(null)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {mounted && pendingPixTransaction && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
                    onClick={() => setPendingPixTransaction(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        overflowY: 'auto'
                    }}
                >
                    <div
                        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            margin: 'auto',
                            position: 'relative'
                        }}
                    >
                        {}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <QrCode size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {paymentSuccess ? 'Pagamento Aprovado!' : 'PIX Pendente'}
                                    </h3>
                                    <p className="text-green-100 text-sm">R$ {pendingPixTransaction.amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingPixTransaction(null)}
                                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>

                        {}
                        {paymentSuccess ? (
                            <div className="p-8 flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Check size={40} className="text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Pagamento Confirmado!</h3>
                                <p className="text-neutral-400 text-center">Seu saldo foi atualizado com sucesso.</p>
                            </div>
                        ) : (
                            <div className="p-5">
                                {}
                                <div className="bg-white p-4 rounded-2xl w-52 h-52 mx-auto mb-5 flex items-center justify-center">
                                    <img
                                        src={pendingPixTransaction.qrCodeUrl}
                                        alt="QR Code Pix"
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {}
                                <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-4 mb-4">
                                    <p className="text-xs text-neutral-500 mb-2">Pix Copia e Cola</p>
                                    <div className="flex items-center gap-3">
                                        <p className="flex-1 text-sm truncate font-mono text-neutral-300">{pendingPixTransaction.pixCode}</p>
                                        <button
                                            onClick={() => copyToClipboard(pendingPixTransaction.pixCode || '')}
                                            className={`p-3 rounded-xl transition-all shrink-0 ${copied
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                }`}
                                        >
                                            {copied ? <Check size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {}
                                <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm mb-4">
                                    {checkingPayment && (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            <span>Aguardando pagamento...</span>
                                        </>
                                    )}
                                </div>

                                {}
                                <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
                                    <p className="text-xs text-neutral-400 font-medium">Como pagar:</p>
                                    <ol className="text-xs text-neutral-500 space-y-1 list-decimal list-inside">
                                        <li>Abra o app do seu banco</li>
                                        <li>Escolha pagar via PIX</li>
                                        <li>Escaneie o QR Code ou cole o código</li>
                                        <li>Confirme o pagamento</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {}
                        {!paymentSuccess && (
                            <div className="p-4 pt-0">
                                <button
                                    onClick={() => setPendingPixTransaction(null)}
                                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-3 rounded-xl transition-colors text-sm"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.getElementById('modal-root') || document.body
            )}
        </div>
    );
}
