"use client";

import { useState, useEffect } from "react";
import { User, Mail, Save, Loader2, Check, AlertCircle, Unlink, Lock, Eye, EyeOff } from "lucide-react";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

export default function PerfilPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const [profile, setProfile] = useState({
        email: '',
        name: '',
        discordId: '',
        discordUsername: '',
        discordAvatar: '',
        createdAt: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();

            if (data.success) {
                setProfile(data.data);
                setFormData({
                    name: data.data.name,
                    email: data.data.email
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
                setProfile(prev => ({ ...prev, ...formData }));

                const session = localStorage.getItem('user_session');
                if (session) {
                    const parsed = JSON.parse(session);
                    parsed.name = formData.name;
                    parsed.email = formData.email;
                    localStorage.setItem('user_session', JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage'));
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao atualizar perfil' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setSaving(false);
        }
    };

    const handleConnectDiscord = () => {

        window.location.href = '/api/auth/discord/link';
    };

    const handleUnlinkDiscord = async () => {
        if (!confirm('Tem certeza que deseja desvincular sua conta do Discord?')) return;

        setUnlinking(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/profile', { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Discord desvinculado com sucesso!' });
                setProfile(prev => ({
                    ...prev,
                    discordId: '',
                    discordUsername: '',
                    discordAvatar: ''
                }));
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao desvincular Discord' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setUnlinking(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }

        setChangingPassword(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao alterar senha' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Meu Perfil</h1>
                <p className="text-neutral-400">Gerencie suas informações pessoais e conexões</p>
            </div>

            {}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {}
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-purple-400" />
                    Informações Pessoais
                </h2>

                <form onSubmit={handleSave} className="space-y-5">
                    {}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Nome de usuário
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="Seu nome"
                            />
                        </div>
                    </div>

                    {}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    {}
                    <div className="pt-2">
                        <p className="text-sm text-neutral-500">
                            Membro desde: {new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    {}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </form>
            </div>

            {}
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Lock size={20} className="text-purple-400" />
                    Alterar Senha
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-5">
                    {}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Senha atual
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="Sua senha atual"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Nova senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                            >
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Confirmar nova senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                placeholder="Repita a nova senha"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                            >
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {}
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                    >
                        {changingPassword ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Alterando...
                            </>
                        ) : (
                            <>
                                <Lock size={20} />
                                Alterar Senha
                            </>
                        )}
                    </button>
                </form>
            </div>

            {}
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
                    Conexão Discord
                </h2>

                {profile.discordId ? (
                    <div className="space-y-4">
                        {}
                        <div className="flex items-center gap-4 p-4 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl">
                            {profile.discordAvatar ? (
                                <img
                                    src={`https://cdn.discordapp.com/avatars/${profile.discordId}/${profile.discordAvatar}.png`}
                                    alt="Discord Avatar"
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-[#5865F2] flex items-center justify-center">
                                    <DiscordIcon className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-white font-semibold">{profile.discordUsername}</p>
                                <p className="text-neutral-400 text-sm">Conta vinculada</p>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>

                        {}
                        <button
                            onClick={handleUnlinkDiscord}
                            disabled={unlinking}
                            className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {unlinking ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Desvinculando...
                                </>
                            ) : (
                                <>
                                    <Unlink size={18} />
                                    Desvincular Discord
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-neutral-400 text-sm">
                            Conecte sua conta do Discord para fazer login mais rápido e receber notificações.
                        </p>

                        <button
                            onClick={handleConnectDiscord}
                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/25"
                        >
                            <DiscordIcon className="w-5 h-5" />
                            Conectar Discord
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
