"use client";

import { useState, useEffect } from "react";
import { Copy, QrCode, CreditCard, Check, Loader2, AlertCircle, X, ShieldAlert, FileText } from "lucide-react";

export default function RecargasPage() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<{ qrCodeBase64?: string, qrcodeUrl?: string, copyPaste: string, transactionId?: string } | null>(null);
    const [step, setStep] = useState(1);

    const [user, setUser] = useState({ name: "", email: "" });
    const [cpf, setCpf] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        const local = localStorage.getItem("user_session");
        if (local) {
            try {
                const session = JSON.parse(local);
                setUser({
                    name: session.name || "Usuário",
                    email: session.email || ""
                });
            } catch (e) {
                console.error("Invalid session");
            }
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (step === 2 && qrData?.transactionId) {
            const pendingDeposit = {
                transactionId: qrData.transactionId,
                email: user.email,
                createdAt: Date.now()
            };
            localStorage.setItem('pending_deposit', JSON.stringify(pendingDeposit));
        }

        const checkPending = () => {
            try {
                const raw = localStorage.getItem('pending_deposit');
                if (!raw) return null;
                const data = JSON.parse(raw);

                if (Date.now() - data.createdAt > 10 * 60 * 1000) {
                    localStorage.removeItem('pending_deposit');
                    return null;
                }
                return data;
            } catch { return null; }
        };

        const pending = checkPending();
        if (pending) {
            const doCheck = async () => {
                const deposit = checkPending();
                if (!deposit) {
                    clearInterval(interval);
                    return;
                }

                try {
                    const res = await fetch("/api/wallet/check", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            transactionId: deposit.transactionId,
                            userId: deposit.email
                        })
                    });
                    const data = await res.json();

                    if (data.success && data.status === "COMPLETO") {
                        clearInterval(interval);
                        localStorage.removeItem('pending_deposit');
                        setSuccess(true);
                        window.dispatchEvent(new Event("balance_update"));

                        setTimeout(() => {
                            setStep(1);
                            setSuccess(false);
                            setAmount("");
                            setCpf("");
                            setQrData(null);
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            };

            doCheck();

            interval = setInterval(doCheck, 60000);
        }

        return () => clearInterval(interval);
    }, [step, qrData, user.email]);

    const isValidCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/[^\d]+/g, '');
        if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++)
            sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);

        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++)
            sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);

        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

        return true;
    };

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpf(formatCPF(e.target.value));
        setError("");
    };

    const handleGenerate = async () => {
        if (!amount) {
            setError("Por favor, digite um valor para recarga.");
            return;
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount < 5) {
            setError("O valor mínimo é R$ 5,00");
            return;
        }

        if (!termsAccepted) {
            setError("Você precisa aceitar os Termos de Depósito.");
            return;
        }

        if (numericAmount > 200) {
            setError("O valor máximo para recarga é R$ 200,00");
            return;
        }

        if (!isValidCPF(cpf)) {
            setError("CPF inválido. Verifique os números.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/wallet/deposit", {
                method: "POST",
                headers: { "Content-Type": 'application/json' },
                body: JSON.stringify({
                    amount: numericAmount,
                    payerName: user.name,
                    payerDocument: cpf.replace(/\D/g, ''),
                    userId: user.email
                })
            });
            const data = await res.json();
            if (data.success) {
                setQrData(data.data);
                setStep(2);
            } else {
                setError("Erro ao gerar Pix: " + data.message);
            }
        } catch (e) {
            setError("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!qrData?.copyPaste) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(qrData.copyPaste);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = qrData.copyPaste;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    setError("Erro ao copiar. Copie manualmente.");
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            setError("Erro ao acessar área de transferência.");
        }
    };

    return (
        <div className="max-w-lg mx-auto pb-20 md:pb-0">
            {}
            {error && (
                <div className="fixed top-20 md:top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="text-red-400 shrink-0" size={20} />
                        <span className="text-red-400 text-sm font-medium">{error}</span>
                    </div>
                </div>
            )}

            {}
            {success && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-neutral-900 border border-green-500/30 p-8 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <Check size={40} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Pagamento Aprovado!</h2>
                        <p className="text-neutral-400">Seu saldo foi atualizado.</p>
                    </div>
                </div>
            )}

            {}
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Recargas</h2>
                <p className="text-neutral-400 text-sm mt-1">Adicione saldo via PIX</p>
            </div>

            {step === 1 && (
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 md:p-6">
                    <label className="block text-base md:text-lg font-medium text-white mb-4">
                        Quanto você quer recarregar?
                    </label>

                    {}
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
                        {[5, 10, 20, 50, 100, 200].map(val => (
                            <button
                                key={val}
                                onClick={() => setAmount(val.toString())}
                                className={`py-3 rounded-xl border text-sm md:text-base font-medium transition-all ${amount === val.toString()
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-neutral-800/50 border-neutral-700 hover:border-purple-500/50 text-white'
                                    }`}
                            >
                                R$ {val}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 mb-6">
                        {}
                        <div>
                            <label className="text-sm text-neutral-400 mb-2 block">Valor Personalizado</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">R$</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-12 pr-4 py-4 text-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white"
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Mínimo R$ 5,00 • Máximo R$ 200,00</p>
                        </div>

                        {}
                        <div>
                            <label className="text-sm text-neutral-400 mb-2 block">CPF do Pagador</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                    <CreditCard size={18} />
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className={`w-full bg-neutral-950 border rounded-xl pl-12 pr-4 py-4 text-base outline-none focus:ring-2 transition-all text-white ${error && error.includes("CPF")
                                        ? 'border-red-500/50 focus:ring-red-500/20'
                                        : 'border-neutral-700 focus:ring-purple-500/50 focus:border-purple-500'
                                        }`}
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Necessário para emissão do QR Code</p>
                        </div>
                    </div>

                    {}
                    <div className="mb-5 p-4 bg-neutral-950 border border-neutral-700 rounded-xl">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-neutral-600 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all flex items-center justify-center">
                                    {termsAccepted && <Check size={14} className="text-white" />}
                                </div>
                            </div>
                            <span className="text-sm text-neutral-300 leading-relaxed">
                                Li e aceito os{" "}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowTermsModal(true);
                                    }}
                                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium transition-colors"
                                >
                                    Termos de Depósito
                                </button>
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !termsAccepted}
                        className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${termsAccepted
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <QrCode size={20} />
                                Gerar PIX
                            </>
                        )}
                    </button>
                </div>
            )}

            {step === 2 && qrData && (
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 md:p-6 text-center">
                    {}
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Pagamento Gerado!</h3>
                    <p className="text-neutral-400 text-sm mb-6">Escaneie o QR Code ou copie o código abaixo</p>

                    {}
                    <div className="bg-white p-3 rounded-2xl w-48 h-48 md:w-56 md:h-56 mx-auto mb-6 flex items-center justify-center">
                        <img
                            src={qrData.qrCodeBase64 || qrData.qrcodeUrl}
                            alt="QR Code Pix"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {}
                    <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-4 mb-4">
                        <p className="text-xs text-neutral-500 mb-2 text-left">Pix Copia e Cola</p>
                        <div className="flex items-center gap-3">
                            <p className="flex-1 text-sm truncate font-mono text-neutral-300 text-left">{qrData.copyPaste}</p>
                            <button
                                onClick={copyToClipboard}
                                className={`p-3 rounded-xl transition-all shrink-0 ${copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                                    }`}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm mb-6">
                        <Loader2 className="animate-spin" size={16} />
                        Aguardando pagamento...
                    </div>

                    <button
                        onClick={() => setStep(1)}
                        className="text-neutral-500 hover:text-white transition-colors text-sm"
                    >
                        ← Voltar e gerar outro
                    </button>
                </div>
            )}

            {}
            {showTermsModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setShowTermsModal(false)}>
                    <div
                        className="bg-neutral-900 border border-neutral-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] sm:max-h-[85vh] overflow-y-auto sm:mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 rounded-t-2xl z-10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <FileText size={18} className="text-purple-400" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-white">Termos de Depósito</h3>
                            </div>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {}
                        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                            {}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert size={22} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-400 font-bold text-sm mb-1">⚠️ ATENÇÃO IMPORTANTE</h4>
                                        <p className="text-red-300/80 text-sm leading-relaxed">
                                            Leia atentamente todos os termos abaixo antes de realizar qualquer depósito.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="space-y-4">
                                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                                    <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">1</span>
                                        Entrega Imediata
                                    </h5>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Todos os nossos produtos são entregues de forma <strong className="text-white">imediata e automática</strong>. Ao realizar a compra, o produto é entregue instantaneamente.
                                    </p>
                                </div>

                                <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                                    <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 text-xs font-bold">2</span>
                                        Proibido Abrir MED/Disputa
                                    </h5>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Caso o usuário abra uma <strong className="text-red-400">MED (Mediação)</strong> ou <strong className="text-red-400">disputa</strong> no gateway de pagamento, sua conta será <strong className="text-red-400">suspensa permanentemente</strong> sem direito a recurso.
                                    </p>
                                </div>

                                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                                    <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">3</span>
                                        Sem Reembolso Após Entrega
                                    </h5>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Não realizamos reembolso de valores após a <strong className="text-white">entrega do produto</strong>. Certifique-se de que deseja o produto antes de comprar.
                                    </p>
                                </div>

                                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                                    <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">4</span>
                                        Depósito Mínimo
                                    </h5>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        O valor mínimo para depósito é de <strong className="text-green-400">R$ 5,00</strong> e o máximo é de <strong className="text-white">R$ 200,00</strong>.
                                    </p>
                                </div>

                                <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
                                    <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">5</span>
                                        Concordância
                                    </h5>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Ao realizar um depósito, você declara que <strong className="text-white">leu, entendeu e concorda</strong> com todos os termos descritos acima.
                                    </p>
                                </div>
                            </div>

                            {}
                            <button
                                onClick={() => {
                                    setTermsAccepted(true);
                                    setShowTermsModal(false);
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <Check size={20} />
                                Li e Aceito os Termos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
