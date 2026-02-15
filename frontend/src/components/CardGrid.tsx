import React from 'react';
import { Card } from './Card';
import type { ICard } from '../types';
import { motion } from 'framer-motion';

interface CardGridProps {
    cards: ICard[];
    revealedCardId?: string | null;
    revealedNumberCardId?: string | null;
    revealedCardsMap?: Record<string, { number?: string; cvv?: string }>;
    onViewCvv?: (card: ICard) => void;
    onViewNumber?: (card: ICard) => void;
    onDelete?: (id: string) => void;
    canEdit?: boolean;
}

import { Trash2 } from 'lucide-react';

export const CardGrid: React.FC<CardGridProps> = ({
    cards,
    revealedCardId,
    revealedNumberCardId,
    revealedCardsMap = {},
    onViewCvv,
    onViewNumber,
    onDelete,
    canEdit
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 justify-items-center w-full max-w-7xl mx-auto">
            {cards.map((card, index) => (
                <motion.div
                    key={card._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full flex justify-center relative group"
                >
                    <Card
                        card={card}
                        showCvv={revealedCardId === card._id}
                        showNumber={revealedNumberCardId === card._id}
                        revealedNumber={card._id ? revealedCardsMap?.[card._id]?.number : undefined}
                        revealedCvv={card._id ? revealedCardsMap?.[card._id]?.cvv : undefined}
                        onViewCvv={() => onViewCvv && onViewCvv(card)}
                        onViewNumber={() => onViewNumber && onViewNumber(card)}
                    />
                    {canEdit && onDelete && card._id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(card._id!);
                            }}
                            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-50 pointer-events-auto"
                            title="Delete Card"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
