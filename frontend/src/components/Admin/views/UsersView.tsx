import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { Users, Search, Download, MonitorCheck, MonitorX, Loader2 } from 'lucide-react';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    isVerified: boolean;
    canScreenshot?: boolean;
}

export const UsersView: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (err) {
            console.error('Failed to update role', err);
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

    const exportToCSV = () => {
        const csvContent = [
            ['Username', 'Email', 'Role', 'Verified'].join(','),
            ...allUsers.map(user => [
                user.username,
                maskEmail(user.email),
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

    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
        <div className="bg-gray-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    User Database
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={exportToCSV} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">
                        <Download className="w-5 h-5 text-gray-300" />
                    </button>
                    <div className="relative flex-1 md:flex-none">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="bg-gray-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-[#16181d] z-10">
                        <tr>
                            <th className="text-left py-3 bg-[#0f1014]">User</th>
                            <th className="text-left py-3 bg-[#0f1014]">Role</th>
                            <th className="text-right py-3 bg-[#0f1014]">Action</th>
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
                                <td className="py-3 text-right flex justify-end gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('token');
                                                const newValue = !user.canScreenshot;
                                                await axios.put(`${API_URL}/admin/users/${user._id}/permissions`,
                                                    { canScreenshot: newValue },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                setAllUsers(prev => prev.map(u => u._id === user._id ? { ...u, canScreenshot: newValue } : u));
                                            } catch (err) {
                                                alert('Failed to update permission');
                                            }
                                        }}
                                        className={`p-1.5 rounded-lg text-xs font-bold border ${user.canScreenshot ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}
                                        title={user.canScreenshot ? "Screenshots Allowed" : "Screenshots Blocked"}
                                    >
                                        {user.canScreenshot ? <MonitorCheck className="w-4 h-4" /> : <MonitorX className="w-4 h-4" />}
                                    </button>

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
    );
};
