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
}

export const CardGrid: React.FC<CardGridProps> = ({ cards, revealedCardId, revealedNumberCardId, revealedCardsMap = {}, onViewCvv, onViewNumber }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 justify-items-center w-full max-w-7xl mx-auto">
            {cards.map((card, index) => (
                <motion.div
                    key={card._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full flex justify-center"
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
                </motion.div>
            ))}
        </div>
    );
};
