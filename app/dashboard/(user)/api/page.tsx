"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Code, Zap, Heart, CheckCircle, XCircle, DollarSign, Target, Shield, CreditCard, Package, RefreshCw, ExternalLink } from "lucide-react";
import { decryptData } from "@/lib/crypto";
import Link from "next/link";

interface ApiKey {
    id: string;
    key: string;
    name: string;
    active: boolean;
    usageCount: number;
    lastUsed?: string;
    createdAt: string;
    fullKey?: string;
}

interface ProductData {
    id: string;
    name: string;
    description: string;
    type: string;
    price: {
        original: number;
        final: number;
        discount: number;
        currency: string;
    };
    stock: number;
    available: boolean;
    endpoint: string;
    method: string;
    requiredFields: string[];
    optionalFields: string[];
    plans?: Record<string, {
        name: string;
        price: { original: number; final: number; discount: number; currency: string };
        stock: number;
        available: boolean;
    }>;
}

interface ApiProductsData {
    success: boolean;
    data: {
        products: Record<string, ProductData>;
        summary: {
            totalProducts: number;
            availableProducts: number;
            currency: string;
        };
        user?: {
            email: string;
            name: string;
            balance: number;
            hasDiscount: boolean;
            discount: { type: string; value: number } | null;
        };
    };
}

export default function ApiPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [showNewKey, setShowNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');
    const [activeDocTab, setActiveDocTab] = useState<'products' | 'prices' | 'passe' | 'likes' | 'guest' | 'bypass' | 'cheat' | 'cheat-stock' | 'modapk' | 'modapk-stock' | 'deposit' | 'deposit-check' | 'balance'>('products');
    const [error, setError] = useState("");
    const [productsData, setProductsData] = useState<ApiProductsData | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        fetchApiKeys();
        fetchProducts();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const res = await fetch("/api/user/apikey");
            const json = await res.json();
            if (json.success && json.data) {
                const data = decryptData(json.data);
                setApiKeys(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Erro ao buscar API keys:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch("/api/v1/products");
            const json = await res.json();
            if (json.success) {
                setProductsData(json);
            }
        } catch (e) {
            console.error("Erro ao buscar produtos:", e);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim() || newKeyName.length < 3) {
            setError("Nome deve ter pelo menos 3 caracteres");
            return;
        }

        setCreating(true);
        setError("");

        try {
            const res = await fetch("/api/user/apikey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newKeyName.trim() })
            });
            const json = await res.json();

            if (json.success && json.data) {
                const data = decryptData(json.data);
                setShowNewKey(data.fullKey);
                setNewKeyName("");
                fetchApiKeys();
            } else {
                setError(json.message || "Erro ao criar API key");
            }
        } catch (e) {
            setError("Erro de conexão");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm("Tem certeza que deseja remover esta API key?")) return;

        try {
            const res = await fetch("/api/user/apikey", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyId })
            });
            const json = await res.json();

            if (json.success) {
                fetchApiKeys();
            } else {
                setError(json.message || "Erro ao remover");
            }
        } catch (e) {
            setError("Erro de conexão");
        }
    };

    const handleToggleKey = async (keyId: string) => {
        try {
            const res = await fetch("/api/user/apikey", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyId })
            });
            const json = await res.json();

            if (json.success) {
                fetchApiKeys();
            }
        } catch (e) {
            console.error("Erro ao alternar key:", e);
        }
    };

    const copyToClipboard = (text: string, id?: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id || 'default');
        setTimeout(() => setCopied(null), 2000);
    };

    const formatPrice = (price: number) => `R$ ${price.toFixed(2)}`;

    const StockBadge = ({ stock, available }: { stock: number; available: boolean }) => {
        if (stock === -1) {
            return <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 rounded-full">Ilimitado</span>;
        }
        if (!available || stock === 0) {
            return <span className="text-[10px] sm:text-xs bg-red-500/20 text-red-400 px-1.5 sm:px-2 py-0.5 rounded-full">Esgotado</span>;
        }
        return <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 rounded-full">{stock} em estoque</span>;
    };

    const CodeBlock = ({ code, id, language = "json" }: { code: string; id: string; language?: string }) => (
        <div className="relative group">
            <pre className="bg-black/50 p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs font-mono overflow-x-auto border border-white/5 max-h-[250px] overflow-y-auto">
                <code className="text-neutral-300 whitespace-pre-wrap break-words">{code}</code>
            </pre>
            <button
                onClick={() => copyToClipboard(code, id)}
                className="absolute top-1.5 right-1.5 p-1 bg-white/10 hover:bg-white/20 rounded transition-all"
                title="Copiar código"
            >
                {copied === id ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                )}
            </button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-2 sm:px-4">
            {}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Code className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                    <h2 className="text-xl sm:text-3xl font-bold">API para Desenvolvedores</h2>
                </div>
                <Link 
                    href="/docs" 
                    className="sm:ml-auto flex items-center gap-1 text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Documentação Pública</span>
                </Link>
            </div>

            <p className="text-neutral-400 text-xs sm:text-sm mb-4 sm:mb-6">
                Integre nossos serviços diretamente em sua aplicação. O valor é descontado do seu saldo automaticamente.
            </p>

            {}
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                <button
                    onClick={() => setActiveTab('keys')}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        activeTab === 'keys' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                >
                    <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Minhas</span> API Keys
                </button>
                <Link
                    href="/docs"
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                >
                    <Code className="w-3 h-3 sm:w-4 sm:h-4" />
                    Documentação
                    <ExternalLink className="w-3 h-3" />
                </Link>
            </div>

            {activeTab === 'keys' && (
                <div className="space-y-4 sm:space-y-6">
                    {}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            Criar Nova API Key
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="Nome da aplicação (ex: Meu Bot)"
                                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 sm:px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <button
                                onClick={handleCreateKey}
                                disabled={creating}
                                className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                            >
                                {creating ? "Criando..." : "Criar Key"}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-xs sm:text-sm mt-2">{error}</p>}
                    </div>

                    {}
                    {showNewKey && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-4 sm:p-6">
                                <div className="text-center mb-4">
                                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-lg sm:text-xl font-bold text-green-400">API Key Criada!</h3>
                                    <p className="text-neutral-400 text-xs sm:text-sm mt-2">
                                        Guarde esta chave em um lugar seguro. Ela não será mostrada novamente.
                                    </p>
                                </div>
                                <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 sm:p-4 font-mono text-[10px] sm:text-sm break-all">
                                    {showNewKey}
                                </div>
                                <div className="flex gap-2 sm:gap-3 mt-4">
                                    <button
                                        onClick={() => copyToClipboard(showNewKey, 'newkey')}
                                        className="flex-1 bg-neutral-800 text-white py-2 rounded-lg hover:bg-neutral-700 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied === 'newkey' ? "Copiado!" : "Copiar"}
                                    </button>
                                    <button
                                        onClick={() => setShowNewKey(null)}
                                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-neutral-800">
                            <h3 className="font-bold text-sm sm:text-base">Suas API Keys ({apiKeys.length}/5)</h3>
                        </div>
                        {loading ? (
                            <div className="p-6 sm:p-8 text-center text-neutral-500 text-sm">Carregando...</div>
                        ) : apiKeys.length === 0 ? (
                            <div className="p-6 sm:p-8 text-center text-neutral-500 text-sm">
                                Nenhuma API key criada ainda
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-800">
                                {apiKeys.map((key) => (
                                    <div key={key.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">{key.name}</span>
                                                {key.active ? (
                                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Ativa</span>
                                                ) : (
                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Inativa</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-neutral-500 font-mono mt-1 truncate">{key.key}</div>
                                            <div className="text-[10px] text-neutral-600 mt-1">
                                                {key.usageCount} usos • Criada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-center">
                                            <button
                                                onClick={() => handleToggleKey(key.id)}
                                                className={`p-2 rounded-lg ${key.active ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'} hover:opacity-80`}
                                                title={key.active ? "Desativar" : "Ativar"}
                                            >
                                                {key.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:opacity-80"
                                                title="Remover"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {}
            {false && (
                <div className="space-y-4 sm:space-y-6">
                    {}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="text-lg">🔐</span>
                            Autenticação
                        </h3>
                        <p className="text-neutral-400 text-xs sm:text-sm mb-3">
                            Todas as requisições devem incluir sua API Key no header <code className="text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded text-[10px]">x-api-key</code>.
                        </p>
                        <CodeBlock 
                            id="auth"
                            code={`{
  "Content-Type": "application/json",
  "x-api-key": "lhub_sua_api_key_aqui"
}`}
                        />
                    </div>

                    {}
                    <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'products', label: 'Produtos', icon: Package, color: 'purple' },
                            { id: 'prices', label: 'Preços', icon: DollarSign, color: 'green' },
                            { id: 'passe', label: 'Passe', icon: Zap, color: 'yellow' },
                            { id: 'likes', label: 'Likes', icon: Heart, color: 'pink' },
                            { id: 'guest', label: 'Guest', icon: Shield, color: 'orange' },
                            { id: 'bypass', label: 'Bypass', icon: Zap, color: 'cyan' },
                            { id: 'cheat', label: 'Cheat', icon: Target, color: 'red' },
                            { id: 'cheat-stock', label: 'Estoque Cheat', icon: Package, color: 'violet' },
                            { id: 'modapk', label: 'ModApk', icon: Target, color: 'lime' },
                            { id: 'modapk-stock', label: 'Estoque ModApk', icon: Package, color: 'lime' },
                            { id: 'deposit', label: 'Depósito', icon: CreditCard, color: 'emerald' },
                            { id: 'deposit-check', label: 'Verificar Depósito', icon: CheckCircle, color: 'teal' },
                            { id: 'balance', label: 'Saldo', icon: DollarSign, color: 'blue' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveDocTab(tab.id as any)}
                                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                                    activeDocTab === tab.id 
                                        ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30` 
                                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'
                                }`}
                            >
                                <tab.icon className="w-3 h-3" />
                                <span className="hidden xs:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {}
                    {activeDocTab === 'products' && (
                        <div className="bg-neutral-900 border border-purple-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                                <h3 className="text-base sm:text-xl font-bold">Produtos & Estoque</h3>
                                <span className="text-purple-400 text-xs sm:text-sm">GET /api/v1/products</span>
                                <button 
                                    onClick={fetchProducts}
                                    className="ml-auto p-1.5 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors"
                                    title="Atualizar"
                                >
                                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-purple-400 ${loadingProducts ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="text-purple-400 text-[10px] sm:text-xs">
                                    📦 Esta API retorna todos os produtos com preços e estoque em tempo real. Não requer autenticação para consulta básica.
                                </p>
                            </div>

                            {}
                            {loadingProducts ? (
                                <div className="flex items-center justify-center py-6">
                                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                                </div>
                            ) : productsData?.data?.products ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
                                    {Object.entries(productsData!.data.products).map(([key, product]) => (
                                        <div key={key} className="bg-black/30 border border-neutral-800 rounded-lg p-2 sm:p-3 hover:border-purple-500/30 transition-colors">
                                            <div className="flex items-start justify-between mb-1 sm:mb-2">
                                                <h4 className="font-bold text-xs sm:text-sm text-white">{product.name}</h4>
                                                <StockBadge stock={product.stock} available={product.available} />
                                            </div>
                                            
                                            {product.plans ? (
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    {Object.entries(product.plans).map(([planKey, plan]) => (
                                                        <div key={planKey} className="flex items-center justify-between text-[9px] sm:text-[10px]">
                                                            <span className="text-neutral-400">{planKey}</span>
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <span className="text-white font-medium">{formatPrice(plan.price.final)}</span>
                                                                <span className="text-neutral-600">({plan.stock})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-neutral-400 text-[10px] sm:text-xs">Preço:</span>
                                                    <span className="text-base sm:text-lg font-bold text-purple-400">{formatPrice(product.price.final)}</span>
                                                </div>
                                            )}
                                            
                                            <div className="mt-2 pt-2 border-t border-neutral-800">
                                                <code className="text-[8px] sm:text-[9px] text-neutral-500">{product.method} {product.endpoint}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            <div>
                                <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta da API:</p>
                                <CodeBlock 
                                    id="products-response"
                                    code={`{
  "success": true,
  "data": {
    "products": {
      "passe": {
        "id": "passe",
        "name": "Passe de Elite",
        "price": { "original": ${productsData?.data?.products?.passe?.price?.original?.toFixed(2) || '3.50'}, "final": ${productsData?.data?.products?.passe?.price?.final?.toFixed(2) || '3.50'}, "discount": ${productsData?.data?.products?.passe?.price?.discount?.toFixed(2) || '0.00'} },
        "stock": ${productsData?.data?.products?.passe?.stock || 0},
        "available": ${productsData?.data?.products?.passe?.available || false},
        "endpoint": "/api/v1/passe"
      },
      "likes": { ... },
      "guest": { ... },
      "bypass": { ... },
      "cheat": { "plans": { "daily": {...}, "weekly": {...} } }
    },
    "summary": {
      "totalProducts": 5,
      "availableProducts": ${productsData?.data?.summary?.availableProducts || 0}
    }
  }
}`}
                                />
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'passe' && (
                        <div className="bg-neutral-900 border border-yellow-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                                <h3 className="text-base sm:text-xl font-bold">Enviar Passe</h3>
                                <span className="text-yellow-400 text-xs sm:text-sm">POST /api/v1/passe</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                        {formatPrice(productsData?.data?.products?.passe?.price?.final || 4.00)}
                                    </span>
                                    <StockBadge 
                                        stock={productsData?.data?.products?.passe?.stock || 0} 
                                        available={productsData?.data?.products?.passe?.available || false} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request Body:</p>
                                    <CodeBlock 
                                        id="passe-body"
                                        code={`{
  "uid": "13429671214",
  "message": "Presente!"
}`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta de Sucesso:</p>
                                    <CodeBlock 
                                        id="passe-response"
                                        code={`{
  "success": true,
  "message": "Passe enviado com sucesso!",
  "data": {
    "uid": "13429671214",
    "transactionId": "api_1234567890_abc",
    "originalPrice": ${productsData?.data?.products?.passe?.price?.original?.toFixed(2) || '3.50'},
    "discount": ${productsData?.data?.products?.passe?.price?.discount?.toFixed(2) || '0.00'},
    "finalPrice": ${productsData?.data?.products?.passe?.price?.final?.toFixed(2) || '3.50'},
    "newBalance": ${(100 - (productsData?.data?.products?.passe?.price?.final || 3.50)).toFixed(2)}
  }
}`}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-neutral-400 text-xs mb-2 font-medium">🐍 Python:</p>
                                        <CodeBlock 
                                            id="passe-python"
                                            language="python"
                                            code={`import requests

res = requests.post(
    "https://lhubff.com.br/api/v1/passe",
    headers={"x-api-key": "sua_key"},
    json={"uid": "13429671214"}
)
print(res.json())`}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-neutral-400 text-xs mb-2 font-medium">🟨 JavaScript:</p>
                                        <CodeBlock 
                                            id="passe-js"
                                            language="javascript"
                                            code={`const res = await fetch(
  "https://lhubff.com.br/api/v1/passe",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "sua_key"
    },
    body: JSON.stringify({ uid: "13429671214" })
  }
);`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'likes' && (
                        <div className="bg-neutral-900 border border-pink-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                                <h3 className="text-base sm:text-xl font-bold">Enviar Likes</h3>
                                <span className="text-pink-400 text-xs sm:text-sm">POST /api/v1/likes</span>
                                <span className="ml-auto text-[10px] sm:text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                                    {formatPrice(productsData?.data?.products?.likes?.price?.final || 0.90)} / 100-250 likes
                                </span>
                            </div>

                            <div className="mb-3 p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                                <p className="text-pink-400 text-[10px] sm:text-xs">
                                    💗 Envia entre 100 e 250 likes por requisição. Se enviar menos de 100, o saldo NÃO é cobrado.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request Body:</p>
                                    <CodeBlock 
                                        id="likes-body"
                                        code={`{
  "uid": "13429671214",
  "region": "BR"
}`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta de Sucesso:</p>
                                    <CodeBlock 
                                        id="likes-response"
                                        code={`{
  "success": true,
  "message": "250 likes enviados com sucesso!",
  "data": {
    "uid": "13429671214",
    "likes": 250,
    "transactionId": "api_likes_1234567890_abc",
    "finalPrice": ${productsData?.data?.products?.likes?.price?.final?.toFixed(2) || '0.90'},
    "newBalance": ${(100 - (productsData?.data?.products?.likes?.price?.final || 0.90)).toFixed(2)},
    "playerName": "NomeDoJogador"
  }
}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'guest' && (
                        <div className="bg-neutral-900 border border-orange-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                                <h3 className="text-base sm:text-xl font-bold">Conta Guest</h3>
                                <span className="text-orange-400 text-xs sm:text-sm">POST /api/v1/guest</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                        {formatPrice(productsData?.data?.products?.guest?.price?.final || 0.70)}
                                    </span>
                                    <StockBadge 
                                        stock={productsData?.data?.products?.guest?.stock || 0} 
                                        available={productsData?.data?.products?.guest?.available || false} 
                                    />
                                </div>
                            </div>

                            <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <p className="text-orange-400 text-[10px] sm:text-xs">
                                    👤 Conta Nível 15 + Troca de Nick. Entrega instantânea no formato UID:SENHA.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request:</p>
                                    <CodeBlock 
                                        id="guest-body"
                                        code={`// Nenhum parâmetro necessário no body
POST /api/v1/guest
Headers: { "x-api-key": "sua_api_key" }`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta de Sucesso:</p>
                                    <CodeBlock 
                                        id="guest-response"
                                        code={`{
  "success": true,
  "message": "Conta adquirida com sucesso!",
  "data": {
    "account": "123456789:senha123",
    "uid": "123456789",
    "password": "senha123",
    "transactionId": "api_guest_1234567890_abc",
    "finalPrice": ${productsData?.data?.products?.guest?.price?.final?.toFixed(2) || '0.70'},
    "newBalance": ${(100 - (productsData?.data?.products?.guest?.price?.final || 0.70)).toFixed(2)}
  }
}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'bypass' && (
                        <div className="bg-neutral-900 border border-cyan-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                                <h3 className="text-base sm:text-xl font-bold">Bypass UID</h3>
                                <span className="text-cyan-400 text-xs sm:text-sm">POST /api/v1/bypass</span>
                                <span className="ml-auto text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                                    {formatPrice(productsData?.data?.products?.bypass?.price?.final || 20.00)} / 30 dias
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request Body:</p>
                                    <CodeBlock 
                                        id="bypass-body"
                                        code={`{
  "uid": "13429671214",
  "days": 30
}`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta de Sucesso:</p>
                                    <CodeBlock 
                                        id="bypass-response"
                                        code={`{
  "success": true,
  "message": "UID 13429671214 adicionado com sucesso",
  "data": {
    "uid": "13429671214",
    "days": 30,
    "expiration": "15/02/2026 23:29:12",
    "transactionId": "api_bypass_1234567890_abc",
    "finalPrice": ${productsData?.data?.products?.bypass?.price?.final?.toFixed(2) || '20.00'},
    "newBalance": ${(100 - (productsData?.data?.products?.bypass?.price?.final || 20.00)).toFixed(2)},
    "downloadUrl": "https://...",
    "tutorialUrl": "https://..."
  }
}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'cheat' && (
                        <div className="bg-neutral-900 border border-red-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                                <h3 className="text-base sm:text-xl font-bold">Cheat External</h3>
                                <span className="text-red-400 text-xs sm:text-sm">POST /api/v1/cheat</span>
                            </div>

                            {}
                            {productsData?.data?.products?.cheat?.plans && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {Object.entries(productsData!.data.products.cheat.plans!).map(([key, plan]) => (
                                        <div key={key} className="bg-black/30 p-2 rounded-lg text-center border border-neutral-800">
                                            <span className="text-[10px] text-neutral-400">{key}</span>
                                            <p className="text-white font-bold text-sm">{formatPrice(plan.price.final)}</p>
                                            <span className="text-[9px] text-neutral-500">{plan.stock} keys</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request Body:</p>
                                    <CodeBlock 
                                        id="cheat-body"
                                        code={`{
  "planType": "weekly"
}`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta de Sucesso:</p>
                                    <CodeBlock 
                                        id="cheat-response"
                                        code={`{
  "success": true,
  "message": "Cheat adquirido com sucesso!",
  "data": {
    "key": "CHEAT-XXXX-XXXX-XXXX",
    "planType": "weekly",
    "planName": "Semanal (7 dias)",
    "price": ${productsData?.data?.products?.cheat?.plans?.weekly?.price?.final?.toFixed(2) || '12.00'},
    "newBalance": ${(100 - (productsData?.data?.products?.cheat?.plans?.weekly?.price?.final || 12.00)).toFixed(2)},
    "downloadUrl": "https://...",
    "tutorialUrl": "https://..."
  }
}`}
                                    />
                                </div>

                                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 text-[10px] sm:text-xs font-medium">📊 Verificar Estoque:</p>
                                    <code className="text-[10px] text-neutral-400">GET /api/v1/cheat/stock</code>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'prices' && (
                        <div className="bg-neutral-900 border border-green-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                                <h3 className="text-base sm:text-xl font-bold">Consultar Preços</h3>
                                <span className="text-green-400 text-xs sm:text-sm">GET/POST /api/v1/prices</span>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-green-400 text-[10px] sm:text-xs">
                                    💰 Retorna preços com desconto personalizado do usuário autenticado.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">GET - Lista todos os preços:</p>
                                    <CodeBlock 
                                        id="prices-get"
                                        code={`// GET /api/v1/prices\n// Resposta\n{\n  "success": true,\n  "data": {\n    "prices": {\n      "passe": { "original": 4.00, "final": 3.60, "discount": 0.40, "stock": 10 },\n      "likes": { "original": 0.90, "final": 0.90, "discount": 0, "stock": -1 }\n    },\n    "user": { "email": "...", "balance": 100.00, "hasDiscount": true }\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">POST - Verificar preço específico:</p>
                                    <CodeBlock 
                                        id="prices-post"
                                        code={`// POST /api/v1/prices\n{ "product": "passe", "quantity": 5 }\n\n// Resposta\n{\n  "success": true,\n  "data": {\n    "product": "passe",\n    "quantity": 5,\n    "pricing": { "unitPrice": 4.00, "finalUnitPrice": 3.60, "totalPrice": 18.00 },\n    "user": { "balance": 100.00, "canAfford": true }\n  }\n}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'deposit' && (
                        <div className="bg-neutral-900 border border-emerald-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                                <h3 className="text-base sm:text-xl font-bold">Depósito PIX</h3>
                                <span className="text-emerald-400 text-xs sm:text-sm">POST /api/v1/deposit</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Criar Depósito:</p>
                                    <CodeBlock 
                                        id="deposit-body"
                                        code={`{
  "amount": 10.00,
  "payerName": "Nome",
  "payerDocument": "12345678901"
}`}
                                    />
                                </div>

                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta:</p>
                                    <CodeBlock 
                                        id="deposit-response"
                                        code={`{
  "success": true,
  "data": {
    "transactionId": "TX-API-1234567890-123",
    "amount": 10.00,
    "status": "PENDING",
    "pix": {
      "qrCodeUrl": "https://...",
      "copyPaste": "00020101021226..."
    }
  }
}`}
                                    />
                                </div>

                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-emerald-400 text-[10px] sm:text-xs font-medium">🔄 Verificar Status:</p>
                                    <code className="text-[10px] text-neutral-400">POST /api/v1/deposit/check</code>
                                    <p className="text-neutral-500 text-[9px] mt-1">Body: {"{"}"transactionId": "TX-API-..."{"}"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'cheat-stock' && (
                        <div className="bg-neutral-900 border border-violet-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                                <h3 className="text-base sm:text-xl font-bold">Estoque do Cheat</h3>
                                <span className="text-violet-400 text-xs sm:text-sm">GET /api/v1/cheat/stock</span>
                                <span className="ml-auto text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                    Público
                                </span>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                <p className="text-violet-400 text-[10px] sm:text-xs">
                                    📊 Verifica o estoque de keys do cheat por plano. Não requer autenticação.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta:</p>
                                    <CodeBlock 
                                        id="cheat-stock-response"
                                        code={`{\n  "success": true,\n  "data": {\n    "daily": { "stock": 10, "price": 8.00, "available": true },\n    "weekly": { "stock": 5, "price": 12.00, "available": true },\n    "biweekly": { "stock": 3, "price": 28.00, "available": true },\n    "monthly": { "stock": 2, "price": 40.00, "available": true },\n    "totalStock": 20\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">🐍 Python:</p>
                                    <CodeBlock 
                                        id="cheat-stock-python"
                                        code={`import requests\n\nresponse = requests.get("https://lhubff.com.br/api/v1/cheat/stock")\ndata = response.json()\n\nfor plan, info in data['data'].items():\n    if plan != 'totalStock':\n        print(f"{plan}: {info['stock']} keys - R$ {info['price']:.2f}")`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'modapk' && (
                        <div className="bg-neutral-900 border border-lime-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-lime-400" />
                                <h3 className="text-base sm:text-xl font-bold">Comprar ModApk Android</h3>
                                <span className="text-lime-400 text-xs sm:text-sm">POST /api/v1/modapk</span>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg">
                                <p className="text-lime-400 text-[10px] sm:text-xs">
                                    📱 Compre ModApk para Android via API. A key é enviada por email automaticamente.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request:</p>
                                    <CodeBlock 
                                        id="modapk-request"
                                        code={`{ "planType": "daily" }\n\n// Planos disponíveis:\n// daily - Diário (1 dia) - R$ 12,00\n// weekly - Semanal (7 dias) - R$ 999,00\n// biweekly - Quinzenal (15 dias) - R$ 999,00\n// monthly - Mensal (30 dias) - R$ 999,00`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta:</p>
                                    <CodeBlock 
                                        id="modapk-response"
                                        code={`{\n  "success": true,\n  "message": "ModApk adquirido com sucesso!",\n  "data": {\n    "transactionId": "TX-MODAPK-API-1234567890",\n    "key": "MODAPK-KEY-XXXXX",\n    "planType": "daily",\n    "planName": "Diário (1 dia)",\n    "price": 12.00,\n    "downloadUrl": "https://...",\n    "tutorialUrl": "https://...",\n    "newBalance": 88.00\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">🐍 Python:</p>
                                    <CodeBlock 
                                        id="modapk-python"
                                        code={`import requests\n\nAPI_KEY = "sua_api_key"\n\nresponse = requests.post(\n    "https://lhubff.com.br/api/v1/modapk",\n    headers={"x-api-key": API_KEY},\n    json={"planType": "daily"}\n)\n\ndata = response.json()\nif data['success']:\n    print(f"Key: {data['data']['key']}")\n    print(f"Download: {data['data']['downloadUrl']}")\n    print(f"Tutorial: {data['data']['tutorialUrl']}")`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'modapk-stock' && (
                        <div className="bg-neutral-900 border border-lime-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-lime-400" />
                                <h3 className="text-base sm:text-xl font-bold">Estoque do ModApk</h3>
                                <span className="text-lime-400 text-xs sm:text-sm">GET /api/v1/modapk/stock</span>
                                <span className="ml-auto text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                    Público
                                </span>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-lime-500/10 border border-lime-500/20 rounded-lg">
                                <p className="text-lime-400 text-[10px] sm:text-xs">
                                    📊 Verifica o estoque de keys do ModApk por plano. Não requer autenticação.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta:</p>
                                    <CodeBlock 
                                        id="modapk-stock-response"
                                        code={`{\n  "success": true,\n  "data": {\n    "daily": { "stock": 10, "price": 12.00, "available": true },\n    "weekly": { "stock": 5, "price": 999.00, "available": true },\n    "biweekly": { "stock": 3, "price": 999.00, "available": true },\n    "monthly": { "stock": 2, "price": 999.00, "available": true },\n    "totalStock": 20\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">🐍 Python:</p>
                                    <CodeBlock 
                                        id="modapk-stock-python"
                                        code={`import requests\n\nresponse = requests.get("https://lhubff.com.br/api/v1/modapk/stock")\ndata = response.json()\n\nfor plan, info in data['data'].items():\n    if plan != 'totalStock':\n        print(f"{plan}: {info['stock']} keys - R$ {info['price']:.2f}")`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'deposit-check' && (
                        <div className="bg-neutral-900 border border-teal-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
                                <h3 className="text-base sm:text-xl font-bold">Verificar Status do Depósito</h3>
                                <span className="text-teal-400 text-xs sm:text-sm">POST /api/v1/deposit/check</span>
                            </div>

                            <div className="mb-4 p-2 sm:p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                                <p className="text-teal-400 text-[10px] sm:text-xs">
                                    🔄 Faça polling a cada 5 segundos até receber status APPROVED ou FAILED.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">📤 Request:</p>
                                    <CodeBlock 
                                        id="deposit-check-body"
                                        code={`{ "transactionId": "TX-API-1234567890-123" }`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Pendente:</p>
                                    <CodeBlock 
                                        id="deposit-check-pending"
                                        code={`{\n  "success": true,\n  "data": {\n    "transactionId": "TX-API-1234567890-123",\n    "status": "PENDING",\n    "amount": 10.00,\n    "message": "Aguardando pagamento..."\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Aprovado:</p>
                                    <CodeBlock 
                                        id="deposit-check-approved"
                                        code={`{\n  "success": true,\n  "data": {\n    "transactionId": "TX-API-1234567890-123",\n    "status": "APPROVED",\n    "amount": 10.00,\n    "previousBalance": 90.00,\n    "newBalance": 100.00,\n    "message": "Pagamento aprovado!"\n  }\n}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">🐍 Python - Polling:</p>
                                    <CodeBlock 
                                        id="deposit-check-python"
                                        code={`import requests, time\n\ndef check_payment(tx_id, api_key):\n    while True:\n        r = requests.post(\n            "https://passesff.squareweb.app/api/v1/deposit/check",\n            headers={"x-api-key": api_key},\n            json={"transactionId": tx_id}\n        )\n        status = r.json()['data']['status']\n        if status == 'APPROVED':\n            print("Pagamento aprovado!")\n            return True\n        elif status == 'FAILED':\n            print("Pagamento falhou")\n            return False\n        time.sleep(5)`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeDocTab === 'balance' && (
                        <div className="bg-neutral-900 border border-green-500/20 rounded-xl p-3 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                                <h3 className="text-base sm:text-xl font-bold">Consultar Saldo</h3>
                                <span className="text-green-400 text-xs sm:text-sm">GET /api/v1/balance</span>
                                <span className="ml-auto text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                    Gratuito
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-neutral-400 text-xs mb-2 font-medium">✅ Resposta:</p>
                                    <CodeBlock 
                                        id="balance-response"
                                        code={`{
  "success": true,
  "data": {
    "balance": 100.00,
    "email": "usuario@email.com",
    "name": "Usuario",
    "products": [
      { "id": "passe", "name": "Passe", "price": 4.00, "stock": 10 },
      { "id": "likes", "name": "Likes", "price": 0.90, "stock": -1 }
    ]
  }
}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    <div className="bg-neutral-900 border border-red-500/20 rounded-xl p-3 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                            Códigos de Erro
                        </h3>
                        
                        <div className="overflow-x-auto -mx-3 sm:mx-0">
                            <table className="w-full text-[10px] sm:text-xs min-w-[350px]">
                                <thead>
                                    <tr className="border-b border-neutral-800">
                                        <th className="text-left py-2 px-2 text-neutral-400 font-medium">Código</th>
                                        <th className="text-left py-2 px-2 text-neutral-400 font-medium">Status</th>
                                        <th className="text-left py-2 px-2 text-neutral-400 font-medium">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    <tr>
                                        <td className="py-2 px-2"><code className="text-red-400">MISSING_API_KEY</code></td>
                                        <td className="py-2 px-2 text-yellow-400">401</td>
                                        <td className="py-2 px-2 text-neutral-400">API Key não fornecida</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-2"><code className="text-red-400">INVALID_API_KEY</code></td>
                                        <td className="py-2 px-2 text-yellow-400">401</td>
                                        <td className="py-2 px-2 text-neutral-400">API Key inválida</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-2"><code className="text-red-400">INSUFFICIENT_BALANCE</code></td>
                                        <td className="py-2 px-2 text-yellow-400">400</td>
                                        <td className="py-2 px-2 text-neutral-400">Saldo insuficiente</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-2"><code className="text-red-400">OUT_OF_STOCK</code></td>
                                        <td className="py-2 px-2 text-yellow-400">400</td>
                                        <td className="py-2 px-2 text-neutral-400">Produto sem estoque</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-2"><code className="text-red-400">SEND_FAILED</code></td>
                                        <td className="py-2 px-2 text-yellow-400">400</td>
                                        <td className="py-2 px-2 text-neutral-400">Falha ao enviar</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
