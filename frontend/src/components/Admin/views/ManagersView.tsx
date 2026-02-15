import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
}

export const ManagersView: React.FC = () => {
    const [managers, setManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateManager, setShowCreateManager] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setManagers(res.data.filter((u: User) => u.role === 'manager'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteManager = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/admin/invite-manager`,
                { email: inviteEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCreateManager(false);
            setInviteEmail('');
            alert('Invitation sent successfully!');
            fetchManagers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send invitation');
        }
    };

    const handleRemoveManager = async (userId: string) => {
        if (!window.confirm('Are you sure you want to demote this manager?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/users/${userId}/role`,
                { role: 'user' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchManagers();
        } catch (err) {
            console.error(err);
        }
    };

    const maskEmail = (email: string) => {
        if (!email) return '';
        if (email === 'tushar0p.verify+1@gmail.com') return email;
        const [name, domain] = email.split('@');
        if (!name || !domain) return email;
        const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name + '***';
        return `${maskedName}@${domain}`;
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-400" />
                    Manager Team
                </h2>
                <button onClick={() => setShowCreateManager(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold transition-colors">
                    + Add Manager
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managers.map(manager => (
                    <div key={manager._id} className="bg-gray-900/50 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <div>
                            <p className="font-bold text-lg">{manager.username}</p>
                            <p className="text-sm text-gray-500 font-mono">{maskEmail(manager.email)}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg">Active</span>
                            <button onClick={() => handleRemoveManager(manager._id)} className="text-xs text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
                                Demote
                            </button>
                        </div>
                    </div>
                ))}
                {managers.length === 0 && (
                    <div className="col-span-full text-gray-500 text-center py-12 bg-gray-900/30 rounded-2xl">
                        No active managers. Invite someone to help you!
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showCreateManager && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">Invite Manager</h3>
                            <form onSubmit={handleInviteManager} className="space-y-4">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className="w-full bg-gray-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowCreateManager(false)} className="flex-1 py-3 bg-gray-800 rounded-xl font-bold hover:bg-gray-700">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-500">Send Invite</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
