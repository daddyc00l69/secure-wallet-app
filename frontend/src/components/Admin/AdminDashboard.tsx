import React, { useState } from 'react';
import { Shield, LayoutDashboard, Users, UserPlus, Ticket, LogOut } from 'lucide-react';
import { Overview } from './views/Overview';
import { UsersView } from './views/UsersView';
import { ManagersView } from './views/ManagersView';
import TicketsView from './views/TicketsView';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'managers' | 'tickets'>('overview');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview />;
            case 'users': return <UsersView />;
            case 'managers': return <ManagersView />;
            case 'tickets': return <TicketsView />;
            default: return <Overview />;
        }
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'managers', label: 'Managers', icon: UserPlus },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
    ];

    return (
        <div className="min-h-screen bg-[#0f1014] text-white font-sans flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-20 md:w-64 bg-gray-900 border-r border-white/5 flex flex-col justify-between p-4 transform transition-transform duration-300 md:translate-x-0">
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-bold hidden md:block tracking-wide">Admin</span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium hidden md:block">{item.label}</span>
                                {activeTab === item.id && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden md:block" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium hidden md:block">Logout</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-screen p-6 md:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
