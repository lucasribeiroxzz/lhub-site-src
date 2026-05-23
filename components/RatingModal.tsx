'use client';

import { useState } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    productName: string;
    onSubmit: (rating: number, feedback: string) => Promise<void>;
}

export default function RatingModal({ isOpen, onClose, transactionId, productName, onSubmit }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        
        setLoading(true);
        try {
            await onSubmit(rating, feedback);
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setRating(0);
                setFeedback('');
            }, 2000);
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRatingText = (r: number) => {
        switch (r) {
            case 1: return 'Muito Ruim 😞';
            case 2: return 'Ruim 😕';
            case 3: return 'Regular 😐';
            case 4: return 'Bom 😊';
            case 5: return 'Excelente! 🤩';
            default: return 'Selecione uma nota';
        }
    };

    const getRatingColor = (r: number) => {
        switch (r) {
            case 1: return 'text-red-400';
            case 2: return 'text-orange-400';
            case 3: return 'text-yellow-400';
            case 4: return 'text-lime-400';
            case 5: return 'text-green-400';
            default: return 'text-neutral-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {}
            <div className="relative w-full max-w-md bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                {}
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                    </button>
                    
                    <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">⭐</div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Avalie sua compra!</h2>
                    <p className="text-white/80 text-xs sm:text-sm mt-1 px-4 truncate">{productName}</p>
                </div>

                {}
                <div className="p-4 sm:p-6">
                    {submitted ? (
                        <div className="text-center py-6 sm:py-8">
                            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Obrigado!</h3>
                            <p className="text-neutral-400 text-sm">Sua avaliação foi enviada com sucesso!</p>
                        </div>
                    ) : (
                        <>
                            {}
                            <div className="text-center mb-4 sm:mb-6">
                                <p className="text-neutral-400 text-xs sm:text-sm mb-2 sm:mb-3">Como foi sua experiência?</p>
                                <div className="flex justify-center gap-1 sm:gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-0.5 sm:p-1 transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                size={28}
                                                className={`sm:w-9 sm:h-9 transition-colors ${
                                                    star <= (hoverRating || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-neutral-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className={`mt-2 sm:mt-3 font-medium text-sm sm:text-base ${getRatingColor(hoverRating || rating)}`}>
                                    {getRatingText(hoverRating || rating)}
                                </p>
                            </div>

                            {}
                            <div className="mb-4 sm:mb-6">
                                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">
                                    Deixe um comentário <span className="text-neutral-500">(opcional)</span>
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Conte-nos sobre sua experiência..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-neutral-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                />
                                <p className="text-[10px] sm:text-xs text-neutral-500 mt-1 text-right">
                                    {feedback.length}/500
                                </p>
                            </div>

                            {}
                            <button
                                onClick={handleSubmit}
                                disabled={rating === 0 || loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-neutral-700 disabled:to-neutral-700 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        Enviar Avaliação
                                    </>
                                )}
                            </button>

                            {}
                            <button
                                onClick={onClose}
                                className="w-full mt-2 sm:mt-3 text-neutral-500 hover:text-neutral-400 text-xs sm:text-sm transition-colors py-1"
                            >
                                Pular por agora
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
