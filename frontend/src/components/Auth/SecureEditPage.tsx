import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { Loader2, Save, X, User, CreditCard, Landmark, CheckCircle } from 'lucide-react';

type Tab = 'profile' | 'card' | 'bank';

export const SecureEditPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // Forms
    const [profileData, setProfileData] = useState({ username: '', email: '' });
    const [cardData, setCardData] = useState({
        number: '', holder: '', expiry: '', cvv: '', type: 'credit', theme: 'dark', category: 'credit'
    });
    const [bankData, setBankData] = useState({
        bankName: '', accountHolder: '', accountNumber: '', ifsc: '', branch: '', accountType: 'savings', theme: 'blue'
    });

    useEffect(() => {
        if (!token) {
            setError('No token provided');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await axios.post(`${API_URL}/access/verify`, { token });
                if (res.data.valid) {
                    // Token is valid. 
                    // To pre-fill profile data, we would need to fetch it. 
                    // If the verify endpoint returned userId, we might be able to fetch public info?
                    // For now, asking user to re-enter or just "Update" fields they want.
                    // Let's assume blank slate for security unless we add a specific "get-secure-data" endpoint.
                } else {
                    setError('Invalid or expired token');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to verify token');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            let data: any = {};
            if (activeTab === 'profile') data = profileData;
            else if (activeTab === 'card') data = cardData;
            else if (activeTab === 'bank') data = bankData;

            await axios.post(`${API_URL}/access/update-data`, {
                token,
                type: activeTab,
                data
            });

            setSuccess(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} updated successfully!`);

            // Clear sensitive forms
            if (activeTab === 'card') setCardData({ number: '', holder: '', expiry: '', cvv: '', type: 'credit', theme: 'dark', category: 'credit' });
            if (activeTab === 'bank') setBankData({ bankName: '', accountHolder: '', accountNumber: '', ifsc: '', branch: '', accountType: 'savings', theme: 'blue' });

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update data');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin" /></div>;

    if (error && !success) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl max-w-md text-center">
                <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                <p className="text-gray-300">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <h1 className="text-2xl font-bold text-white mb-2">Secure Information Update</h1>
                <p className="text-gray-400 mb-6 text-sm">Update your secure wallet information. This session is timed.</p>

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{success}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl">
                    {(['profile', 'card', 'bank'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSuccess(''); setError(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab === 'profile' && <User className="w-4 h-4" />}
                            {tab === 'card' && <CreditCard className="w-4 h-4" />}
                            {tab === 'bank' && <Landmark className="w-4 h-4" />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'profile' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    value={profileData.username}
                                    onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Enter email"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'card' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardData.number}
                                        onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                                        placeholder="0000 0000 0000 0000"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Holder</label>
                                    <input
                                        type="text"
                                        value={cardData.holder}
                                        onChange={e => setCardData({ ...cardData, holder: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Name on Card"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry</label>
                                    <input
                                        type="text"
                                        value={cardData.expiry}
                                        onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-center"
                                        placeholder="MM/YY"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                                    <input
                                        type="password"
                                        value={cardData.cvv}
                                        onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-center"
                                        placeholder="123"
                                        required
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'bank' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankData.bankName}
                                        onChange={e => setBankData({ ...bankData, bankName: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. Chase Bank"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Holder</label>
                                    <input
                                        type="text"
                                        value={bankData.accountHolder}
                                        onChange={e => setBankData({ ...bankData, accountHolder: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Full Legal Name"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankData.accountNumber}
                                        onChange={e => setBankData({ ...bankData, accountNumber: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                                        placeholder="Account Number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC / Routing</label>
                                    <input
                                        type="text"
                                        value={bankData.ifsc}
                                        onChange={e => setBankData({ ...bankData, ifsc: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 uppercase"
                                        placeholder="Code"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch</label>
                                    <input
                                        type="text"
                                        value={bankData.branch}
                                        onChange={e => setBankData({ ...bankData, branch: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Branch Name"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-300">
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
