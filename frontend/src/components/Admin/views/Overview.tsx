import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { Users, Ticket, UserPlus, Eye, Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
    users: number;
    managers: number;
    totalTickets: number;
    openTickets: number;
}

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [allowUserUploads, setAllowUserUploads] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, settingsRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data);
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

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
    );

    const statItems = [
        { label: 'Total Users', value: stats?.users, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'Managers', value: stats?.managers, icon: UserPlus, color: 'from-purple-500 to-pink-500' },
        { label: 'Total Tickets', value: stats?.totalTickets, icon: Ticket, color: 'from-orange-500 to-red-500' },
        { label: 'Open Tickets', value: stats?.openTickets, icon: Eye, color: 'from-green-500 to-emerald-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/20">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            System Overview
                        </h1>
                        <p className="text-gray-400 text-sm">Real-time metrics & global controls</p>
                    </div>
                </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((stat, i) => (
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
        </div>
    );
};
