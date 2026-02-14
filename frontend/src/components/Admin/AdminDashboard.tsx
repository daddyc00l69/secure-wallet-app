import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { Users, Ticket, UserPlus, Shield, Loader2, Search, Download } from 'lucide-react';

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
    user: { username: string };
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

    // Export users to CSV
    const exportToCSV = () => {
        const csvContent = [
            ['Username', 'Email', 'Role', 'Verified'].join(','),
            ...allUsers.map(user => [
                user.username,
                user.email,
                user.role,
                user.isVerified ? 'Yes' : 'No'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Filter users based on search query
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, ticketsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data);
                setTickets(ticketsRes.data);
                setAllUsers(usersRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh users
            const usersRes = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(usersRes.data);
        } catch (err) {
            console.error('Failed to update role', err);
        }
    };

    const handleReplyTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/reply`,
                { message: replyMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setSelectedTicket(res.data);
            setTickets(tickets.map(t => t._id === res.data._id ? res.data : t));
            setReplyMessage('');
        } catch (err) {
            console.error(err);
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
        e.stopPropagation(); // Prevent opening modal
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;

        console.log('Deleting ticket:', id);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Ticket deleted successfully');
            setTickets(tickets.filter(t => t._id !== id));
            if (selectedTicket?._id === id) setSelectedTicket(null);
        } catch (err: any) {
            console.error('Failed to delete ticket:', err);
            console.error('Error response:', err.response);
            alert('Failed to delete ticket');
        }
    };

    const [inviteEmail, setInviteEmail] = useState('');

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

            // Refresh data (managers list might have the pending user)
            const usersRes = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(usersRes.data);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to send invitation');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (!name || !domain) return email;
        const maskedName = name.charAt(0) + '***';
        return `${maskedName}@${domain}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Admin Dashboard
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Users className="w-6 h-6 text-blue-500 mb-2" />
                        <h3 className="text-2xl font-bold">{stats?.users}</h3>
                        <p className="text-xs text-gray-500">Total Users</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <UserPlus className="w-6 h-6 text-purple-500 mb-2" />
                        <h3 className="text-2xl font-bold">{stats?.managers}</h3>
                        <p className="text-xs text-gray-500">Managers</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Ticket className="w-6 h-6 text-gray-500 mb-2" />
                        <h3 className="text-2xl font-bold">{stats?.totalTickets}</h3>
                        <p className="text-xs text-gray-500">Total Tickets</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Ticket className="w-6 h-6 text-green-500 mb-2" />
                        <h3 className="text-2xl font-bold">{stats?.openTickets}</h3>
                        <p className="text-xs text-gray-500">Open Tickets</p>
                    </div>
                </div>

                {/* Managers Management */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Manager Management</h2>
                        <button
                            onClick={() => setShowCreateManager(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Manager
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="pb-3 font-bold">User</th>
                                    <th className="pb-3 font-bold">Email</th>
                                    <th className="pb-3 font-bold">Role</th>
                                    <th className="pb-3 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {allUsers.filter(u => u.role === 'manager' || u.role === 'admin').map((user: any) => (
                                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 font-bold text-gray-900">{user.username}</td>
                                        <td className="py-3 text-gray-500">{maskEmail(user.email)}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-black text-white' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right space-x-2">
                                            {user.role === 'manager' && (
                                                <button
                                                    onClick={() => handleUpdateRole(user._id, 'user')}
                                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300"
                                                >
                                                    Remove Manager
                                                </button>
                                            )}
                                            {user.role === 'admin' && (
                                                <span className="text-xs text-gray-400">System Admin</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {allUsers.filter(u => u.role === 'manager' || u.role === 'admin').length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-gray-400">No managers found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users Management */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={exportToCSV}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username or email..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="pb-3 font-bold">User</th>
                                    <th className="pb-3 font-bold">Email</th>
                                    <th className="pb-3 font-bold">Role</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredUsers.filter(u => u.role === 'user').map((user: any) => (
                                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 font-bold text-gray-900">{user.username}</td>
                                        <td className="py-3 text-gray-500">{maskEmail(user.email)}</td>
                                        <td className="py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                user
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.filter(u => u.role === 'user').length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-gray-400">
                                            {searchQuery ? 'No users match your search' : 'No users found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tickets Management */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Ticket Management</h2>

                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <div key={ticket._id} className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                                                ticket.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleDateString()}
                                            </span>
                                            {(ticket.lastMessageSender === 'user' && ticket.status !== 'closed') && (
                                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`text-lg font-bold text-gray-900 ${ticket.lastMessageSender === 'user' && ticket.status !== 'closed' ? 'border-l-4 border-red-500 pl-2' : ''}`}>
                                            {ticket.subject}
                                        </h3>
                                        <p className={`text-gray-500 text-sm mt-1 ${ticket.lastMessageSender === 'user' && ticket.status !== 'closed' ? 'font-semibold text-gray-800' : ''}`}>
                                            {ticket.message}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-900">ID: {ticket._id.slice(-6)}</p>
                                            <p className="text-xs text-gray-400 uppercase">SUPPORT</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteTicket(ticket._id, e)}
                                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold"
                                    >
                                        View & Reply
                                    </button>
                                    {ticket.status !== 'closed' && (
                                        <button
                                            onClick={() => handleCloseTicket(ticket._id)}
                                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-bold"
                                        >
                                            Close
                                        </button>
                                    )}
                                    {ticket.status === 'closed' && (
                                        <button
                                            onClick={() => handleReopenTicket(ticket._id)}
                                            className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 font-bold"
                                        >
                                            Reopen
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {tickets.length === 0 && <p className="text-center text-gray-400 py-8">No tickets found.</p>}
                    </div>
                </div>
            </div>

            {/* Create Manager Modal */}
            {showCreateManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Invite New Manager</h3>
                            <button onClick={() => setShowCreateManager(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleInviteManager} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                    placeholder="Enter manager's email"
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700">
                                <p>This will send an invitation email with a verification code. The manager needs to use that code to set up their username and password.</p>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                                Send Invitation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                            <div>
                                <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                                <p className="text-xs text-gray-500">
                                    User: {selectedTicket.user?.username || 'Unknown'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 hover:bg-gray-200 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Original Message */}
                            <div className="flex justify-start">
                                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                                    <p className="font-bold text-xs text-gray-500 mb-1">User</p>
                                    {selectedTicket.message}
                                </div>
                            </div>

                            {/* Chat History */}
                            {selectedTicket.messages?.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'agent'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                                        }`}>
                                        <p className={`font-bold text-xs mb-1 ${msg.sender === 'agent' ? 'text-blue-200' : 'text-gray-500'}`}>
                                            {msg.sender === 'agent' ? 'Admin' : 'User'}
                                        </p>
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleReplyTicket} className="p-4 border-t bg-gray-50 rounded-b-3xl flex gap-2">
                            <input
                                type="text"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type a reply..."
                                className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                                disabled={!replyMessage.trim() || selectedTicket.status === 'closed'}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
