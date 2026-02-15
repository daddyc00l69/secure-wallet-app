import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Delete } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { motion } from 'framer-motion';

export const LockScreen: React.FC = () => {
    const { unlockApp, user, logout } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPin, setShowForgotPin] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleForgotPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setPasswordError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/reset-pin-with-password`, { password }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || 'Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        const verifyPin = async () => {
            if (pin.length === 4) {
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    await axios.post(`${API_URL}/auth/verify-pin`, { pin }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    unlockApp();
                } catch (err) {
                    setError(true);
                    setPin('');
                } finally {
                    setLoading(false);
                }
            }
        };

        verifyPin();
    }, [pin, unlockApp]);

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs flex flex-col items-center"
            >
                <div className="bg-gray-800 p-4 rounded-full mb-6 relative">
                    <Lock className="w-8 h-8 text-blue-400" />
                    {error && (
                        <motion.div
                            initial={{ x: -5 }} animate={{ x: [-5, 5, -5, 5, 0] }}
                            className="absolute -right-2 top-0"
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
                        </motion.div>
                    )}
                </div>

                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-400 mb-8">{user?.username}</p>

                {/* PIN Display */}
                <div className="flex gap-4 mb-10">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                                ? error ? 'bg-red-500' : 'bg-blue-400'
                                : 'bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Numpad */}
                {!showForgotPin ? (
                    <div className="grid grid-cols-3 gap-4 w-full px-8 max-w-[280px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={loading}
                                className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xl font-semibold transition-colors active:scale-95 mx-auto"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowForgotPin(true)} // Forgot button
                            className="w-14 h-14 flex items-center justify-center text-xs font-medium text-gray-500 hover:text-white transition-colors mx-auto"
                        >
                            Forgot?
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            disabled={loading}
                            className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xl font-semibold transition-colors active:scale-95 mx-auto"
                        >
                            0
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="w-14 h-14 rounded-full hover:bg-gray-800 flex items-center justify-center transition-colors active:scale-95 mx-auto" // Clear button
                        >
                            <Delete className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                ) : (
                    <div className="w-full px-4 animate-in fade-in slide-in-from-right-8 duration-300">
                        <h3 className="text-xl font-bold mb-2 text-center">Reset App Lock</h3>
                        <p className="text-gray-400 text-sm text-center mb-6">Enter your account password to remove the PIN.</p>

                        <form onSubmit={handleForgotPin}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Start typing..."
                                className="w-full bg-gray-800 border-none rounded-xl p-4 text-white placeholder-gray-500 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}

                            <button
                                type="submit"
                                disabled={!password || loading}
                                className="w-full py-3 bg-blue-600 rounded-xl font-bold mb-3 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Reset PIN'}
                            </button>
                            <button
                                type="button"
                                onClick={() => window.location.href = '/forgot-password'}
                                className="w-full py-2 text-blue-400 text-sm font-medium hover:underline mb-2"
                            >
                                Forgot Account Password?
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForgotPin(false)}
                                className="w-full py-3 text-gray-400 font-semibold"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                )}

                {error && (
                    <p className="text-red-400 mt-8 text-sm font-medium animate-pulse">
                        Incorrect PIN
                    </p>
                )}

                <button
                    onClick={logout}
                    className="mt-8 text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                >
                    Switch Account / Logout
                </button>
            </motion.div>
        </div>
    );
};
