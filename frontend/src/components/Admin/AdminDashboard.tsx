import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { Users, Ticket, UserPlus, Shield, Loader2, Search, Download, Settings, Eye, Lock, EyeOff, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Stats {
    users: number;
    managers: number;
    totalTickets: number;
    openTickets: number;
}

interface Ticket {
    _id: string;
    subject: string;
    message: string;
    status: string;
    escalated: boolean;
    user: { _id: string, username: string };
    createdAt: string;
    lastMessageAt?: string;
    lastMessageSender?: 'user' | 'agent';
    messages?: { sender: string; message: string }[];
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [showCreateManager, setShowCreateManager] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');

    // Global Settings State
    const [allowUserUploads, setAllowUserUploads] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Filter users
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, ticketsRes, usersRes, settingsRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data);
                setTickets(ticketsRes.data);
                setAllUsers(usersRes.data);
                if (settingsRes.data) {
                    setAllowUserUploads(settingsRes.data.allowUserUploads);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleUploads = async () => {
        setSettingsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const newValue = !allowUserUploads;
            await axios.post(`${API_URL}/api/settings`,
                { allowUserUploads: newValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAllowUserUploads(newValue);
        } catch (err) {
            console.error('Failed to update settings', err);
            alert('Failed to update settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const usersRes = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(usersRes.data);
        } catch (err) {
            console.error('Failed to update role', err);
        }
    };

    const handleReplyTicket = async (e: React.FormEvent, customMessage?: string) => {
        if (e) e.preventDefault();
        const msgToSend = customMessage || replyMessage;

        if (!selectedTicket || !msgToSend.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/reply`,
                { message: msgToSend },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedTicket(res.data);
            setTickets(tickets.map(t => t._id === res.data._id ? res.data : t));
            setReplyMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleGrantAccess = async () => {
        if (!selectedTicket || !selectedTicket.user?._id) {
            alert('Cannot grant access: User ID missing on ticket.');
            return;
        }

        if (!window.confirm('Grant 15-minute edit access to this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/access/grant`,
                { userId: selectedTicket.user._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { link } = res.data;
            // Get base URL from window location to form full link if backend returns relative
            const fullLink = `${window.location.origin}${link}`;

            await handleReplyTicket(null as any, `You have been granted temporary access to edit your profile and add cards. This link is valid for 15 minutes:\n\n${fullLink}`);

            alert('Access granted and link sent to user.');
        } catch (err: any) {
            console.error(err);
            alert('Failed to grant access');
        }
    };

    const handleCloseTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${id}/close`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTickets(tickets.map(t => t._id === id ? res.data : t));
            if (selectedTicket?._id === id) setSelectedTicket(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReopenTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${id}/reopen`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTickets(tickets.map(t => t._id === id ? res.data : t));
            if (selectedTicket?._id === id) setSelectedTicket(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTicket = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(tickets.filter(t => t._id !== id));
            if (selectedTicket?._id === id) setSelectedTicket(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete ticket');
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
            const usersRes = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(usersRes.data);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send invitation');
        }
    };

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (!name || !domain) return email;
        const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name + '***';
        return `${maskedName}@${domain}`;
    };

    const exportToCSV = () => {
        const csvContent = [
            ['Username', 'Email', 'Role', 'Verified'].join(','),
            ...allUsers.map(user => [
                user.username,
                maskEmail(user.email), // Mask even in export for safety? User requested "mask all things"
                user.role,
                user.isVerified ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_masked_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f1014] text-white font-sans p-6 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header with Glassmorphism */}
                <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Admin Command
                            </h1>
                            <p className="text-gray-400 text-sm">System Overview & Controls</p>
                        </div>
                    </div>

                    {/* Global Settings Toggle */}
                    <div className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-2xl border border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-gray-200">User Uploads</span>
                            <span className="text-xs text-gray-500">{allowUserUploads ? 'Allowed' : 'Restricted'}</span>
                        </div>
                        <button
                            onClick={handleToggleUploads}
                            disabled={settingsLoading}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${allowUserUploads ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${allowUserUploads ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Users', value: stats?.users, icon: Users, color: 'from-blue-500 to-cyan-500' },
                        { label: 'Managers', value: stats?.managers, icon: UserPlus, color: 'from-purple-500 to-pink-500' },
                        { label: 'Total Tickets', value: stats?.totalTickets, icon: Ticket, color: 'from-orange-500 to-red-500' },
                        { label: 'Open Tickets', value: stats?.openTickets, icon: Eye, color: 'from-green-500 to-emerald-500' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-800/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Management */}
                    <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                User Database
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={exportToCSV} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">
                                    <Download className="w-5 h-5 text-gray-300" />
                                </button>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="bg-gray-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto max-h-[500px] pr-2 custom-scrollbar">
                            <table className="w-full">
                                <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-[#16181d] z-10">
                                    <tr>
                                        <th className="text-left pb-4">User</th>
                                        <th className="text-left pb-4">Role</th>
                                        <th className="text-right pb-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="space-y-2">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="group border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3">
                                                <div className="font-bold">{user.username}</div>
                                                <div className="text-xs text-gray-500 font-mono tracking-wider">{maskEmail(user.email)}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                    user.role === 'manager' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                {user.role === 'manager' && (
                                                    <button onClick={() => handleUpdateRole(user._id, 'user')} className="text-xs text-red-400 hover:underline">
                                                        Demote
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Manager Management */}
                    <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-purple-400" />
                                Managers
                            </h2>
                            <button onClick={() => setShowCreateManager(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold transition-colors">
                                + Add Manager
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[500px] space-y-3">
                            {allUsers.filter(u => u.role === 'manager').map(manager => (
                                <div key={manager._id} className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{manager.username}</p>
                                        <p className="text-xs text-gray-500 font-mono">{maskEmail(manager.email)}</p>
                                    </div>
                                    <button onClick={() => handleUpdateRole(manager._id, 'user')} className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20">
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {allUsers.filter(u => u.role === 'manager').length === 0 && (
                                <p className="text-gray-500 text-center py-8">No managers active</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ticket System */}
                <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-green-400" />
                        Support Tickets
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tickets.map(ticket => (
                            <div key={ticket._id} className="bg-gray-900/50 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedTicket(ticket)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => handleDeleteTicket(ticket._id, e)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
                                            <Settings className="w-4 h-4" /> {/* Using Settings icon for 'Manage/Delete' visual */}
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1 truncate">{ticket.subject}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{ticket.message}</p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                    <span>{ticket.user?.username}</span>
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCreateManager && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md">
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

                {selectedTicket && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                                <div>
                                    <h3 className="font-bold text-lg">Ticket Details</h3>
                                    <p className="text-xs text-gray-400">ID: {selectedTicket._id}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-full">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="bg-gray-800/50 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1 font-bold">Original Request</p>
                                    <p className="text-sm">{selectedTicket.message}</p>
                                </div>
                                {selectedTicket.messages?.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'agent' ? 'bg-blue-600 rounded-tr-none' : 'bg-gray-800 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-800/50 border-t border-white/10">
                                {selectedTicket.status !== 'closed' ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleGrantAccess}
                                                className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/30 hover:bg-purple-600/30 flex items-center gap-1"
                                                title="Grant 15 min edit access"
                                                type="button"
                                            >
                                                <Lock className="w-3 h-3" /> Grant Access
                                            </button>
                                        </div>
                                        <form onSubmit={(e) => handleReplyTicket(e)} className="flex gap-2">
                                            <input
                                                value={replyMessage}
                                                onChange={e => setReplyMessage(e.target.value)}
                                                placeholder="Type a reply..."
                                                className="flex-1 bg-gray-900 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button type="submit" className="bg-blue-600 px-4 rounded-xl font-bold hover:bg-blue-500">Send</button>
                                            <button type="button" onClick={() => handleCloseTicket(selectedTicket._id)} className="bg-red-500/20 text-red-400 px-4 rounded-xl font-bold hover:bg-red-500/30">Close</button>
                                        </form>
                                    </div>
                                ) : (
                                    <button onClick={() => handleReopenTicket(selectedTicket._id)} className="w-full bg-green-600 py-3 rounded-xl font-bold hover:bg-green-500">Reopen Ticket</button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
