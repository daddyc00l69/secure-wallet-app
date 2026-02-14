import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
// export const API_URL = 'http://localhost:5000/api'; // Temporary fix if config import fails or verified path

const PinInput = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => (
    <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={value}
            onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 4) onChange(val);
            }}
            className="w-full text-center text-3xl tracking-widest py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            placeholder="••••"
        />
    </div>
);

export const SecurityPage: React.FC = () => {
    const { user, refreshUser } = useAuth(); // Assuming refreshUser exists or I need to reload
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'initial' | 'verify_password' | 'set' | 'confirm'>('initial');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSetPin = async () => {
        if (pin.length !== 4) {
            setMessage({ type: 'error', text: 'PIN must be 4 digits' });
            return;
        }
        if (pin !== confirmPin) {
            setMessage({ type: 'error', text: 'PINs do not match' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/set-pin`, { pin }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'App Lock enabled successfully' });
            setStep('initial');
            setPin('');
            setConfirmPin('');
            // Refresh user to update hasPin status
            await refreshUser();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to set PIN' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
                {/* Header */}
                <div className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Security</h1>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-4 mb-8">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">App Lock</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Secure your wallet with a 4-digit PIN. This PIN will be required every time you open the app.
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    {user?.hasPin && step === 'initial' ? (
                        <div className="space-y-4">
                            <div className="p-4 border border-green-200 bg-green-50 rounded-xl flex items-center justify-between">
                                <span className="font-semibold text-green-900">App Lock is Active</span>
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <button
                                onClick={() => setStep('verify_password')}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                            >
                                Change PIN
                            </button>
                        </div>
                    ) : (
                        step === 'initial' && (
                            <button
                                onClick={() => setStep('verify_password')}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Setup App Lock
                            </button>
                        )
                    )}

                    {step === 'verify_password' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Verify Password</h2>
                            <p className="text-sm text-gray-500 mb-6">Please enter your account password to continue.</p>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />

                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const token = localStorage.getItem('token');
                                        await axios.post(`${API_URL}/auth/verify-password`, { password }, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        setStep('set');
                                        setPassword('');
                                    } catch (err) {
                                        setMessage({ type: 'error', text: 'Incorrect password' });
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={!password || loading}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Continue'}
                            </button>

                            <button
                                onClick={() => { setStep('initial'); setPassword(''); }}
                                className="w-full py-4 text-gray-500 font-semibold mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {step === 'set' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Create 4-Digit PIN</h2>
                            <PinInput value={pin} onChange={setPin} label="Enter New PIN" />

                            {pin.length === 4 && (
                                <button
                                    onClick={() => setStep('confirm')}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold mt-4 shadow-lg hover:bg-gray-800 transition-all"
                                >
                                    Continue
                                </button>
                            )}

                            <button
                                onClick={() => { setStep('initial'); setPin(''); }}
                                className="w-full py-4 text-gray-500 font-semibold mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Confirm PIN</h2>
                            <PinInput value={confirmPin} onChange={setConfirmPin} label="Re-enter PIN" />

                            <button
                                onClick={handleSetPin}
                                disabled={loading || confirmPin.length !== 4}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold mt-4 shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? 'Saving...' : 'Confirm & Enable'}
                            </button>

                            <button
                                onClick={() => { setStep('set'); setConfirmPin(''); }}
                                className="w-full py-4 text-gray-500 font-semibold mt-2"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
