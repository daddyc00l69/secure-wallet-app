import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    LogOut,
    ChevronRight,
    Shield,
    CreditCard,
    Bell,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            icon: Settings,
            label: 'Data Management',
            desc: 'Backup & Restore',
            onClick: () => navigate('/settings'),
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: Shield,
            label: 'Security',
            desc: 'App Lock & PIN',
            onClick: () => navigate('/settings/security'),
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            icon: CreditCard,
            label: 'My Cards',
            desc: 'Manage payment methods',
            onClick: () => navigate('/'),
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            icon: Bell,
            label: 'Notifications',
            desc: 'App alerts',
            onClick: () => { },
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            icon: HelpCircle,
            label: 'Help & Support',
            desc: 'FAQ & Contact',
            onClick: () => navigate('/support'),
            color: 'text-teal-600',
            bg: 'bg-teal-50'
        }
    ];

    if (user?.role === 'admin') {
        menuItems.unshift({
            icon: Shield,
            label: 'Admin Panel',
            desc: 'Manage users & tickets',
            onClick: () => navigate('/admin'),
            color: 'text-black',
            bg: 'bg-gray-200'
        });
    }

    if (user?.role === 'manager') {
        menuItems.unshift({
            icon: Shield,
            label: 'Manager Panel',
            desc: 'Manage support tickets',
            onClick: () => navigate('/manager'),
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md bg-white min-h-screen shadow-2xl relative"
            >
                {/* Header */}
                <div className="px-6 pt-4 pb-4 md:pt-8 md:pb-8 bg-white border-b border-gray-100 z-10 sticky top-0">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900">Profile</h1>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4 border-4 border-white shadow-lg overflow-hidden">
                            <span className="text-2xl md:text-4xl text-gray-400 font-bold">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold text-gray-900">{user?.username}</h2>
                        <p className="text-sm md:text-base text-gray-500">{user?.email || 'No email linked'}</p>

                        {!user?.isVerified && (
                            <span className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                Unverified
                            </span>
                        )}
                        {user?.isVerified && (
                            <span className="mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                Verified <Shield className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                </div>

                {/* Settings List */}
                <div className="p-4 space-y-3 pb-24">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2 mb-2">General</h3>

                    {menuItems.map((item, index) => (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.98 }}
                            onClick={item.onClick}
                            className="w-full flex items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className={`p-3 rounded-xl ${item.bg} ${item.color} mr-4 group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="font-bold text-gray-900">{item.label}</h4>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600" />
                        </motion.button>
                    ))}

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2 mt-6 mb-2">Account</h3>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full flex items-center p-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm hover:bg-red-100 transition-all"
                    >
                        <div className="p-3 rounded-xl bg-red-100 text-red-600 mr-4">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="font-bold text-red-700">Log Out</h4>
                            <p className="text-xs text-red-500">Sign out of your account</p>
                        </div>
                    </motion.button>

                    <div className="text-center mt-8 text-xs text-gray-400">
                        <p>Version 1.2.0 • Build 2024</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
