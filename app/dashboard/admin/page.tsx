"use client";

import { useEffect, useState } from "react";
import { Edit2, Package, Save, X, Users, RefreshCw, Upload, Trash2, Diamond, Ticket, TrendingUp, DollarSign, ShoppingCart, BarChart3, Tag, Plus, Percent, Zap, Download, Search, Ban, Bell, Send, UserX, Wallet, Gift, MapPin, Globe, Activity } from "lucide-react";
import { decryptData } from "@/lib/crypto";

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

interface GarenaAccount {
    uid: string;
    password?: string;
    diamonds: number;
    passes: number;
    presentesSentToday: number;
    status: string;
    lastCheck?: string;
    addedAt?: string;
}

interface ContaSemDima {
    uid: string;
    password: string;
    movedAt: string;
    lastDiamonds: number;
    lastPasses: number;
}

interface AccountStats {
    totalAccounts: number;
    activeAccounts: number;
    errorAccounts: number;
    totalDiamonds: number;
    totalPassesAvailable: number;
}

interface Coupon {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minPurchase: number;
    maxUses: number;
    usedCount: number;
    usedBy: string[];
    expiresAt?: string;
    active: boolean;
    createdAt: string;
}

interface GuestAccount {
    id: string;
    uid: string;
    password: string;
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

interface AdminUser {
    id: string;
    email: string;
    name: string;
    balance: number;
    role: 'USER' | 'ADMIN';
    isVerified: boolean;
    banned?: boolean;
    customDiscount?: {
        type: 'PERCENT' | 'FIXED';
        value: number;
        expiresAt?: string;
        appliesTo?: string[];
        setBy?: string;
        setAt?: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Metrics {
    summary: {
        totalUsers: number;
        totalDeposits: number;
        totalPurchases: number;
        totalUserBalance: number;
        passesEnviados: number;
    };
    deposits: {
        today: { count: number; total: number };
        thisWeek: { count: number; total: number };
        thisMonth: { count: number; total: number };
        allTime: { count: number; total: number };
        pending: { count: number };
    };
    sales: {
        today: { count: number; total: number; passes: number };
        thisWeek: { count: number; total: number };
        thisMonth: { count: number; total: number };
        allTime: { count: number; total: number; passes: number };
    };
    users: {
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        totalBalance: number;
    };
    accounts: AccountStats;
    recentTransactions: {
        id: string;
        type: string;
        amount: number;
        status: string;
        date: string;
        description: string;
    }[];
    generatedAt: string;
}

interface AnalyticsData {
    summary: {
        visitsToday: number;
        visitsWeek: number;
        visitsTotal: number;
        purchasesToday: number;
        purchasesWeek: number;
        purchasesTotal: number;
        revenueToday: number;
        revenueWeek: number;
    };
    visitsByState: { state: string; count: number }[];
    visitsByCity: { city: string; state: string; count: number }[];
    purchasesByState: { state: string; count: number; total: number }[];
    purchasesByCity: { city: string; state: string; count: number; total: number }[];
}

interface BypassUID {
    uid: string;
    days_left: number;
    hours_left: number;
    expiration: string;
    expiration_formatted: string;
    active: boolean;
}

interface BypassStats {
    total_uids: number;
    active_uids: number;
    expired_uids: number;
}

interface CheatKey {
    id: string;
    key: string;
    planType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    planName?: string;
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

interface CheatKeyStats {
    total: number;
    available: number;
    sold: number;
    byPlan: Record<string, { available: number; sold: number }>;
}

interface TokenAccount {
    uid: string;
    password: string;
    diamonds: number;
    caixas: number;
    presentesSentToday: number;
    status: string;
    addedAt?: string;
    lastCheck?: string;
}

interface TokenAccountStats {
    totalAccounts: number;
    activeAccounts: number;
    errorAccounts: number;
    totalCaixasAvailable: number;
}

export default function AdminDashboardPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(true);

    const [products, setProducts] = useState<Product[]>([]);
    const [editing, setEditing] = useState<Product | null>(null);
    const [maintenance, setMaintenance] = useState(false);
    const [syncingStock, setSyncingStock] = useState(false);

    const [accounts, setAccounts] = useState<GarenaAccount[]>([]);
    const [accountStats, setAccountStats] = useState<AccountStats | null>(null);
    const [accountsText, setAccountsText] = useState("");
    const [addingAccounts, setAddingAccounts] = useState(false);
    const [verifyingAccounts, setVerifyingAccounts] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addResults, setAddResults] = useState<any[]>([]);

    const [contasSemDimas, setContasSemDimas] = useState<ContaSemDima[]>([]);
    const [showContasSemDimas, setShowContasSemDimas] = useState(false);

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        value: 0,
        minPurchase: 0,
        maxUses: 0,
        expiresAt: '',
        active: true
    });

    const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('Estamos em manutenção. Voltamos em breve!');
    const [savingMaintenance, setSavingMaintenance] = useState(false);

    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userAction, setUserAction] = useState<'balance' | 'notify' | 'discount' | null>(null);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [balanceType, setBalanceType] = useState<'add' | 'remove' | 'set'>('add');
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyType, setNotifyType] = useState<'INFO' | 'WARNING' | 'SUCCESS' | 'PROMO'>('INFO');
    const [showMassNotifyModal, setShowMassNotifyModal] = useState(false);

    const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
    const [discountValue, setDiscountValue] = useState(0);
    const [discountExpires, setDiscountExpires] = useState('');
    const [savingDiscount, setSavingDiscount] = useState(false);

    const [guestAccounts, setGuestAccounts] = useState<GuestAccount[]>([]);
    const [guestAccountsText, setGuestAccountsText] = useState('');
    const [addingGuestAccounts, setAddingGuestAccounts] = useState(false);
    const [guestStats, setGuestStats] = useState({ total: 0, available: 0, sold: 0 });
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestAddResults, setGuestAddResults] = useState<{ added: number; errors: string[] } | null>(null);

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [bypassList, setBypassList] = useState<BypassUID[]>([]);
    const [bypassStats, setBypassStats] = useState<BypassStats | null>(null);
    const [loadingBypass, setLoadingBypass] = useState(false);
    const [deletingBypass, setDeletingBypass] = useState<string | null>(null);
    const [bypassSearchUid, setBypassSearchUid] = useState('');

    const [cheatKeys, setCheatKeys] = useState<CheatKey[]>([]);
    const [cheatKeysText, setCheatKeysText] = useState('');
    const [cheatPlanType, setCheatPlanType] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
    const [addingCheatKeys, setAddingCheatKeys] = useState(false);
    const [cheatStats, setCheatStats] = useState<CheatKeyStats | null>(null);
    const [showCheatModal, setShowCheatModal] = useState(false);
    const [cheatAddResults, setCheatAddResults] = useState<{ added: number; errors: string[] } | null>(null);
    const [loadingCheatKeys, setLoadingCheatKeys] = useState(false);

    const [modapkKeys, setModapkKeys] = useState<CheatKey[]>([]);
    const [modapkKeysText, setModapkKeysText] = useState('');
    const [modapkPlanType, setModapkPlanType] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
    const [addingModapkKeys, setAddingModapkKeys] = useState(false);
    const [modapkStats, setModapkStats] = useState<CheatKeyStats | null>(null);
    const [showModapkModal, setShowModapkModal] = useState(false);
    const [modapkAddResults, setModapkAddResults] = useState<{ added: number; errors: string[] } | null>(null);
    const [loadingModapkKeys, setLoadingModapkKeys] = useState(false);

    const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
    const [tokenAccountsText, setTokenAccountsText] = useState('');
    const [addingTokenAccounts, setAddingTokenAccounts] = useState(false);
    const [tokenStats, setTokenStats] = useState<TokenAccountStats | null>(null);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [tokenAddResults, setTokenAddResults] = useState<{ added: number; errors: string[] } | null>(null);
    const [verifyingTokenAccounts, setVerifyingTokenAccounts] = useState(false);

    const [streamingKeys, setStreamingKeys] = useState<{ platform: string; count: number; sold: number }[]>([]);
    const [streamingKeysText, setStreamingKeysText] = useState('');
    const [streamingPlatform, setStreamingPlatform] = useState<string>('hbomax');
    const [addingStreamingKeys, setAddingStreamingKeys] = useState(false);
    const [streamingStats, setStreamingStats] = useState<{ total: number; available: number; sold: number } | null>(null);
    const [showStreamingModal, setShowStreamingModal] = useState(false);
    const [streamingAddResults, setStreamingAddResults] = useState<{ added: number; errors: string[] } | null>(null);
    const [loadingStreamingKeys, setLoadingStreamingKeys] = useState(false);

    const STREAMING_PLATFORMS: Record<string, string> = {
        'hbomax': 'HBO Max',
        'primevideo': 'Prime Video',
        'crunchyroll': 'Crunchyroll',
        'paramount': 'Paramount+',
        'canvapro': 'Canva Pro',
        'disney': 'Disney+'
    };

    const CHEAT_PLAN_NAMES: Record<string, string> = {
        'daily': 'Diário (1 dia)',
        'weekly': 'Semanal (7 dias)',
        'biweekly': 'Quinzenal (15 dias)',
        'monthly': 'Mensal (30 dias)'
    };

    const CHEAT_PLAN_PRICES: Record<string, number> = {
        'daily': 8.00,
        'weekly': 12.00,
        'biweekly': 28.00,
        'monthly': 40.00
    };

    const MODAPK_PLAN_NAMES: Record<string, string> = {
        'daily': 'Diário (1 dia)',
        'weekly': 'Semanal (7 dias)',
        'biweekly': 'Quinzenal (15 dias)',
        'monthly': 'Mensal (30 dias)'
    };

    const MODAPK_PLAN_PRICES: Record<string, number> = {
        'daily': 12.00,
        'weekly': 999.00,
        'biweekly': 999.00,
        'monthly': 999.00
    };

    const [activeTab, setActiveTab] = useState<'metrics' | 'products' | 'accounts' | 'coupons' | 'users' | 'settings' | 'analytics' | 'bypass' | 'cheat' | 'modapk' | 'token' | 'streaming'>('metrics');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/admin/product");
            if (res.ok) {
                const json = await res.json();
                let data = [];

                if (json.data) {
                    data = decryptData(json.data) || [];
                } else if (Array.isArray(json)) {
                    data = json;
                }

                setProducts(Array.isArray(data) ? data : []);
                setIsAuthenticated(true);

                await Promise.all([
                    fetchAccounts(),
                    fetchGuestAccounts(),
                    fetchMetrics(),
                    fetchCoupons(),
                    fetchMaintenance(),
                    fetchAnalytics(),
                    fetchBypassList(),
                    fetchCheatKeys(),
                    fetchModapkKeys()
                ]);
            } else {
                setIsAuthenticated(false);
            }
        } catch (e) {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const res = await fetch("/api/admin/product");
        if (res.ok) {
            const json = await res.json();
            let data = [];
            if (json.data) {
                data = decryptData(json.data) || [];
            } else if (Array.isArray(json)) {
                data = json;
            }
            setProducts(Array.isArray(data) ? data : []);
        }
    };

    const fetchAccounts = async () => {
        try {
            console.log('[Admin] Buscando contas...');
            const res = await fetch("/api/admin/accounts");
            if (res.ok) {
                const json = await res.json();
                console.log('[Admin] Resposta accounts:', json);
                if (json.data) {
                    const data = decryptData(json.data);
                    console.log('[Admin] Dados decriptados:', data);

                    setAccounts((data.accounts || []).map((a: any) => ({
                        uid: a.uid,
                        password: a.password || '',
                        diamonds: a.diamonds || 0,
                        passes: a.passes || 0,
                        presentesSentToday: a.presentesSentToday || 0,
                        status: a.status || 'ACTIVE',
                        lastCheck: a.lastCheck,
                        addedAt: a.addedAt
                    })));
                    setAccountStats(data.stats || null);
                }
            }
        } catch (e) {
            console.error("Error fetching accounts:", e);
        }
    };

    const fetchMetrics = async () => {
        setLoadingMetrics(true);
        try {
            const res = await fetch("/api/admin/metrics");
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const data = decryptData(json.data);
                    setMetrics(data);
                }
            }
        } catch (e) {
            console.error("Error fetching metrics:", e);
        } finally {
            setLoadingMetrics(false);
        }
    };

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await fetch("/api/admin/analytics");
            console.log('[Admin] Analytics response status:', res.status);
            if (res.ok) {
                const json = await res.json();
                console.log('[Admin] Analytics data:', json);
                if (json.success && json.data) {
                    setAnalytics(json.data);
                } else {
                    console.log('[Admin] Analytics: success false ou data vazio');
                }
            } else {
                console.log('[Admin] Analytics: resposta não ok');
            }
        } catch (e) {
            console.error("Error fetching analytics:", e);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchCoupons = async () => {
        try {
            const res = await fetch("/api/admin/coupons");
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const data = decryptData(json.data);
                    setCoupons(Array.isArray(data) ? data : []);
                }
            }
        } catch (e) {
            console.error("Error fetching coupons:", e);
        }
    };

    const fetchMaintenance = async () => {
        try {
            const res = await fetch("/api/admin/maintenance");
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setMaintenanceEnabled(json.data.maintenance || false);
                    setMaintenanceMessage(json.data.message || 'Estamos em manutenção. Voltamos em breve!');
                }
            }
        } catch (e) {
            console.error("Error fetching maintenance:", e);
        }
    };

    const fetchGuestAccounts = async () => {
        try {
            const res = await fetch('/api/admin/guest-accounts');
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setGuestAccounts(json.data.accounts || []);
                    setGuestStats({
                        total: json.data.total || 0,
                        available: json.data.available || 0,
                        sold: json.data.sold || 0
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching guest accounts:', e);
        }
    };

    const fetchBypassList = async () => {
        console.log('[Admin Bypass] Iniciando fetchBypassList...');
        setLoadingBypass(true);
        try {
            console.log('[Admin Bypass] Fazendo requisições para API...');
            const [listRes, statsRes] = await Promise.all([
                fetch('/api/admin/bypass?action=list'),
                fetch('/api/admin/bypass?action=stats')
            ]);

            console.log('[Admin Bypass] listRes.ok:', listRes.ok, 'status:', listRes.status);
            console.log('[Admin Bypass] statsRes.ok:', statsRes.ok, 'status:', statsRes.status);

            if (listRes.ok) {
                const listJson = await listRes.json();
                console.log('[Admin Bypass] Resposta da lista:', listJson);
                if (listJson.success && listJson.data) {
                    const uids = listJson.data.uids || [];
                    console.log('[Admin Bypass] UIDs recebidos:', uids.length);
                    console.log('[Admin Bypass] Primeiro UID:', uids[0]);
                    setBypassList(uids);
                } else {
                    console.log('[Admin Bypass] Resposta sem sucesso ou sem data:', listJson);

                    if (listJson.data?.uids) {
                        setBypassList(listJson.data.uids);
                    }
                }
            } else {
                const errorText = await listRes.text();
                console.error('[Admin Bypass] Erro na requisição list:', errorText);
            }

            if (statsRes.ok) {
                const statsJson = await statsRes.json();
                console.log('[Admin Bypass] Stats recebidos:', statsJson);
                if (statsJson.success && statsJson.data) {
                    setBypassStats(statsJson.data);
                }
            } else {
                const errorText = await statsRes.text();
                console.error('[Admin Bypass] Erro na requisição stats:', errorText);
            }
        } catch (e) {
            console.error('[Admin Bypass] Erro ao buscar bypass list:', e);
        } finally {
            setLoadingBypass(false);
            console.log('[Admin Bypass] fetchBypassList finalizado');
        }
    };

    const fetchCheatKeys = async () => {
        setLoadingCheatKeys(true);
        try {
            const res = await fetch('/api/admin/cheat-keys');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setCheatKeys(json.data.keys || []);
                    setCheatStats(json.data.stats || null);
                }
            }
        } catch (e) {
            console.error('Error fetching cheat keys:', e);
        } finally {
            setLoadingCheatKeys(false);
        }
    };

    const handleAddCheatKeys = async () => {
        if (!cheatKeysText.trim()) {
            alert('Insira as keys (uma por linha)');
            return;
        }

        setAddingCheatKeys(true);
        setCheatAddResults(null);

        try {
            const res = await fetch('/api/admin/cheat-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keys: cheatKeysText,
                    planType: cheatPlanType
                })
            });

            const json = await res.json();

            if (json.success) {
                setCheatAddResults(json.data);
                if (json.data.added > 0) {
                    setCheatKeysText('');
                    fetchCheatKeys();
                }
            } else {
                alert(json.message || 'Erro ao adicionar keys');
            }
        } catch (e) {
            alert('Erro ao adicionar keys');
        } finally {
            setAddingCheatKeys(false);
        }
    };

    const handleDeleteCheatKey = async (keyId: string) => {
        if (!confirm('Remover esta key?')) return;

        try {
            const res = await fetch(`/api/admin/cheat-keys?id=${keyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchCheatKeys();
            } else {
                const json = await res.json();
                alert(json.message || 'Erro ao remover key');
            }
        } catch (e) {
            alert('Erro ao remover key');
        }
    };

    const fetchModapkKeys = async () => {
        setLoadingModapkKeys(true);
        try {
            const res = await fetch('/api/admin/modapk-keys');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setModapkKeys(json.data.keys || []);
                    setModapkStats(json.data.stats || null);
                }
            }
        } catch (e) {
            console.error('Error fetching modapk keys:', e);
        } finally {
            setLoadingModapkKeys(false);
        }
    };

    const handleAddModapkKeys = async () => {
        if (!modapkKeysText.trim()) {
            alert('Insira as keys (uma por linha)');
            return;
        }

        setAddingModapkKeys(true);
        setModapkAddResults(null);

        try {
            const res = await fetch('/api/admin/modapk-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keys: modapkKeysText,
                    planType: modapkPlanType
                })
            });

            const json = await res.json();

            if (json.success) {
                setModapkAddResults(json.data);
                if (json.data.added > 0) {
                    setModapkKeysText('');
                    fetchModapkKeys();
                }
            } else {
                alert(json.message || 'Erro ao adicionar keys');
            }
        } catch (e) {
            alert('Erro ao adicionar keys');
        } finally {
            setAddingModapkKeys(false);
        }
    };

    const handleDeleteModapkKey = async (keyId: string) => {
        if (!confirm('Remover esta key?')) return;

        try {
            const res = await fetch(`/api/admin/modapk-keys?id=${keyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchModapkKeys();
            } else {
                const json = await res.json();
                alert(json.message || 'Erro ao remover key');
            }
        } catch (e) {
            alert('Erro ao remover key');
        }
    };

    const fetchTokenAccounts = async () => {
        try {
            const res = await fetch('/api/admin/token-accounts');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setTokenAccounts(json.data.accounts || []);
                    setTokenStats({
                        totalAccounts: json.data.total || 0,
                        activeAccounts: json.data.active || 0,
                        errorAccounts: (json.data.total || 0) - (json.data.active || 0),
                        totalCaixasAvailable: json.data.totalCaixas || 0
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching token accounts:', e);
        }
    };

    const handleAddTokenAccounts = async () => {
        if (!tokenAccountsText.trim()) {
            alert('Insira as contas (uid:password, uma por linha)');
            return;
        }

        setAddingTokenAccounts(true);
        setTokenAddResults(null);

        try {
            const res = await fetch('/api/admin/token-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accounts: tokenAccountsText })
            });

            const json = await res.json();

            if (json.success) {
                setTokenAddResults(json.data);
                if (json.data.added > 0) {
                    setTokenAccountsText('');
                    fetchTokenAccounts();
                }
            } else {
                alert(json.message || 'Erro ao adicionar contas');
            }
        } catch (e) {
            alert('Erro ao adicionar contas');
        } finally {
            setAddingTokenAccounts(false);
        }
    };

    const handleVerifyTokenAccounts = async () => {
        setVerifyingTokenAccounts(true);
        try {
            const res = await fetch('/api/admin/token-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify' })
            });

            const json = await res.json();
            if (json.success) {
                alert(json.message || 'Verificação concluída!');
                fetchTokenAccounts();
            } else {
                alert(json.message || 'Erro na verificação');
            }
        } catch (e) {
            alert('Erro na verificação');
        } finally {
            setVerifyingTokenAccounts(false);
        }
    };

    const handleDeleteTokenAccount = async (uid: string) => {
        if (!confirm(`Remover conta ${uid}?`)) return;

        try {
            const res = await fetch(`/api/admin/token-accounts?uid=${uid}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchTokenAccounts();
            } else {
                const json = await res.json();
                alert(json.message || 'Erro ao remover conta');
            }
        } catch (e) {
            alert('Erro ao remover conta');
        }
    };

    const fetchStreamingKeys = async () => {
        setLoadingStreamingKeys(true);
        try {
            const res = await fetch('/api/admin/streaming-keys');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setStreamingKeys(json.data.platforms || []);
                    setStreamingStats({
                        total: json.data.total || 0,
                        available: json.data.available || 0,
                        sold: json.data.sold || 0
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching streaming keys:', e);
        } finally {
            setLoadingStreamingKeys(false);
        }
    };

    const handleAddStreamingKeys = async () => {
        if (!streamingKeysText.trim()) {
            alert('Insira as keys (uma por linha, formato: email:password)');
            return;
        }

        setAddingStreamingKeys(true);
        setStreamingAddResults(null);

        try {
            const res = await fetch('/api/admin/streaming-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keys: streamingKeysText,
                    platform: streamingPlatform
                })
            });

            const json = await res.json();

            if (json.success) {
                setStreamingAddResults(json.data);
                if (json.data.added > 0) {
                    setStreamingKeysText('');
                    fetchStreamingKeys();
                }
            } else {
                alert(json.message || 'Erro ao adicionar keys');
            }
        } catch (e) {
            alert('Erro ao adicionar keys');
        } finally {
            setAddingStreamingKeys(false);
        }
    };

    const handleDeleteStreamingKey = async (platform: string, keyId: string) => {
        if (!confirm('Remover esta key?')) return;

        try {
            const res = await fetch(`/api/admin/streaming-keys?platform=${platform}&id=${keyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchStreamingKeys();
            } else {
                const json = await res.json();
                alert(json.message || 'Erro ao remover key');
            }
        } catch (e) {
            alert('Erro ao remover key');
        }
    };

    const deleteBypassUid = async (uid: string) => {
        if (!confirm(`Tem certeza que deseja remover o bypass do UID ${uid}?`)) return;

        setDeletingBypass(uid);
        try {
            const res = await fetch('/api/admin/bypass', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid })
            });

            const json = await res.json();
            if (json.success) {
                alert(`UID ${uid} removido com sucesso!`);
                fetchBypassList();
            } else {
                alert(json.message || 'Erro ao remover UID');
            }
        } catch (e) {
            console.error('Error deleting bypass:', e);
            alert('Erro ao conectar com o servidor');
        } finally {
            setDeletingBypass(null);
        }
    };

    const fetchUsers = async (query?: string) => {
        setLoadingUsers(true);
        try {
            const url = query ? `/api/admin/users?q=${encodeURIComponent(query)}` : '/api/admin/users';
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setAdminUsers(json.users || []);
                }
            }
        } catch (e) {
            console.error("Error fetching users:", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUserSearch = () => {
        fetchUsers(userSearch);
    };

    const handleUpdateBalance = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateBalance',
                    userId: selectedUser.id,
                    amount: balanceAmount,
                    type: balanceType
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('Saldo atualizado!');
                fetchUsers(userSearch);
                setShowUserModal(false);
                setUserAction(null);
            } else {
                alert(json.error || 'Erro ao atualizar saldo');
            }
        } catch (e) {
            alert('Erro ao atualizar saldo');
        }
    };

    const handleBanUser = async (user: AdminUser) => {
        if (!confirm(`${user.banned ? 'Desbanir' : 'Banir'} usuário ${user.name}?`)) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ban',
                    userId: user.id,
                    banned: !user.banned
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(user.banned ? 'Usuário desbanido!' : 'Usuário banido!');
                fetchUsers(userSearch);
            }
        } catch (e) {
            alert('Erro ao banir usuário');
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (!confirm(`Tem certeza que deseja EXCLUIR o usuário ${user.name}? Esta ação não pode ser desfeita!`)) return;
        try {
            const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                alert('Usuário excluído!');
                fetchUsers(userSearch);
            }
        } catch (e) {
            alert('Erro ao excluir usuário');
        }
    };

    const handleSetDiscount = async () => {
        if (!selectedUser) return;
        if (discountValue <= 0) {
            alert('Valor do desconto deve ser maior que 0');
            return;
        }
        if (discountType === 'PERCENT' && discountValue > 100) {
            alert('Porcentagem não pode ser maior que 100%');
            return;
        }

        setSavingDiscount(true);
        try {
            const res = await fetch('/api/admin/discount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    type: discountType,
                    value: discountValue,
                    expiresAt: discountExpires || undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(`Desconto de ${discountType === 'PERCENT' ? discountValue + '%' : 'R$ ' + discountValue.toFixed(2)} definido para ${selectedUser.name}!`);
                setShowUserModal(false);
                setUserAction(null);
                setDiscountValue(0);
                setDiscountExpires('');
                fetchUsers(userSearch);
            } else {
                alert(json.message || 'Erro ao definir desconto');
            }
        } catch (e) {
            alert('Erro ao definir desconto');
        } finally {
            setSavingDiscount(false);
        }
    };

    const handleRemoveDiscount = async (user: AdminUser) => {
        if (!confirm(`Remover desconto de ${user.name}?`)) return;
        try {
            const res = await fetch('/api/admin/discount', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const json = await res.json();
            if (json.success) {
                alert('Desconto removido!');
                fetchUsers(userSearch);
            }
        } catch (e) {
            alert('Erro ao remover desconto');
        }
    };

    const handleSendNotification = async (userId?: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: userId ? 'notify' : 'notifyAll',
                    userId: userId || 'all',
                    title: notifyTitle,
                    message: notifyMessage,
                    notificationType: notifyType
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(userId ? 'Notificação enviada!' : 'Notificação enviada para todos!');
                setShowUserModal(false);
                setShowMassNotifyModal(false);
                setUserAction(null);
                setNotifyTitle('');
                setNotifyMessage('');
            }
        } catch (e) {
            alert('Erro ao enviar notificação');
        }
    };

    const handleToggleMaintenance = async () => {
        setSavingMaintenance(true);
        try {
            const res = await fetch("/api/admin/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    maintenance: !maintenanceEnabled,
                    message: maintenanceMessage
                })
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setMaintenanceEnabled(json.data.maintenance);
                    alert(json.data.maintenance ? 'Manutenção ATIVADA!' : 'Manutenção DESATIVADA!');
                }
            }
        } catch (e) {
            alert('Erro ao alterar manutenção');
        } finally {
            setSavingMaintenance(false);
        }
    };

    const handleSaveMaintenanceMessage = async () => {
        setSavingMaintenance(true);
        try {
            const res = await fetch("/api/admin/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    maintenance: maintenanceEnabled,
                    message: maintenanceMessage
                })
            });
            if (res.ok) {
                alert('Mensagem salva!');
            }
        } catch (e) {
            alert('Erro ao salvar mensagem');
        } finally {
            setSavingMaintenance(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                await checkAuth();
            } else {
                setLoginError("Credenciais inválidas");
            }
        } catch (e) {
            setLoginError("Erro ao conectar");
        }
    };

    const handleSave = async () => {
        if (!editing) return;

        try {
            const res = await fetch("/api/admin/product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editing)
            });
            if (res.ok) {
                fetchProducts();
                setEditing(null);
            }
        } catch (e) {
            alert("Erro ao salvar produto");
        }
    };

    const handleSyncStock = async () => {
        setSyncingStock(true);
        try {
            console.log('[Admin] Sincronizando estoque com BLN...');

            const verifyRes = await fetch("/api/admin/accounts/verify", {
                method: "POST"
            });

            if (verifyRes.ok) {
                const json = await verifyRes.json();
                if (json.data) {
                    const data = decryptData(json.data);
                    console.log('[Admin] Dados BLN:', data);

                    if (data.contas) {
                        setAccounts(data.contas.map((c: any) => ({
                            uid: c.uid,
                            diamonds: c.diamonds,
                            passes: c.passes,
                            presentesSentToday: c.presentes_enviados_hoje,
                            status: 'ACTIVE',
                            lastCheck: new Date().toISOString()
                        })));
                    }

                    if (data.estatisticas) {
                        const totalPasses = data.estatisticas.total_passes_disponiveis || 0;
                        setAccountStats({
                            totalAccounts: data.estatisticas.total_contas,
                            activeAccounts: data.estatisticas.total_contas - data.estatisticas.contas_com_erro,
                            errorAccounts: data.estatisticas.contas_com_erro,
                            totalDiamonds: data.estatisticas.total_diamantes,
                            totalPassesAvailable: totalPasses
                        });

                        if (editing && editing.type === 'PASSE') {
                            setEditing({ ...editing, stock: totalPasses });
                        }
                    }
                }
            }

            await fetchProducts();

            alert('Estoque sincronizado com sucesso!');
        } catch (e) {
            console.error('Erro ao sincronizar:', e);
            alert('Erro ao sincronizar estoque');
        } finally {
            setSyncingStock(false);
        }
    };

    const handleAddAccounts = async () => {
        if (!accountsText.trim()) return;

        setAddingAccounts(true);
        setAddResults([]);

        try {
            const res = await fetch("/api/admin/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accounts: accountsText })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const data = decryptData(json.data);
                    setAddResults(data.results || []);
                }

                await fetchAccounts();
                await fetchProducts();
                await fetchMetrics();
            }
        } catch (e) {
            alert("Erro ao adicionar contas");
        } finally {
            setAddingAccounts(false);
        }
    };

    const handleVerifyAccounts = async () => {
        setVerifyingAccounts(true);

        try {
            const res = await fetch("/api/admin/accounts/verify", {
                method: "POST"
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const data = decryptData(json.data);
                    console.log('[Admin] Verificação BLN:', data);

                    if (data.contas && data.contas.length > 0) {
                        setAccounts(data.contas.map((c: any) => ({
                            uid: c.uid,
                            diamonds: c.diamonds,
                            passes: c.passes,
                            presentesSentToday: c.presentes_enviados_hoje,
                            status: 'ACTIVE',
                            lastCheck: new Date().toISOString()
                        })));
                    }

                    if (data.estatisticas) {
                        setAccountStats({
                            totalAccounts: data.estatisticas.total_contas || 0,
                            activeAccounts: (data.estatisticas.total_contas || 0) - (data.estatisticas.contas_com_erro || 0),
                            errorAccounts: data.estatisticas.contas_com_erro || 0,
                            totalDiamonds: data.estatisticas.total_diamantes || 0,
                            totalPassesAvailable: data.estatisticas.total_passes_disponiveis || 0
                        });
                    }
                }
                await fetchProducts();
            } else {

                await fetchAccounts();
            }
        } catch (e) {
            console.error("Erro ao verificar contas:", e);

            await fetchAccounts();
        } finally {
            setVerifyingAccounts(false);
        }
    };

    const handleRemoveAccount = async (uid: string) => {
        if (!confirm(`Remover conta ${uid}?`)) return;

        try {
            const res = await fetch("/api/admin/accounts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid })
            });

            if (res.ok) {
                await fetchAccounts();
                await fetchProducts();
            }
        } catch (e) {
            alert("Erro ao remover conta");
        }
    };

    const fetchContasSemDimas = async () => {
        try {
            const res = await fetch('/api/admin/contas-semdimas');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setContasSemDimas(json.data);
                }
            }
        } catch (e) {
            console.error('Erro ao buscar contas sem dimas:', e);
        }
    };

    const handleExportNoDiamonds = () => {

        const contasSemDiamantes = accounts.filter(a => a.diamonds === 0);

        if (contasSemDiamantes.length === 0) {
            alert("Nenhuma conta sem diamantes encontrada!");
            return;
        }

        const content = contasSemDiamantes.map(a => a.password ? `${a.uid}:${a.password}` : a.uid).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contas_sem_diamantes_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`Exportadas ${contasSemDiamantes.length} contas sem diamantes!`);
    };

    const handleExportContasSemDimas = () => {
        if (contasSemDimas.length === 0) {
            alert("Nenhuma conta sem dimas encontrada!");
            return;
        }

        const content = contasSemDimas.map(c => `${c.uid}:${c.password}`).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contas_semdimas_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`Exportadas ${contasSemDimas.length} contas sem dimas!`);
    };

    const handleRestoreContaSemDima = async (uid: string) => {
        try {
            const res = await fetch('/api/admin/contas-semdimas/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid })
            });

            if (res.ok) {
                await fetchContasSemDimas();
                await fetchAccounts();
                alert('Conta restaurada com sucesso!');
            }
        } catch (e) {
            alert('Erro ao restaurar conta');
        }
    };

    const handleCreateCoupon = async () => {
        if (!newCoupon.code.trim()) {
            alert("Código do cupom é obrigatório");
            return;
        }

        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCoupon)
            });

            if (res.ok) {
                fetchCoupons();
                setShowCouponModal(false);
                setNewCoupon({
                    code: '',
                    type: 'PERCENTAGE',
                    value: 0,
                    minPurchase: 0,
                    maxUses: 0,
                    expiresAt: '',
                    active: true
                });
            } else {
                const data = await res.json();
                alert(data.message || "Erro ao criar cupom");
            }
        } catch (e) {
            alert("Erro ao criar cupom");
        }
    };

    const handleToggleCoupon = async (coupon: Coupon) => {
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: coupon.id, active: !coupon.active })
            });

            if (res.ok) {
                fetchCoupons();
            }
        } catch (e) {
            alert("Erro ao atualizar cupom");
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm("Remover este cupom?")) return;

        try {
            const res = await fetch("/api/admin/coupons", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                fetchCoupons();
            }
        } catch (e) {
            alert("Erro ao remover cupom");
        }
    };

    const handleRefreshAll = async () => {
        await Promise.all([
            fetchMetrics(),
            fetchAccounts(),
            fetchProducts(),
            fetchCoupons()
        ]);
    };

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card border border-white/10 p-8 rounded-2xl max-w-md w-full relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 shadow-lg">
                            <span className="text-purple-500 font-bold text-xl">LHUB</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-white mb-8">Admin Login</h1>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Usuário</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500/20 outline-none"
                            />
                        </div>

                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-lg">Painel LHUB</h1>
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <button
                            onClick={handleRefreshAll}
                            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2"
                        >
                            <RefreshCw size={14} />
                            <span className="hidden xs:inline">Atualizar</span>
                        </button>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                            <div className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${maintenance ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
                            <span className="text-xs sm:text-sm font-medium">{maintenance ? 'Manutenção' : 'Online'}</span>
                        </div>
                    </div>
                </header>

                {}
                <div className="mb-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:flex gap-2">
                        <button
                            onClick={() => setActiveTab('metrics')}
                            className={`px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'metrics'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <BarChart3 size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Métricas</span>
                            <span className="sm:hidden">Stats</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'products'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <Package size={16} className="inline mr-2" />
                            Produtos
                        </button>
                        <button
                            onClick={() => { setActiveTab('accounts'); fetchAccounts(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'accounts'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <Users size={16} className="inline mr-2" />
                            Contas Garena
                        </button>
                        <button
                            onClick={() => setActiveTab('coupons')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'coupons'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <Tag size={16} className="inline mr-2" />
                            Cupons
                        </button>
                        <button
                            onClick={() => { setActiveTab('users'); fetchUsers(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <Users size={16} className="inline mr-2" />
                            Usuários
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            ⚙️ Configurações
                        </button>
                        <button
                            onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analytics'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Tráfego
                        </button>
                        <button
                            onClick={() => { setActiveTab('bypass'); fetchBypassList(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'bypass'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            <Zap className="w-4 h-4 inline mr-1" />
                            Bypass
                        </button>
                        <button
                            onClick={() => { setActiveTab('cheat'); fetchCheatKeys(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'cheat'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            🎯 Cheat Keys
                        </button>
                        <button
                            onClick={() => { setActiveTab('modapk'); fetchModapkKeys(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'modapk'
                                ? 'bg-green-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            📱 ModApk Keys
                        </button>
                        <button
                            onClick={() => { setActiveTab('token'); fetchTokenAccounts(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'token'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            🎁 Caixa Token
                        </button>
                        <button
                            onClick={() => { setActiveTab('streaming'); fetchStreamingKeys(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'streaming'
                                ? 'bg-red-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                }`}
                        >
                            📺 Streamings
                        </button>
                    </div>
                </div>

                {}
                {activeTab === 'metrics' && (
                    <div className="space-y-6">
                        {loadingMetrics ? (
                            <div className="text-center py-8 text-neutral-400">Carregando métricas...</div>
                        ) : metrics ? (
                            <>
                                {}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                <Users size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-sm">Usuários</p>
                                                <p className="text-xl font-bold">{metrics.summary.totalUsers}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                <DollarSign size={20} className="text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-sm">Total Recargas</p>
                                                <p className="text-xl font-bold text-green-400">{formatCurrency(metrics.summary.totalDeposits)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                <ShoppingCart size={20} className="text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-sm">Total Vendas</p>
                                                <p className="text-xl font-bold text-purple-400">{formatCurrency(metrics.summary.totalPurchases)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                                <Ticket size={20} className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-sm">Passes Enviados</p>
                                                <p className="text-xl font-bold text-yellow-400">{metrics.summary.passesEnviados}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                                <TrendingUp size={20} className="text-cyan-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-sm">Saldo Usuários</p>
                                                <p className="text-xl font-bold text-cyan-400">{formatCurrency(metrics.summary.totalUserBalance)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {}
                                    <div className="glass-card border border-white/10 rounded-xl p-6">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <DollarSign size={18} className="text-green-400" />
                                            Recargas PIX
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Hoje</span>
                                                <span className="font-medium">{metrics.deposits.today.count}x - {formatCurrency(metrics.deposits.today.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Esta Semana</span>
                                                <span className="font-medium">{metrics.deposits.thisWeek.count}x - {formatCurrency(metrics.deposits.thisWeek.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Este Mês</span>
                                                <span className="font-medium">{metrics.deposits.thisMonth.count}x - {formatCurrency(metrics.deposits.thisMonth.total)}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-white/10 pt-3">
                                                <span className="text-neutral-400">Total</span>
                                                <span className="font-bold text-green-400">{metrics.deposits.allTime.count}x - {formatCurrency(metrics.deposits.allTime.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {}
                                    <div className="glass-card border border-white/10 rounded-xl p-6">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <ShoppingCart size={18} className="text-purple-400" />
                                            Vendas
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Hoje</span>
                                                <span className="font-medium">{metrics.sales.today.count}x - {formatCurrency(metrics.sales.today.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Esta Semana</span>
                                                <span className="font-medium">{metrics.sales.thisWeek.count}x - {formatCurrency(metrics.sales.thisWeek.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Este Mês</span>
                                                <span className="font-medium">{metrics.sales.thisMonth.count}x - {formatCurrency(metrics.sales.thisMonth.total)}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-white/10 pt-3">
                                                <span className="text-neutral-400">Total</span>
                                                <span className="font-bold text-purple-400">{metrics.sales.allTime.count}x - {formatCurrency(metrics.sales.allTime.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {}
                                    <div className="glass-card border border-white/10 rounded-xl p-6">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Users size={18} className="text-blue-400" />
                                            Usuários
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Novos Hoje</span>
                                                <span className="font-medium">{metrics.users.today}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Esta Semana</span>
                                                <span className="font-medium">{metrics.users.thisWeek}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-400">Este Mês</span>
                                                <span className="font-medium">{metrics.users.thisMonth}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-white/10 pt-3">
                                                <span className="text-neutral-400">Total</span>
                                                <span className="font-bold text-blue-400">{metrics.users.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                                    <div className="p-6 border-b border-white/5 bg-white/5">
                                        <h3 className="text-lg font-bold">Últimas Transações</h3>
                                    </div>
                                    <div className="p-6 overflow-x-auto">
                                        {metrics.recentTransactions.length === 0 ? (
                                            <p className="text-neutral-400 text-center py-4">Nenhuma transação ainda</p>
                                        ) : (
                                            <table className="w-full text-left min-w-[600px]">
                                                <thead>
                                                    <tr className="text-neutral-400 border-b border-white/5">
                                                        <th className="pb-3 font-medium">Tipo</th>
                                                        <th className="pb-3 font-medium">Descrição</th>
                                                        <th className="pb-3 font-medium">Valor</th>
                                                        <th className="pb-3 font-medium">Status</th>
                                                        <th className="pb-3 font-medium">Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {metrics.recentTransactions.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-white/5">
                                                            <td className="py-3">
                                                                <span className={`text-xs px-2 py-1 rounded ${tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                                    {tx.type === 'DEPOSIT' ? 'Recarga' : 'Compra'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-sm text-neutral-300 max-w-[200px] truncate">{tx.description}</td>
                                                            <td className="py-3 font-mono">{formatCurrency(tx.amount)}</td>
                                                            <td className="py-3">
                                                                <span className={`text-xs px-2 py-1 rounded ${tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    {tx.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-sm text-neutral-400">{formatDate(tx.date)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-neutral-400">Erro ao carregar métricas</div>
                        )}
                    </div>
                )}

                {}
                {activeTab === 'products' && (
                    <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Package size={20} className="text-purple-500" />
                                Produtos em Estoque
                            </h2>
                        </div>

                        <div className="p-6 overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="text-neutral-400 border-b border-white/5">
                                        <th className="pb-4 font-medium">Nome</th>
                                        <th className="pb-4 font-medium">Preço</th>
                                        <th className="pb-4 font-medium">Estoque</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {products.map(p => (
                                        <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-neutral-800/50 rounded flex-shrink-0 border border-white/10 overflow-hidden">
                                                        {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-neutral-200 group-hover:text-white transition-colors">{p.name}</div>
                                                        <div className="text-xs text-neutral-500 max-w-[200px] truncate">{p.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 align-middle font-mono text-purple-400">R$ {p.price.toFixed(2)}</td>
                                            <td className="py-4 align-middle">
                                                <span className={`${p.stock < 5 ? 'text-red-400' : 'text-neutral-300'}`}>{p.stock} un.</span>
                                            </td>
                                            <td className="py-4 align-middle">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${p.available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {p.available ? 'Disponível' : 'Indisponível'}
                                                </span>
                                            </td>
                                            <td className="py-4 align-middle text-right">
                                                <button
                                                    onClick={() => setEditing(p)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'accounts' && (
                    <div className="space-y-6">
                        {}
                        {accountStats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <Users size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Contas</p>
                                            <p className="text-xl font-bold">{accountStats.totalAccounts}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                            <Ticket size={20} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Passes</p>
                                            <p className="text-xl font-bold text-green-400">{accountStats.totalPassesAvailable}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                            <Diamond size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Diamantes</p>
                                            <p className="text-xl font-bold text-purple-400">{accountStats.totalDiamonds}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                            <Users size={20} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Ativas</p>
                                            <p className="text-xl font-bold text-green-400">{accountStats.activeAccounts}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                            <X size={20} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Com Erro</p>
                                            <p className="text-xl font-bold text-red-400">{accountStats.errorAccounts}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <Upload size={16} />
                                Adicionar Contas
                            </button>
                            <button
                                onClick={handleVerifyAccounts}
                                disabled={verifyingAccounts}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={verifyingAccounts ? 'animate-spin' : ''} />
                                {verifyingAccounts ? 'Verificando...' : 'Verificar Contas'}
                            </button>
                            <button
                                onClick={handleExportNoDiamonds}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                title="Exportar contas com 0 diamantes"
                            >
                                <Download size={16} />
                                Exportar Sem Dima
                            </button>
                            <button
                                onClick={() => { setShowContasSemDimas(!showContasSemDimas); fetchContasSemDimas(); }}
                                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${showContasSemDimas ? 'bg-orange-600 text-white' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'}`}
                            >
                                <Trash2 size={16} />
                                Contas Sem Dimas ({contasSemDimas.length})
                            </button>
                        </div>

                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users size={20} className="text-blue-500" />
                                    Contas Garena ({accounts.length})
                                </h2>
                            </div>

                            <div className="p-6 overflow-x-auto">
                                {accounts.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Nenhuma conta cadastrada</p>
                                        <p className="text-sm">Clique em "Adicionar Contas" para começar</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead>
                                            <tr className="text-neutral-400 border-b border-white/5">
                                                <th className="pb-4 font-medium">UID</th>
                                                <th className="pb-4 font-medium">Password</th>
                                                <th className="pb-4 font-medium">Diamantes</th>
                                                <th className="pb-4 font-medium">Passes</th>
                                                <th className="pb-4 font-medium">Enviados Hoje</th>
                                                <th className="pb-4 font-medium">Status</th>
                                                <th className="pb-4 font-medium text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {accounts.map(a => (
                                                <tr key={a.uid} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 font-mono text-neutral-200">{a.uid}</td>
                                                    <td className="py-4 font-mono text-neutral-400">
                                                        {a.password || <span className="text-red-400 text-xs">Não salvo</span>}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-purple-400 flex items-center gap-1">
                                                            <Diamond size={14} />
                                                            {a.diamonds}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-green-400 flex items-center gap-1">
                                                            <Ticket size={14} />
                                                            {a.passes}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-neutral-300">{a.presentesSentToday}</td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${a.status === 'ACTIVE'
                                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveAccount(a.uid)}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10 border-cyan-500/30">
                            <div className="p-6 border-b border-white/5 bg-cyan-500/10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Gift size={20} className="text-cyan-500" />
                                        Nível 15 + Troca Nick ({guestStats.available} disponíveis)
                                    </h2>
                                    <button
                                        onClick={() => setShowGuestModal(true)}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Plus size={14} />
                                        Adicionar Contas
                                    </button>
                                </div>
                                <p className="text-neutral-400 text-sm mt-1">Contas Guest no formato UID:PASSWORD para venda manual</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-cyan-400">{guestStats.total}</p>
                                        <p className="text-neutral-400 text-sm">Total</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-green-400">{guestStats.available}</p>
                                        <p className="text-neutral-400 text-sm">Disponíveis</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-orange-400">{guestStats.sold}</p>
                                        <p className="text-neutral-400 text-sm">Vendidas</p>
                                    </div>
                                </div>

                                {guestAccounts.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        <Gift size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Nenhuma conta cadastrada</p>
                                        <p className="text-sm">Clique em "Adicionar Contas" para começar</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead>
                                                <tr className="text-neutral-400 border-b border-white/5">
                                                    <th className="pb-4 font-medium">UID</th>
                                                    <th className="pb-4 font-medium">Password</th>
                                                    <th className="pb-4 font-medium">Status</th>
                                                    <th className="pb-4 font-medium">Adicionada em</th>
                                                    <th className="pb-4 font-medium text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {guestAccounts.map(g => (
                                                    <tr key={g.id} className="group hover:bg-white/5 transition-colors">
                                                        <td className="py-4 font-mono text-neutral-200">{g.uid}</td>
                                                        <td className="py-4 font-mono text-neutral-400">{g.password}</td>
                                                        <td className="py-4">
                                                            <span className={`text-xs px-2 py-1 rounded-full border ${g.sold
                                                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                                : 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                }`}>
                                                                {g.sold ? 'Vendida' : 'Disponível'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-neutral-400 text-sm">
                                                            {new Date(g.addedAt).toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            {!g.sold && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Remover esta conta?')) {
                                                                            const res = await fetch(`/api/admin/guest-accounts?id=${g.id}`, { method: 'DELETE' });
                                                                            if (res.ok) fetchGuestAccounts();
                                                                        }
                                                                    }}
                                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {}
                        {showContasSemDimas && (
                            <div className="glass-card rounded-2xl overflow-hidden border-white/10 border-orange-500/30">
                                <div className="p-6 border-b border-white/5 bg-orange-500/10">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Trash2 size={20} className="text-orange-500" />
                                            Contas Sem Dimas ({contasSemDimas.length})
                                        </h2>
                                        <button
                                            onClick={handleExportContasSemDimas}
                                            className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                        >
                                            <Download size={14} />
                                            Exportar Todas
                                        </button>
                                    </div>
                                    <p className="text-neutral-400 text-sm mt-1">Contas que ficaram sem diamantes e passes são movidas automaticamente para cá</p>
                                </div>

                                <div className="p-6 overflow-x-auto">
                                    {contasSemDimas.length === 0 ? (
                                        <div className="text-center py-8 text-neutral-400">
                                            <Trash2 size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Nenhuma conta sem dimas</p>
                                            <p className="text-sm">Contas sem diamantes e passes serão movidas automaticamente para cá</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead>
                                                <tr className="text-neutral-400 border-b border-white/5">
                                                    <th className="pb-4 font-medium">UID</th>
                                                    <th className="pb-4 font-medium">Password</th>
                                                    <th className="pb-4 font-medium">Movida em</th>
                                                    <th className="pb-4 font-medium text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {contasSemDimas.map(c => (
                                                    <tr key={c.uid} className="group hover:bg-white/5 transition-colors">
                                                        <td className="py-4 font-mono text-neutral-200">{c.uid}</td>
                                                        <td className="py-4 font-mono text-neutral-400">{c.password}</td>
                                                        <td className="py-4 text-neutral-400 text-sm">
                                                            {new Date(c.movedAt).toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={() => handleRestoreContaSemDima(c.uid)}
                                                                className="p-2 hover:bg-green-500/20 rounded-lg text-neutral-400 hover:text-green-400 transition-colors"
                                                                title="Restaurar conta"
                                                            >
                                                                <RefreshCw size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {}
                {activeTab === 'coupons' && (
                    <div className="space-y-6">
                        {}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCouponModal(true)}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                Criar Cupom
                            </button>
                        </div>

                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Tag size={20} className="text-orange-500" />
                                    Cupons de Desconto ({coupons.length})
                                </h2>
                            </div>

                            <div className="p-6 overflow-x-auto">
                                {coupons.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        <Tag size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Nenhum cupom cadastrado</p>
                                        <p className="text-sm">Clique em "Criar Cupom" para começar</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="text-neutral-400 border-b border-white/5">
                                                <th className="pb-4 font-medium">Código</th>
                                                <th className="pb-4 font-medium">Tipo</th>
                                                <th className="pb-4 font-medium">Valor</th>
                                                <th className="pb-4 font-medium">Mín. Compra</th>
                                                <th className="pb-4 font-medium">Usos</th>
                                                <th className="pb-4 font-medium">Status</th>
                                                <th className="pb-4 font-medium text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {coupons.map(c => (
                                                <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 font-mono font-bold text-orange-400">{c.code}</td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded ${c.type === 'PERCENTAGE' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                                            {c.type === 'PERCENTAGE' ? 'Porcentagem' : 'Valor Fixo'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 font-medium">
                                                        {c.type === 'PERCENTAGE' ? `${c.value}%` : formatCurrency(c.value)}
                                                    </td>
                                                    <td className="py-4 text-neutral-300">
                                                        {c.minPurchase > 0 ? formatCurrency(c.minPurchase) : '-'}
                                                    </td>
                                                    <td className="py-4 text-neutral-300">
                                                        {c.usedCount}/{c.maxUses > 0 ? c.maxUses : '∞'}
                                                    </td>
                                                    <td className="py-4">
                                                        <button
                                                            onClick={() => handleToggleCoupon(c)}
                                                            className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${c.active
                                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                }`}
                                                        >
                                                            {c.active ? 'Ativo' : 'Inativo'}
                                                        </button>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteCoupon(c.id)}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex-1 flex gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                                    placeholder="Pesquisar por nome, email ou ID..."
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={handleUserSearch}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                >
                                    <Search size={20} />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowMassNotifyModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Bell size={16} />
                                Notificar Todos
                            </button>
                        </div>

                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Users size={20} className="text-purple-400" />
                                    Usuários ({adminUsers.length})
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                {loadingUsers ? (
                                    <div className="p-8 text-center text-neutral-400">Carregando...</div>
                                ) : adminUsers.length === 0 ? (
                                    <div className="p-8 text-center text-neutral-400">Nenhum usuário encontrado</div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-white/5">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Nome</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Email</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Saldo</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Desconto</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Criado em</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-neutral-400">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {adminUsers.map((user) => (
                                                <tr key={user.id} className={`hover:bg-white/5 ${user.banned ? 'bg-red-500/10' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-white font-medium">{user.name}</span>
                                                            {user.role === 'ADMIN' && (
                                                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Admin</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-400 text-sm">{user.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-green-400 font-mono">R$ {user.balance.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {user.banned ? (
                                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Banido</span>
                                                        ) : user.isVerified ? (
                                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Verificado</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Pendente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {user.customDiscount ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                                                    {user.customDiscount.type === 'PERCENT'
                                                                        ? `${user.customDiscount.value}%`
                                                                        : `R$ ${user.customDiscount.value.toFixed(2)}`}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleRemoveDiscount(user)}
                                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                                    title="Remover desconto"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-neutral-500 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-400 text-sm">
                                                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => { setSelectedUser(user); setUserAction('balance'); setShowUserModal(true); }}
                                                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                                                                title="Alterar Saldo"
                                                            >
                                                                <Wallet size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedUser(user); setUserAction('notify'); setShowUserModal(true); }}
                                                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                                title="Enviar Notificação"
                                                            >
                                                                <Bell size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setUserAction('discount');
                                                                    setDiscountType(user.customDiscount?.type || 'PERCENT');
                                                                    setDiscountValue(user.customDiscount?.value || 0);
                                                                    setDiscountExpires(user.customDiscount?.expiresAt || '');
                                                                    setShowUserModal(true);
                                                                }}
                                                                className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                                                                title="Definir Desconto"
                                                            >
                                                                <Gift size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleBanUser(user)}
                                                                className={`p-2 rounded-lg transition-colors ${user.banned ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-orange-500/20 text-orange-400'}`}
                                                                title={user.banned ? 'Desbanir' : 'Banir'}
                                                            >
                                                                <Ban size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <UserX size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {}
                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-md">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-bold">
                                    {userAction === 'balance' ? 'Alterar Saldo' : userAction === 'discount' ? 'Definir Desconto' : 'Enviar Notificação'}
                                </h3>
                                <button onClick={() => { setShowUserModal(false); setUserAction(null); }} className="text-neutral-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{selectedUser.name}</p>
                                        <p className="text-sm text-neutral-400">{selectedUser.email}</p>
                                    </div>
                                </div>

                                {userAction === 'balance' && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Tipo de Operação</label>
                                            <select
                                                value={balanceType}
                                                onChange={(e) => setBalanceType(e.target.value as 'add' | 'remove' | 'set')}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                            >
                                                <option value="add">Adicionar</option>
                                                <option value="remove">Remover</option>
                                                <option value="set">Definir</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Valor (R$)</label>
                                            <input
                                                type="number"
                                                value={balanceAmount}
                                                onChange={(e) => setBalanceAmount(Number(e.target.value))}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <p className="text-sm text-neutral-400">
                                            Saldo atual: <span className="text-green-400">R$ {selectedUser.balance.toFixed(2)}</span>
                                        </p>
                                        <button
                                            onClick={handleUpdateBalance}
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Confirmar
                                        </button>
                                    </>
                                )}

                                {userAction === 'notify' && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Tipo</label>
                                            <select
                                                value={notifyType}
                                                onChange={(e) => setNotifyType(e.target.value as any)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                            >
                                                <option value="INFO">Informação</option>
                                                <option value="WARNING">Aviso</option>
                                                <option value="SUCCESS">Sucesso</option>
                                                <option value="PROMO">Promoção</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Título</label>
                                            <input
                                                type="text"
                                                value={notifyTitle}
                                                onChange={(e) => setNotifyTitle(e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                                placeholder="Título da notificação"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Mensagem</label>
                                            <textarea
                                                value={notifyMessage}
                                                onChange={(e) => setNotifyMessage(e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                                                rows={3}
                                                placeholder="Mensagem da notificação"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSendNotification(selectedUser.id)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Enviar Notificação
                                        </button>
                                    </>
                                )}

                                {userAction === 'discount' && (
                                    <>
                                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                            <p className="text-purple-400 text-sm flex items-center gap-2">
                                                <Gift size={16} />
                                                Defina um desconto personalizado para este usuário
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-neutral-400 mb-2">Tipo</label>
                                                <select
                                                    value={discountType}
                                                    onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                                >
                                                    <option value="PERCENT">Porcentagem (%)</option>
                                                    <option value="FIXED">Valor Fixo (R$)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-neutral-400 mb-2">
                                                    Valor {discountType === 'PERCENT' ? '(%)' : '(R$)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                                    min="0"
                                                    max={discountType === 'PERCENT' ? 100 : undefined}
                                                    step={discountType === 'PERCENT' ? 1 : 0.01}
                                                    placeholder={discountType === 'PERCENT' ? '10' : '5.00'}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">Expira em (opcional)</label>
                                            <input
                                                type="datetime-local"
                                                value={discountExpires}
                                                onChange={(e) => setDiscountExpires(e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                            />
                                            <p className="text-xs text-neutral-500 mt-1">Deixe vazio para desconto permanente</p>
                                        </div>
                                        {selectedUser.customDiscount && (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                                <p className="text-yellow-400 text-sm">
                                                    ⚠️ Desconto atual: {selectedUser.customDiscount.type === 'PERCENT'
                                                        ? `${selectedUser.customDiscount.value}%`
                                                        : `R$ ${selectedUser.customDiscount.value.toFixed(2)}`}
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleSetDiscount}
                                            disabled={savingDiscount}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Gift size={18} />
                                            {savingDiscount ? 'Salvando...' : 'Definir Desconto'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {}
                {showMassNotifyModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-md">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Bell size={20} className="text-blue-400" />
                                    Notificação em Massa
                                </h3>
                                <button onClick={() => setShowMassNotifyModal(false)} className="text-neutral-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-yellow-400 text-sm">
                                        ⚠️ Esta notificação será enviada para TODOS os usuários!
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">Tipo</label>
                                    <select
                                        value={notifyType}
                                        onChange={(e) => setNotifyType(e.target.value as any)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                    >
                                        <option value="INFO">Informação</option>
                                        <option value="WARNING">Aviso</option>
                                        <option value="SUCCESS">Sucesso</option>
                                        <option value="PROMO">Promoção</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={notifyTitle}
                                        onChange={(e) => setNotifyTitle(e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                        placeholder="Ex: Novidade!"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">Mensagem</label>
                                    <textarea
                                        value={notifyMessage}
                                        onChange={(e) => setNotifyMessage(e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                                        rows={3}
                                        placeholder="Ex: Temos estoque de passes disponível!"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSendNotification()}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    Enviar para Todos
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    🛠️ Modo de Manutenção
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {}
                                <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                                    <div>
                                        <h3 className="font-bold text-lg">Ativar Manutenção</h3>
                                        <p className="text-neutral-400 text-sm">Quando ativado, o site exibirá uma página de manutenção para todos os usuários.</p>
                                    </div>
                                    <button
                                        onClick={handleToggleMaintenance}
                                        disabled={savingMaintenance}
                                        className={`relative w-16 h-8 rounded-full transition-colors ${maintenanceEnabled ? 'bg-red-500' : 'bg-neutral-700'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${maintenanceEnabled ? 'left-9' : 'left-1'
                                            }`} />
                                    </button>
                                </div>

                                {}
                                <div className={`p-4 rounded-xl border ${maintenanceEnabled
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{maintenanceEnabled ? '🚧' : '✅'}</span>
                                        <span className="font-bold">
                                            {maintenanceEnabled ? 'Site em Manutenção' : 'Site Online'}
                                        </span>
                                    </div>
                                </div>

                                {}
                                <div>
                                    <label className="text-sm text-neutral-400 mb-2 block">Mensagem de Manutenção</label>
                                    <textarea
                                        value={maintenanceMessage}
                                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                                        rows={3}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 outline-none focus:border-purple-500 resize-none"
                                        placeholder="Digite a mensagem que será exibida durante a manutenção..."
                                    />
                                    <button
                                        onClick={handleSaveMaintenanceMessage}
                                        disabled={savingMaintenance}
                                        className="mt-3 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        <Save size={16} className="inline mr-2" />
                                        Salvar Mensagem
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {loadingAnalytics ? (
                            <div className="text-center py-8 text-neutral-400">Carregando dados de tráfego...</div>
                        ) : analytics ? (
                            <>
                                {}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-xs">Visitas Hoje</p>
                                                <p className="text-xl font-bold">{analytics.summary.visitsToday}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-xs">Visitas Semana</p>
                                                <p className="text-xl font-bold">{analytics.summary.visitsWeek}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <ShoppingCart className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-xs">Compras Hoje</p>
                                                <p className="text-xl font-bold">{analytics.summary.purchasesToday}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="text-neutral-400 text-xs">Receita Semana</p>
                                                <p className="text-xl font-bold">R$ {analytics.summary.revenueWeek.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-blue-400" />
                                                Estados com Mais Visitas
                                            </h2>
                                        </div>
                                        <div className="p-4">
                                            {analytics.visitsByState.length > 0 ? (
                                                <div className="space-y-2">
                                                    {analytics.visitsByState.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-purple-400">#{i + 1}</span>
                                                                <span className="font-medium">{item.state}</span>
                                                            </div>
                                                            <span className="text-neutral-400">{item.count} visitas</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-neutral-500 text-center py-4">Nenhum dado disponível</p>
                                            )}
                                        </div>
                                    </div>

                                    {}
                                    <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <ShoppingCart className="w-5 h-5 text-green-400" />
                                                Estados com Mais Compras
                                            </h2>
                                        </div>
                                        <div className="p-4">
                                            {analytics.purchasesByState.length > 0 ? (
                                                <div className="space-y-2">
                                                    {analytics.purchasesByState.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-green-400">#{i + 1}</span>
                                                                <span className="font-medium">{item.state}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-neutral-400">{item.count} compras</span>
                                                                <p className="text-green-400 text-sm">R$ {item.total.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-neutral-500 text-center py-4">Nenhum dado disponível</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <Globe className="w-5 h-5 text-purple-400" />
                                                Cidades com Mais Visitas
                                            </h2>
                                        </div>
                                        <div className="p-4 max-h-80 overflow-y-auto">
                                            {analytics.visitsByCity.length > 0 ? (
                                                <div className="space-y-2">
                                                    {analytics.visitsByCity.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
                                                            <div>
                                                                <span className="font-medium">{item.city}</span>
                                                                <p className="text-neutral-500 text-xs">{item.state}</p>
                                                            </div>
                                                            <span className="text-neutral-400">{item.count} visitas</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-neutral-500 text-center py-4">Nenhum dado disponível</p>
                                            )}
                                        </div>
                                    </div>

                                    {}
                                    <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-yellow-400" />
                                                Cidades com Mais Compras
                                            </h2>
                                        </div>
                                        <div className="p-4 max-h-80 overflow-y-auto">
                                            {analytics.purchasesByCity.length > 0 ? (
                                                <div className="space-y-2">
                                                    {analytics.purchasesByCity.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
                                                            <div>
                                                                <span className="font-medium">{item.city}</span>
                                                                <p className="text-neutral-500 text-xs">{item.state}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-neutral-400">{item.count} compras</span>
                                                                <p className="text-green-400 text-sm">R$ {item.total.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-neutral-500 text-center py-4">Nenhum dado disponível</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="flex justify-center">
                                    <button
                                        onClick={fetchAnalytics}
                                        disabled={loadingAnalytics}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <RefreshCw size={18} className={loadingAnalytics ? 'animate-spin' : ''} />
                                        Atualizar Dados
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-neutral-400">
                                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum dado de tráfego disponível ainda.</p>
                                <p className="text-sm mt-2">Os dados serão coletados automaticamente conforme os usuários acessam o site.</p>
                            </div>
                        )}
                    </div>
                )}

                {}
                {activeTab === 'bypass' && (
                    <div className="space-y-6">
                        {}
                        {bypassStats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card border border-cyan-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                            <Zap size={20} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">Total UIDs</p>
                                            <p className="text-xl font-bold text-cyan-400">{bypassStats.total_uids}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-green-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                            <Activity size={20} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">UIDs Ativos</p>
                                            <p className="text-xl font-bold text-green-400">{bypassStats.active_uids}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-red-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                            <Ban size={20} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm">UIDs Expirados</p>
                                            <p className="text-xl font-bold text-red-400">{bypassStats.expired_uids}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        <div className="glass-card border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Zap size={18} className="text-cyan-400" />
                                    UIDs com Bypass
                                </h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                        <input
                                            type="text"
                                            value={bypassSearchUid}
                                            onChange={(e) => setBypassSearchUid(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Buscar UID..."
                                            className="bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-cyan-500 w-40"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchBypassList}
                                        disabled={loadingBypass}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} className={loadingBypass ? 'animate-spin' : ''} />
                                        Atualizar
                                    </button>
                                </div>
                            </div>

                            {loadingBypass ? (
                                <div className="text-center py-8 text-neutral-400">
                                    <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                                    <p>Carregando lista de UIDs...</p>
                                </div>
                            ) : bypassList.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400">
                                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhum UID com bypass encontrado.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-800">
                                                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">UID</th>
                                                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Status</th>
                                                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Dias Restantes</th>
                                                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Expiração</th>
                                                <th className="text-right py-3 px-4 text-neutral-400 font-medium text-sm">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bypassList
                                                .filter(b => !bypassSearchUid || b.uid.includes(bypassSearchUid))
                                                .map((bypass) => (
                                                    <tr key={bypass.uid} className="border-b border-neutral-800/50 hover:bg-white/5">
                                                        <td className="py-3 px-4">
                                                            <span className="font-mono text-white">{bypass.uid}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${bypass.active
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {bypass.active ? 'ATIVO' : 'EXPIRADO'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`font-bold ${bypass.days_left > 7 ? 'text-green-400' :
                                                                bypass.days_left > 0 ? 'text-yellow-400' : 'text-red-400'
                                                                }`}>
                                                                {bypass.days_left} dias
                                                            </span>
                                                            <span className="text-neutral-500 text-sm ml-1">
                                                                ({bypass.hours_left}h)
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-neutral-400 text-sm">
                                                            {bypass.expiration_formatted}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={() => deleteBypassUid(bypass.uid)}
                                                                disabled={deletingBypass === bypass.uid}
                                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1 ml-auto"
                                                            >
                                                                {deletingBypass === bypass.uid ? (
                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={14} />
                                                                )}
                                                                Remover
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'cheat' && (
                    <div className="space-y-6">
                        {}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCheatModal(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                Adicionar Keys
                            </button>
                            <button
                                onClick={fetchCheatKeys}
                                disabled={loadingCheatKeys}
                                className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                            >
                                <RefreshCw size={14} className={loadingCheatKeys ? 'animate-spin' : ''} />
                                Atualizar
                            </button>
                        </div>

                        {}
                        {cheatStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-xs">Total Keys</p>
                                            <p className="text-xl font-bold">{cheatStats.total}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <Ticket className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-xs">Disponíveis</p>
                                            <p className="text-xl font-bold text-green-400">{cheatStats.available}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <ShoppingCart className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-xs">Vendidas</p>
                                            <p className="text-xl font-bold text-orange-400">{cheatStats.sold}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-xs">Receita Potencial</p>
                                            <p className="text-xl font-bold text-blue-400">
                                                R$ {(
                                                    (cheatStats.byPlan['daily']?.available || 0) * 8 +
                                                    (cheatStats.byPlan['weekly']?.available || 0) * 12 +
                                                    (cheatStats.byPlan['biweekly']?.available || 0) * 28 +
                                                    (cheatStats.byPlan['monthly']?.available || 0) * 40
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        {cheatStats && (
                            <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        📦 Estoque por Plano
                                    </h2>
                                </div>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(CHEAT_PLAN_NAMES).map(([type, name]) => (
                                        <div key={type} className="bg-neutral-900/50 rounded-lg p-4 text-center">
                                            <p className="text-neutral-400 text-sm mb-1">{name}</p>
                                            <p className="text-2xl font-bold text-purple-400">
                                                {cheatStats.byPlan[type]?.available || 0}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                R$ {CHEAT_PLAN_PRICES[type].toFixed(2)}
                                            </p>
                                            <p className="text-xs text-orange-400 mt-1">
                                                {cheatStats.byPlan[type]?.sold || 0} vendidas
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {}
                        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    🎯 Cheat Keys ({cheatKeys.length})
                                </h2>
                            </div>

                            <div className="p-6 overflow-x-auto">
                                {loadingCheatKeys ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                                        Carregando keys...
                                    </div>
                                ) : cheatKeys.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Nenhuma key cadastrada</p>
                                        <p className="text-sm">Clique em "Adicionar Keys" para começar</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="text-neutral-400 border-b border-white/5">
                                                <th className="pb-4 font-medium">Key</th>
                                                <th className="pb-4 font-medium">Plano</th>
                                                <th className="pb-4 font-medium">Preço</th>
                                                <th className="pb-4 font-medium">Status</th>
                                                <th className="pb-4 font-medium">Adicionada em</th>
                                                <th className="pb-4 font-medium text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {cheatKeys.map(k => (
                                                <tr key={k.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 font-mono text-neutral-200 text-sm">{k.key}</td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${k.planType === 'daily' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            k.planType === 'weekly' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                k.planType === 'biweekly' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                            }`}>
                                                            {CHEAT_PLAN_NAMES[k.planType]}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-green-400 font-medium">
                                                        R$ {CHEAT_PLAN_PRICES[k.planType].toFixed(2)}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${k.sold
                                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            }`}>
                                                            {k.sold ? 'Vendida' : 'Disponível'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-neutral-400 text-sm">
                                                        {new Date(k.addedAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        {!k.sold && (
                                                            <button
                                                                onClick={() => handleDeleteCheatKey(k.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {}
                {activeTab === 'modapk' && (
                    <div className="space-y-6">
                        {}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModapkModal(true)}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Adicionar Keys
                            </button>
                            <button
                                onClick={fetchModapkKeys}
                                disabled={loadingModapkKeys}
                                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                                <RefreshCw size={18} className={loadingModapkKeys ? 'animate-spin' : ''} />
                                Atualizar
                            </button>
                        </div>

                        {}
                        {modapkStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="text-neutral-400 text-sm mb-1">Total de Keys</div>
                                    <div className="text-2xl font-bold text-white">{modapkStats.total}</div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="text-neutral-400 text-sm mb-1">Disponíveis</div>
                                    <div className="text-2xl font-bold text-green-400">{modapkStats.available}</div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="text-neutral-400 text-sm mb-1">Vendidas</div>
                                    <div className="text-2xl font-bold text-orange-400">{modapkStats.sold}</div>
                                </div>
                                <div className="glass-card border border-white/10 rounded-xl p-4">
                                    <div className="text-neutral-400 text-sm mb-1">Por Plano</div>
                                    <div className="text-xs space-y-1">
                                        {Object.entries(modapkStats.byPlan || {}).map(([plan, data]: [string, any]) => (
                                            <div key={plan} className="flex justify-between">
                                                <span className="text-neutral-400">{MODAPK_PLAN_NAMES[plan]}</span>
                                                <span className="text-green-400">{data.available} disp.</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        <div className="glass-card border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">📱 Keys do ModApk Android</h3>
                            <div className="overflow-x-auto">
                                {loadingModapkKeys ? (
                                    <div className="text-center py-8 text-neutral-400">Carregando keys...</div>
                                ) : modapkKeys.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400">
                                        Nenhuma key cadastrada. Clique em "Adicionar Keys" para começar.
                                    </div>
                                ) : (
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr className="text-neutral-400 border-b border-white/5">
                                                <th className="pb-4 font-medium">Key</th>
                                                <th className="pb-4 font-medium">Plano</th>
                                                <th className="pb-4 font-medium">Preço</th>
                                                <th className="pb-4 font-medium">Status</th>
                                                <th className="pb-4 font-medium">Adicionada em</th>
                                                <th className="pb-4 font-medium text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {modapkKeys.map(k => (
                                                <tr key={k.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 font-mono text-neutral-200 text-sm">{k.key}</td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${k.planType === 'daily' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            k.planType === 'weekly' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                k.planType === 'biweekly' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                            }`}>
                                                            {MODAPK_PLAN_NAMES[k.planType]}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-green-400 font-medium">
                                                        R$ {MODAPK_PLAN_PRICES[k.planType].toFixed(2)}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${k.sold
                                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            }`}>
                                                            {k.sold ? 'Vendida' : 'Disponível'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-neutral-400 text-sm">
                                                        {new Date(k.addedAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        {!k.sold && (
                                                            <button
                                                                onClick={() => handleDeleteModapkKey(k.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {}
            {showModapkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => { setShowModapkModal(false); setModapkAddResults(null); }} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6">📱 Adicionar Keys ModApk</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Tipo de Plano</label>
                                <select
                                    value={modapkPlanType}
                                    onChange={(e) => setModapkPlanType(e.target.value as any)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-green-500"
                                >
                                    <option value="daily">Diário (1 dia) - R$ 12,00</option>
                                    <option value="weekly">Semanal (7 dias) - R$ 999,00</option>
                                    <option value="biweekly">Quinzenal (15 dias) - R$ 999,00</option>
                                    <option value="monthly">Mensal (30 dias) - R$ 999,00</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Keys (uma por linha)</label>
                                <textarea
                                    value={modapkKeysText}
                                    onChange={(e) => setModapkKeysText(e.target.value)}
                                    placeholder="KEY123456789\nKEY987654321\n..."
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-green-500 font-mono text-sm"
                                />
                            </div>

                            {modapkAddResults && (
                                <div className={`p-3 rounded-lg ${modapkAddResults.added > 0
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-red-500/10 border border-red-500/30'
                                    }`}>
                                    <p className={modapkAddResults.added > 0 ? 'text-green-400' : 'text-red-400'}>
                                        {modapkAddResults.added} key(s) adicionada(s)
                                    </p>
                                    {modapkAddResults.errors?.length > 0 && (
                                        <p className="text-red-400 text-sm mt-1">
                                            Erros: {modapkAddResults.errors.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleAddModapkKeys}
                                disabled={addingModapkKeys}
                                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {addingModapkKeys ? (
                                    <><RefreshCw className="animate-spin" size={18} /> Adicionando...</>
                                ) : (
                                    <><Plus size={18} /> Adicionar Keys</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6">Editar Produto</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Nome do Produto</label>
                                <input
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">Preço (R$)</label>
                                    <input
                                        type="number"
                                        value={editing.price}
                                        onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">Estoque</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editing.stock}
                                            onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) })}
                                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                        />
                                        {editing.type === 'PASSE' && (
                                            <button
                                                onClick={handleSyncStock}
                                                disabled={syncingStock}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                                title="Sincronizar com API BLN"
                                            >
                                                <Zap size={16} className={syncingStock ? 'animate-pulse' : ''} />
                                            </button>
                                        )}
                                    </div>
                                    {editing.type === 'PASSE' && (
                                        <p className="text-xs text-neutral-500 mt-1">Clique no raio para sincronizar com BLN</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Descrição</label>
                                <textarea
                                    value={editing.description}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">URL da Imagem</label>
                                <input
                                    value={editing.image}
                                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-sm text-neutral-400">Disponibilidade:</span>
                                <button
                                    onClick={() => setEditing({ ...editing, available: !editing.available })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${editing.available ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                                >
                                    {editing.available ? 'ATIVO' : 'INATIVO'}
                                </button>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-colors mt-4 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => { setShowAddModal(false); setAddResults([]); setAccountsText(''); }} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6">Adicionar Contas Garena</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">
                                    Contas (formato: uid:password, uma por linha)
                                </label>
                                <textarea
                                    value={accountsText}
                                    onChange={(e) => setAccountsText(e.target.value)}
                                    placeholder="123456789:senha123&#10;987654321:outrasenha&#10;..."
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white resize-none font-mono text-sm"
                                />
                            </div>

                            {addResults.length > 0 && (
                                <div className="max-h-40 overflow-y-auto bg-neutral-900 rounded-lg p-3">
                                    <p className="text-sm text-neutral-400 mb-2">Resultados:</p>
                                    {addResults.map((r, i) => (
                                        <div key={i} className={`text-sm py-1 ${r.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                                            {r.uid}: {r.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleAddAccounts}
                                disabled={addingAccounts || !accountsText.trim()}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Upload size={18} />
                                {addingAccounts ? 'Adicionando...' : 'Adicionar Contas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showGuestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => { setShowGuestModal(false); setGuestAddResults(null); setGuestAccountsText(''); }} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Gift size={20} className="text-cyan-500" />
                            Adicionar Contas Nível 15
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                                <p className="text-cyan-400 text-sm">
                                    <strong>Formato:</strong> UID:PASSWORD (uma por linha)
                                </p>
                                <p className="text-neutral-400 text-xs mt-1">
                                    Exemplo: 123456789:senha123
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">
                                    Contas Guest
                                </label>
                                <textarea
                                    value={guestAccountsText}
                                    onChange={(e) => setGuestAccountsText(e.target.value)}
                                    placeholder="123456789:senha123&#10;987654321:outrasenha&#10;..."
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {guestAddResults && (
                                <div className="bg-neutral-900 rounded-lg p-3">
                                    <p className="text-green-400 text-sm">
                                        ✅ {guestAddResults.added} conta(s) adicionada(s)
                                    </p>
                                    {guestAddResults.errors.length > 0 && (
                                        <div className="mt-2 max-h-20 overflow-y-auto">
                                            {guestAddResults.errors.map((err, i) => (
                                                <p key={i} className="text-red-400 text-xs">❌ {err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (!guestAccountsText.trim()) return;
                                    setAddingGuestAccounts(true);
                                    try {
                                        const res = await fetch('/api/admin/guest-accounts', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ accounts: guestAccountsText })
                                        });
                                        const json = await res.json();
                                        if (json.success) {
                                            setGuestAddResults(json.data);
                                            setGuestAccountsText('');
                                            fetchGuestAccounts();
                                            fetchProducts();
                                        } else {
                                            alert(json.message || 'Erro ao adicionar contas');
                                        }
                                    } catch (e) {
                                        alert('Erro ao adicionar contas');
                                    } finally {
                                        setAddingGuestAccounts(false);
                                    }
                                }}
                                disabled={addingGuestAccounts || !guestAccountsText.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Upload size={18} />
                                {addingGuestAccounts ? 'Adicionando...' : 'Adicionar Contas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showCheatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => { setShowCheatModal(false); setCheatAddResults(null); setCheatKeysText(''); }} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            🎯 Adicionar Keys de Cheat
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                <p className="text-purple-400 text-sm">
                                    <strong>Formato:</strong> Uma key por linha
                                </p>
                                <p className="text-neutral-400 text-xs mt-1">
                                    Selecione o plano e cole as keys
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Tipo de Plano</label>
                                <select
                                    value={cheatPlanType}
                                    onChange={(e) => setCheatPlanType(e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly')}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                                >
                                    <option value="daily">Diário (1 dia) - R$ 8,00</option>
                                    <option value="weekly">Semanal (7 dias) - R$ 12,00</option>
                                    <option value="biweekly">Quinzenal (15 dias) - R$ 28,00</option>
                                    <option value="monthly">Mensal (30 dias) - R$ 40,00</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">
                                    Keys (uma por linha)
                                </label>
                                <textarea
                                    value={cheatKeysText}
                                    onChange={(e) => setCheatKeysText(e.target.value)}
                                    placeholder="KEY-XXXX-XXXX-XXXX&#10;KEY-YYYY-YYYY-YYYY&#10;..."
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 resize-none font-mono text-sm"
                                />
                            </div>

                            {cheatAddResults && (
                                <div className="bg-neutral-900 rounded-lg p-3">
                                    <p className="text-green-400 text-sm">
                                        ✅ {cheatAddResults.added} key(s) adicionada(s)
                                    </p>
                                    {cheatAddResults.errors.length > 0 && (
                                        <div className="mt-2 max-h-20 overflow-y-auto">
                                            {cheatAddResults.errors.map((err, i) => (
                                                <p key={i} className="text-red-400 text-xs">❌ {err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleAddCheatKeys}
                                disabled={addingCheatKeys || !cheatKeysText.trim()}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Upload size={18} />
                                {addingCheatKeys ? 'Adicionando...' : 'Adicionar Keys'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in">
                        <button onClick={() => setShowCouponModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><X size={20} /></button>

                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Tag size={20} className="text-orange-500" />
                            Criar Novo Cupom
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Código do Cupom</label>
                                <input
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    placeholder="DESCONTO10"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white font-mono uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">Tipo</label>
                                    <select
                                        value={newCoupon.type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                    >
                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                        <option value="FIXED">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">
                                        Valor {newCoupon.type === 'PERCENTAGE' ? '(%)' : '(R$)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={newCoupon.value}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                                        placeholder={newCoupon.type === 'PERCENTAGE' ? '10' : '5.00'}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">Compra Mínima (R$)</label>
                                    <input
                                        type="number"
                                        value={newCoupon.minPurchase}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: parseFloat(e.target.value) || 0 })}
                                        placeholder="0 = sem mínimo"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-400 mb-1 block">Máximo de Usos</label>
                                    <input
                                        type="number"
                                        value={newCoupon.maxUses}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) || 0 })}
                                        placeholder="0 = ilimitado"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-400 mb-1 block">Data de Expiração (opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={newCoupon.expiresAt}
                                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-white"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-sm text-neutral-400">Status:</span>
                                <button
                                    onClick={() => setNewCoupon({ ...newCoupon, active: !newCoupon.active })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${newCoupon.active ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                                >
                                    {newCoupon.active ? 'ATIVO' : 'INATIVO'}
                                </button>
                            </div>

                            <button
                                onClick={handleCreateCoupon}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors mt-4 flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Criar Cupom
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {activeTab === 'token' && (
                <div className="space-y-6">
                    {}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-card border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                    <Users size={20} className="text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{tokenStats?.totalAccounts || 0}</p>
                                    <p className="text-neutral-400 text-sm">Total Contas</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <Diamond size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{tokenAccounts.reduce((sum: number, a: any) => sum + (a.diamonds || 0), 0)}</p>
                                    <p className="text-neutral-400 text-sm">Total Diamantes</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Gift size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{tokenStats?.totalCaixasAvailable || 0}</p>
                                    <p className="text-neutral-400 text-sm">Caixas Disponíveis</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                    <Users size={20} className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{tokenStats?.activeAccounts || 0}</p>
                                    <p className="text-neutral-400 text-sm">Contas Ativas</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="flex gap-4">
                        <button
                            onClick={handleVerifyTokenAccounts}
                            disabled={verifyingTokenAccounts}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={verifyingTokenAccounts ? 'animate-spin' : ''} />
                            {verifyingTokenAccounts ? 'Verificando...' : 'Verificar Contas'}
                        </button>
                        <button
                            onClick={() => setShowTokenModal(true)}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            Adicionar Contas
                        </button>
                    </div>

                    {}
                    <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                🎁 Contas Token ({tokenAccounts.length})
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">UID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Diamantes</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Caixas</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Presentes Hoje</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {tokenAccounts.map((a: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="px-6 py-4 text-neutral-300 font-mono">{a.uid}</td>
                                            <td className="px-6 py-4 text-neutral-300">{a.diamonds}</td>
                                            <td className="px-6 py-4 text-neutral-300">{a.caixas}</td>
                                            <td className="px-6 py-4 text-neutral-300">{a.presentesSentToday}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${a.status === 'ACTIVE'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteTokenAccount(a.uid)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {}
            {activeTab === 'streaming' && (
                <div className="space-y-6">
                    {}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card rounded-xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    📺
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">{streamingStats?.total || 0}</div>
                            <div className="text-xs text-neutral-400">Total de Keys</div>
                        </div>
                        <div className="glass-card rounded-xl p-6 border border-green-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    ✅
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-green-400">{streamingStats?.available || 0}</div>
                            <div className="text-xs text-neutral-400">Disponíveis</div>
                        </div>
                        <div className="glass-card rounded-xl p-6 border border-yellow-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                    💰
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-yellow-400">{streamingStats?.sold || 0}</div>
                            <div className="text-xs text-neutral-400">Vendidas</div>
                        </div>
                    </div>

                    {}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowStreamingModal(true)}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            Adicionar Keys
                        </button>
                        <button
                            onClick={fetchStreamingKeys}
                            disabled={loadingStreamingKeys}
                            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loadingStreamingKeys ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>

                    {}
                    <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                📺 Estoque por Plataforma
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(STREAMING_PLATFORMS).map(([key, name]) => {
                                    const platformData = streamingKeys.find(p => p.platform === key);
                                    return (
                                        <div key={key} className="glass-card rounded-lg p-4 border border-white/10">
                                            <div className="text-lg font-bold text-white">{name}</div>
                                            <div className="flex justify-between mt-2 text-sm">
                                                <span className="text-green-400">Disponível: {platformData?.count || 0}</span>
                                                <span className="text-yellow-400">Vendidas: {platformData?.sold || 0}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showStreamingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-800">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Adicionar Keys de Streaming</h2>
                                <button
                                    onClick={() => {
                                        setShowStreamingModal(false);
                                        setStreamingAddResults(null);
                                        setStreamingKeysText('');
                                    }}
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Plataforma
                                </label>
                                <select
                                    value={streamingPlatform}
                                    onChange={(e) => setStreamingPlatform(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                                >
                                    {Object.entries(STREAMING_PLATFORMS).map(([key, name]) => (
                                        <option key={key} value={key}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Keys (formato: email:password, uma por linha)
                                </label>
                                <textarea
                                    value={streamingKeysText}
                                    onChange={(e) => setStreamingKeysText(e.target.value)}
                                    placeholder="email@example.com:password123&#10;outro@email.com:outrasenha"
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-red-500"
                                />
                            </div>

                            {streamingAddResults && (
                                <div className={`p-3 rounded-lg ${streamingAddResults.added > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    <p className="font-medium">{streamingAddResults.added} key(s) adicionada(s)</p>
                                    {streamingAddResults.errors.length > 0 && (
                                        <ul className="text-xs mt-2 space-y-1">
                                            {streamingAddResults.errors.slice(0, 5).map((err: string, i: number) => (
                                                <li key={i}>• {err}</li>
                                            ))}
                                            {streamingAddResults.errors.length > 5 && (
                                                <li>... e mais {streamingAddResults.errors.length - 5} erros</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleAddStreamingKeys}
                                disabled={addingStreamingKeys}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {addingStreamingKeys ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Adicionando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Adicionar Keys
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {showTokenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-800">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Adicionar Contas Token</h2>
                                <button
                                    onClick={() => {
                                        setShowTokenModal(false);
                                        setTokenAddResults(null);
                                        setTokenAccountsText('');
                                    }}
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Contas (formato: uid:password, uma por linha)
                                </label>
                                <textarea
                                    value={tokenAccountsText}
                                    onChange={(e) => setTokenAccountsText(e.target.value)}
                                    placeholder="123456789:senha123&#10;987654321:outrasenha"
                                    rows={8}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-yellow-500"
                                />
                            </div>

                            {tokenAddResults && (
                                <div className={`p-3 rounded-lg ${tokenAddResults.added > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    <p className="font-medium">{tokenAddResults.added} conta(s) adicionada(s)</p>
                                    {tokenAddResults.errors.length > 0 && (
                                        <ul className="text-xs mt-2 space-y-1">
                                            {tokenAddResults.errors.slice(0, 5).map((err: string, i: number) => (
                                                <li key={i}>• {err}</li>
                                            ))}
                                            {tokenAddResults.errors.length > 5 && (
                                                <li>... e mais {tokenAddResults.errors.length - 5} erros</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleAddTokenAccounts}
                                disabled={addingTokenAccounts}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {addingTokenAccounts ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Adicionando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Adicionar Contas
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
