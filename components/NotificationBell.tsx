'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';

interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'PROMO';
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        

        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const json = await res.json();
            if (json.success) {
                setNotifications(json.notifications || []);
                setUnreadCount(json.unreadCount || 0);
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead', notificationId })
            });
            fetchNotifications();
        } catch (e) {
            console.error('Error marking notification as read:', e);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllRead' })
            });
            fetchNotifications();
        } catch (e) {
            console.error('Error marking all notifications as read:', e);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return '✅';
            case 'WARNING': return '⚠️';
            case 'PROMO': return '🎉';
            default: return 'ℹ️';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'border-green-500/30 bg-green-500/10';
            case 'WARNING': return 'border-yellow-500/30 bg-yellow-500/10';
            case 'PROMO': return 'border-purple-500/30 bg-purple-500/10';
            default: return 'border-blue-500/30 bg-blue-500/10';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}min`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell size={22} className="text-neutral-400 hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {}
            {isOpen && (
                <>
                    {}
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {}
                    <div className="fixed md:absolute inset-x-4 md:inset-x-auto top-20 md:top-auto md:right-0 md:mt-2 w-auto md:w-96 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn max-h-[80vh] md:max-h-[500px]">
                        {}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 sticky top-0">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Bell size={18} className="text-purple-400" />
                                Notificações
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={loading}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                    >
                                        <CheckCheck size={14} />
                                        <span className="hidden sm:inline">Marcar todas</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-neutral-400" />
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="overflow-y-auto max-h-[60vh] md:max-h-96">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                                            !notification.read ? 'bg-purple-500/5' : ''
                                        }`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${getTypeColor(notification.type)}`}>
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-neutral-300'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-xs text-neutral-500 whitespace-nowrap shrink-0">
                                                        {formatDate(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                        Nova
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {}
                        {notifications.length > 10 && (
                            <div className="p-3 border-t border-white/10 text-center bg-neutral-900 sticky bottom-0">
                                <p className="text-xs text-neutral-500">
                                    Mostrando 10 de {notifications.length} notificações
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
