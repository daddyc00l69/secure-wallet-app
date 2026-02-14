import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ShieldCheck, Wifi, Eye, Copy, Check } from 'lucide-react';
import type { ICard } from '../types';

interface CardProps {
    card: ICard;
    onFlip?: () => void;
    showCvv?: boolean;
    showNumber?: boolean;
    revealedNumber?: string;
    revealedCvv?: string;
    onViewCvv?: () => void;
    onViewNumber?: () => void;
}

const formatNumber = (num: string) => {
    // If it looks like a credit card (16 digits), format as 4-4-4-4
    if (/^\d{16}$/.test(num)) {
        return num.replace(/(\d{4})/g, '$1 ').trim();
    }
    // If Aadhaar (12 digits), format as 4-4-4
    if (/^\d{12}$/.test(num)) {
        return num.replace(/(\d{4})/g, '$1 ').trim();
    }
    // Otherwise return as is (PAN, DL, etc.)
    return num;
};

// Mask helper
const maskNumber = (num: string) => {
    if (/^\d{16}$/.test(num)) {
        return `**** **** **** ${num.slice(-4)}`;
    }
    if (/^\d{12}$/.test(num)) {
        return `**** **** ${num.slice(-4)}`;
    }
    // Default mask just last 4 visible
    return `**** **** ${num.slice(-4)}`;
};

export const Card: React.FC<CardProps> = ({ card, onFlip, showCvv = false, showNumber = false, revealedNumber, revealedCvv, onViewCvv, onViewNumber }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        onFlip?.();
    };

    // Prevent flipping when clicking specifics if needed, but for now card click flips.

    return (
        <div
            className="perspective-1000 w-96 h-56 cursor-pointer group select-none"
            onClick={handleFlip}
        >
            <motion.div
                className="relative w-full h-full transform-style-3d transition-all duration-300" // Faster flip
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }} // Faster spring
            >
                {/* Front */}
                <div className={clsx(
                    "card-front absolute w-full h-full backface-hidden rounded-2xl p-6 shadow-2xl text-white flex flex-col justify-between overflow-hidden border border-white/20",
                    !card.image && card.theme,
                    card.category === 'identity' && "bg-gradient-to-r from-orange-100 to-orange-50 text-black border-orange-200" // Simple default if no theme
                )}>
                    {card.image && (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={`/assets/cards/${card.image}`}
                                alt="Card Background"
                                className="w-full h-full object-cover"
                            />
                            {/* Less dimming for identity to keep it clean, or specific overlay */}
                            {card.category !== 'identity' && <div className="absolute inset-0 bg-black/20" />}
                        </div>
                    )}

                    {!card.image && card.category !== 'identity' && (
                        <>
                            {/* Design Elements */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] z-0" />
                            <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/20 rounded-full blur-3xl opacity-60" />
                            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-black/20 rounded-full blur-3xl opacity-60" />
                        </>
                    )}

                    {/* Bank Name (If no image or if we want to overlay it?) Let's overlay it subtly if image exists too, or just if no image? */}
                    {/* User didn't specify, but bank name is usually prominent. Let's add it top left if no image, or top center? */}
                    {/* Existing Top Row has Shield and Wifi. Let's put Bank Name top right or next to Shield? */}
                    {/* Actually, let's put it top left, push shield/wifi to right? */}
                    {/* Let's stick to the current layout but maybe add Bank Name above the chip or top right. */}

                    {/* Bank Name - Only for non-identity cards */}
                    {card.bank && !card.image && card.category !== 'identity' && (
                        <div className="absolute top-6 right-6 z-10">
                            <p className="font-bold text-lg tracking-wider opacity-90 text-right">{card.bank.toUpperCase()}</p>
                        </div>
                    )}

                    {/* Top Row */}
                    {/* Top Row */}
                    {card.category !== 'identity' && (
                        <div className={clsx("relative z-10 flex justify-between items-start", card.image && "invisible")}>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-8 h-8 opacity-90" />
                            </div>
                            <Wifi className="rotate-90 w-8 h-8 opacity-80" />
                        </div>
                    )}

                    {/* Identity Header */}
                    {!card.image && card.category === 'identity' && (
                        <div className="relative z-10 flex justify-center items-center mt-4">
                            <div className="flex flex-col items-center text-black">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="h-10 w-auto mb-2" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">
                                    {card.type === 'passport' ? 'Republic of India' : 'Government of India'}
                                </span>
                                {card.type === 'aadhaar' && <span className="text-[8px] font-semibold text-gray-600">UIDAI</span>}
                            </div>
                        </div>
                    )}

                    {/* Chip */}
                    {/* Chip */}
                    {card.category !== 'identity' && (
                        <div className={clsx("relative z-10 w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg shadow-md border border-yellow-600/30 flex items-center justify-center overflow-hidden mt-2", card.image && "invisible")}>
                            <div className="w-full h-[1px] bg-yellow-700/40 absolute top-1/2" />
                            <div className="h-full w-[1px] bg-yellow-700/40 absolute left-1/2" />
                            <div className="w-8 h-6 border border-yellow-700/40 rounded" />
                        </div>
                    )}


                    {/* Number */}
                    <div className="relative z-10 mt-6 flex items-center group/number max-w-full justify-center">
                        <p className={clsx(
                            "font-mono tracking-wider drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300",
                            "text-lg",
                            !showNumber && "opacity-60 tracking-widest",
                            card.category === 'identity' ? "text-black font-bold" : "text-white"
                        )} style={{ fontFamily: 'monospace' }}>
                            {showNumber ? formatNumber(revealedNumber || card.number) : maskNumber(card.number)}
                        </p>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {!showNumber && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewNumber?.();
                                    }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-all backdrop-blur-sm"
                                    title="View Number"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {showNumber && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(card.number);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-all backdrop-blur-sm"
                                    title="Copy Number"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expiry Date - Moved below number */}
                    <div className="relative z-10 mt-4 flex justify-center w-full pr-12">
                        <div className={clsx("flex items-center gap-2 transition-opacity duration-300", !showNumber && "invisible")}>
                            <p className="text-[7px] uppercase opacity-80 leading-none w-6 text-right">Valid<br />Thru</p>
                            <p className="font-mono text-sm tracking-widest">{card.expiry}</p>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="relative z-10 flex items-end mt-2 gap-8">
                        <div className={clsx("flex-shrink-0 transition-opacity duration-300", !showNumber && "opacity-40")}>
                            <p className="text-[10px] uppercase opacity-80 mb-0.5">
                                {card.category === 'identity' ? 'Name' : 'Card Holder'}
                            </p>
                            <p className="font-bold tracking-wide uppercase text-sm">{card.holder}</p>
                        </div>

                        <div className="absolute bottom-1 right-0 flex flex-col items-end">
                            <span className="font-bold text-2xl italic opacity-90">
                                {card.category === 'identity' ? card.type.replace('_', ' ').toUpperCase() : card.type.toUpperCase()}
                            </span>
                            {card.category && <span className="text-[8px] uppercase tracking-widest opacity-80 mt-1">{card.category}</span>}
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div className={clsx(
                    "absolute w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden bg-gray-900 text-white rotate-y-180 flex flex-col justify-between py-6 border border-gray-700",
                )}>
                    <div className="w-full h-12 bg-black mt-2" />
                    <div className="px-8 relative">
                        {card.category !== 'identity' && (
                            <>
                                <div className="flex justify-end items-center">
                                    <div className="w-full h-10 bg-white/90 rounded flex items-center justify-between px-3">
                                        <p className="text-black font-mono font-bold tracking-widest text-lg">
                                            {showCvv ? (revealedCvv || card.cvv) : '***'}
                                        </p>
                                        {!showCvv && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewCvv?.();
                                                }}
                                                className="text-gray-600 hover:text-black transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 text-right mr-1">CVV</p>
                            </>
                        )}
                        {card.category === 'identity' && (
                            <div className="flex justify-center items-center h-16">
                                <p className="text-xs text-gray-500 italic">Government Issued ID</p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 flex justify-between items-end mb-2">
                        <p className="text-[10px] text-gray-500 w-3/4 leading-tight">
                            This card is property of the issuer and must be returned upon request. Authorized signature.
                        </p>
                        <span className="font-bold text-xl italic text-gray-600">{card.type.toUpperCase()}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
