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
                    axios.get(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } })
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
            await axios.post(`${API_URL}/settings`,
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
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="w-32 h-32 text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-1">
                                System Overview
                            </h1>
                            <p className="text-gray-400">Manage your application's global settings and metrics.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-gray-200">User Uploads</span>
                            <span className={`text-xs font-medium ${allowUserUploads ? 'text-green-400' : 'text-red-400'}`}>
                                {allowUserUploads ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <button
                            onClick={handleToggleUploads}
                            disabled={settingsLoading}
                            className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${allowUserUploads ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${allowUserUploads ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
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
