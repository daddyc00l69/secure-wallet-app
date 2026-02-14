import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cardPin?: string; // For client-side mock validation if needed, or we implement API call
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, cardPin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple mock validation for now, or match cardPin props
        if (cardPin && pin === cardPin) {
            onSuccess();
            onClose();
            setPin('');
            setError(false);
        } else {
            setError(true);
            setPin('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Lock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-lg">Enter PIN</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value.replace(/\D/g, ''));
                                            setError(false);
                                        }}
                                        className={`w-full text-center text-3xl font-mono tracking-[1em] py-3 border-b-2 bg-transparent focus:outline-none transition-colors ${error
                                                ? 'border-red-500 text-red-600 placeholder-red-300'
                                                : 'border-gray-200 focus:border-blue-500 text-gray-900'
                                            }`}
                                        placeholder="••••"
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="text-red-500 text-sm text-center mt-2">
                                            Incorrect PIN. Please try again.
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={pin.length !== 4}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify Access
                                </button>
                            </form>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 text-center">
                            <p className="text-xs text-gray-500">
                                Enter your 4-digit security PIN to view CVV details.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
