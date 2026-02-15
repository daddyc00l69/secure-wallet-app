import { useState, useEffect } from 'react';
import axios from 'axios';
import { CardGrid } from './CardGrid';
import { AddCardForm } from './AddCardForm';
import { PinModal } from './PinModal';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ICard, IBankAccount, IAddress } from '../types';
import { BankAccountCard } from './BankAccountCard';
import { AddressCard } from './AddressCard';
import { AddBankAccountForm } from './AddBankAccountForm';
import { AddAddressForm } from './AddAddressForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';

const CARDS_URL = `${API_URL}/cards`;

export function Dashboard() {
    const [cards, setCards] = useState<ICard[]>([]);
    const [bankAccounts, setBankAccounts] = useState<IBankAccount[]>([]);
    const [addresses, setAddresses] = useState<IAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
    const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);

    // Filter State
    const [activeTab, setActiveTab] = useState<'cards' | 'identity' | 'bank' | 'address'>('cards');

    // CVV and Number View Logic
    const [selectedCardForPin, setSelectedCardForPin] = useState<ICard | null>(null);
    const [revealedCvvCardId, setRevealedCvvCardId] = useState<string | null>(null);
    const [revealedNumberCardId, setRevealedNumberCardId] = useState<string | null>(null);
    const [revealedCards, setRevealedCards] = useState<Record<string, { number?: string; cvv?: string }>>({});
    const [pinRequestType, setPinRequestType] = useState<'cvv' | 'number'>('cvv');

    const { user, setEditToken, editToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Verification Logic for One-Time Access
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            axios.post(`${API_URL}/access/verify`, { token })
                .then(res => {
                    if (res.data.valid) {
                        setEditToken(token);
                        // Clean URL without reload
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                })
                .catch(() => {
                    console.error('Invalid access token');
                });
        }
    }, [searchParams, setEditToken]);

    const canEdit = ['admin', 'manager'].includes(user?.role || '') || !!editToken;

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [cardsRes, banksRes, addrRes] = await Promise.all([
                axios.get(CARDS_URL),
                axios.get(`${API_URL}/bank-accounts`),
                axios.get(`${API_URL}/addresses`)
            ]);

            setCards(cardsRes.data);
            setBankAccounts(banksRes.data);
            setAddresses(addrRes.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Could not connect to wallet server. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const filteredCards = cards.filter(card => {
        if (activeTab === 'identity') {
            return card.category === 'identity';
        }
        return !card.category || card.category !== 'identity';
    });

    const handleAddCard = async (newCardData: Omit<ICard, '_id'>) => {
        try {
            const response = await axios.post(CARDS_URL, newCardData);
            setCards([...cards, response.data]);
            setIsAddModalOpen(false);
        } catch (err) {
            console.error('Failed to add card:', err);
            alert('Failed to add card. Please try again.');
        }
    };

    const handleAddBank = async (newBankData: Omit<IBankAccount, '_id'>) => {
        try {
            const response = await axios.post(`${API_URL}/bank-accounts`, newBankData);
            setBankAccounts([...bankAccounts, response.data]);
            setIsAddBankModalOpen(false);
        } catch (err) {
            console.error('Failed to add bank account:', err);
            alert('Failed to add bank account.');
        }
    };

    const handleAddAddress = async (newAddressData: Omit<IAddress, '_id'>) => {
        try {
            const response = await axios.post(`${API_URL}/addresses`, newAddressData);
            setAddresses([...addresses, response.data]);
            setIsAddAddressModalOpen(false);
        } catch (err) {
            console.error('Failed to add address:', err);
            alert('Failed to add address.');
        }
    };

    const openAddModal = () => {
        if (!canEdit) {
            alert("Restricted Action: Please request 'Edit Access' from support via Ticket.");
            return;
        }

        if (activeTab === 'bank') {
            setIsAddBankModalOpen(true);
        } else if (activeTab === 'address') {
            setIsAddAddressModalOpen(true);
        } else {
            setIsAddModalOpen(true);
        }
    };

    const handleViewCvv = (card: ICard) => {
        if (revealedCvvCardId === card._id) {
            setRevealedCvvCardId(null);
            return;
        }
        setSelectedCardForPin(card);
        setPinRequestType('cvv');
        setPinModalOpen(true);
    };

    const handleViewNumber = (card: ICard) => {
        if (revealedNumberCardId === card._id) {
            setRevealedNumberCardId(null);
            return;
        }
        setSelectedCardForPin(card);
        setPinRequestType('number');
        setPinModalOpen(true);
    };

    const verifyPinAndReveal = async (pin: string) => {
        if (!selectedCardForPin || !selectedCardForPin._id) return;
        const cardId = selectedCardForPin._id;

        try {
            // Use standard token retrieval
            const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

            const res = await axios.post(`${API_URL}/cards/${cardId}/reveal`, { pin }, { headers });
            const { number, cvv } = res.data;

            setRevealedCards(prev => ({ ...prev, [cardId]: { number, cvv } }));

            // Update visibility state
            if (pinRequestType === 'cvv') {
                setRevealedCvvCardId(cardId);
                setTimeout(() => setRevealedCvvCardId(null), 10000);
            } else {
                setRevealedNumberCardId(cardId);
                setTimeout(() => setRevealedNumberCardId(null), 10000);
            }

            // Clear sensitive data after 10s
            setTimeout(() => {
                setRevealedCards(prev => {
                    const next = { ...prev };
                    delete next[cardId];
                    return next;
                });
            }, 10000);

            setPinModalOpen(false);
            setSelectedCardForPin(null);
        } catch (err) {
            console.error(err);
            throw err; // Propagate to PinModal
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans text-gray-900 relative overflow-x-hidden">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mb-12 flex justify-between items-center px-4 sm:px-8"
            >
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Digital Vault</h1>
                    <p className="text-gray-500 mt-1">
                        Welcome, {user?.username || 'User'}
                    </p>
                    {editToken && (
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
                            Wait-Listed Edit Access Active
                        </span>
                    )}
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 p-2 pr-4 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        title="Profile"
                    >
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm hidden sm:block">{user?.username}</span>
                    </button>
                    {canEdit ? (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add New</span>
                        </button>
                    ) : (
                        <div className="group relative">
                            <button
                                disabled
                                className="flex items-center gap-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-2xl font-semibold cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add New</span>
                            </button>
                            <div className="absolute top-full mt-2 w-48 p-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                Request Edit Access via Support to add new items.
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="w-full max-w-7xl px-4 sm:px-8 mb-6 overflow-x-auto pb-4 no-scrollbar">
                <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl min-w-max">
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'cards'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Payment Cards
                    </button>
                    <button
                        onClick={() => setActiveTab('identity')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'identity'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Identity & Docs
                    </button>
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'bank'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Bank Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('address')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'address'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Addresses
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
                    <div className="bg-red-50 p-4 rounded-2xl mb-4">
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                    <button
                        onClick={fetchAllData}
                        className="text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="w-full">
                    {(activeTab === 'cards' || activeTab === 'identity') ? (
                        filteredCards.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg mb-4">
                                    {activeTab === 'identity'
                                        ? "No identity documents found."
                                        : "No payment cards in your wallet yet."}
                                </p>
                                <button
                                    onClick={openAddModal}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Add your first {activeTab === 'identity' ? 'document' : 'card'}
                                </button>
                            </div>
                        ) : (
                            <CardGrid
                                cards={filteredCards}
                                revealedCardId={revealedCvvCardId}
                                revealedNumberCardId={revealedNumberCardId}
                                revealedCardsMap={revealedCards}
                                onViewCvv={handleViewCvv}
                                onViewNumber={handleViewNumber}
                            />
                        )
                    ) : activeTab === 'bank' ? (
                        bankAccounts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg mb-4">No bank accounts added yet.</p>
                                <button onClick={openAddModal} className="text-blue-600 font-semibold hover:underline">Add a Bank Account</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
                                {bankAccounts.map(account => (
                                    <div key={account._id} className="relative group">
                                        <BankAccountCard account={account} />
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this account?')) {
                                                    await axios.delete(`${API_URL}/bank-accounts/${account._id}`);
                                                    setBankAccounts(bankAccounts.filter(a => a._id !== account._id));
                                                }
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="sr-only">Delete</span>
                                            {/* Using text for now or could import Trash Icon */}
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        addresses.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg mb-4">No addresses saved yet.</p>
                                <button onClick={openAddModal} className="text-blue-600 font-semibold hover:underline">Add an Address</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
                                {addresses.map(address => (
                                    <div key={address._id} className="relative group">
                                        <AddressCard address={address} />
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this address?')) {
                                                    await axios.delete(`${API_URL}/addresses/${address._id}`);
                                                    setAddresses(addresses.filter(a => a._id !== address._id));
                                                }
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 backdrop-blur-md rounded-full text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            <AddCardForm
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddCard}
                defaultCategory={activeTab === 'identity' ? 'identity' : 'credit'}
            />

            <AddBankAccountForm
                isOpen={isAddBankModalOpen}
                onClose={() => setIsAddBankModalOpen(false)}
                onSubmit={handleAddBank}
            />

            <AddAddressForm
                isOpen={isAddAddressModalOpen}
                onClose={() => setIsAddAddressModalOpen(false)}
                onSubmit={handleAddAddress}
            />

            <PinModal
                isOpen={pinModalOpen}
                onClose={() => {
                    setPinModalOpen(false);
                    setSelectedCardForPin(null);
                }}
                onSubmit={verifyPinAndReveal}
            />
        </div >
    );
}
