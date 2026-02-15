import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { Ticket, Lock, Loader2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ticket {
    _id: string;
    subject: string;
    message: string;
    status: string;
    escalated: boolean;
    user: { _id: string, username: string };
    createdAt: string;
    messages?: {
        sender: string;
        senderName?: string;
        message: string;
        timestamp?: string;
    }[];
    assignedTo?: { _id: string, username: string };
}

interface User {
    _id: string;
    username: string;
    role: string;
}

export const TicketsView: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [managers, setManagers] = useState<User[]>([]); // Includes Admins now
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [ticketsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setTickets(ticketsRes.data);
                setManagers(usersRes.data.filter((u: User) => u.role === 'manager' || u.role === 'admin')); // Admins too
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Polling
        const interval = setInterval(() => {
            const fetchUpdates = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } });
                    setTickets(res.data);
                    // Update selected
                    if (selectedTicket) {
                        const updated = res.data.find((t: any) => t._id === selectedTicket._id);
                        if (updated && updated.messages.length !== selectedTicket.messages?.length) {
                            setSelectedTicket(updated);
                        }
                    }
                } catch (err) { console.error(err); }
            };
            fetchUpdates();
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedTicket]);

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
        if (!selectedTicket || !selectedTicket.user?._id) return;
        if (!window.confirm('Grant 15-minute edit access to this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/access/grant`,
                { userId: selectedTicket.user._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { link } = res.data;
            const fullLink = `${window.location.origin}${link}`;
            await handleReplyTicket(null as any, `You have been granted temporary access to edit your profile and add cards.\n\nThis link is valid for 15 minutes:\n${fullLink}`);
            alert('Access granted and link sent to user.');
        } catch (err) {
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

    const handleAssignTicket = async (ticketId: string, managerId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/manager/tickets/${ticketId}/assign`,
                { managerId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTickets(tickets.map(t => t._id === res.data._id ? res.data : t));
            if (selectedTicket?._id === ticketId) setSelectedTicket(res.data);
            alert(`Assigned to ${res.data.assignedTo?.username}`);
        } catch (err) {
            alert('Failed to assign ticket');
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
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
                            <button onClick={() => setSelectedTicket(ticket)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                        <h3 className="font-bold text-lg mb-1 truncate">{ticket.subject}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{ticket.message}</p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                            <span>{ticket.user?.username}</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        {(ticket as any).assignedTo && (
                            <div className="mt-2 text-xs text-purple-400 font-bold">
                                Assigned to: {(ticket as any).assignedTo.username}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedTicket && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1d24] border border-white/10 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden font-sans">
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 bg-[#14161b] flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedTicket.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white leading-tight">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <span>Ticket #{selectedTicket._id.slice(-6)}</span>
                                            <span>•</span>
                                            <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className={`capitalize ${selectedTicket.status === 'open' ? 'text-green-400' : 'text-blue-400'}`}>
                                                {selectedTicket.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Content & Chat */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#1a1d24]">
                                {/* Original Request Card */}
                                <div className="bg-[#20232a] border border-white/5 rounded-xl p-5 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Original Request</h4>
                                    <p className="text-gray-200 text-sm leading-relaxed">{selectedTicket.message}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-white/5 flex-1"></div>
                                    <span className="text-xs text-gray-600 font-medium">Conversation History</span>
                                    <div className="h-px bg-white/5 flex-1"></div>
                                </div>

                                {/* Messages */}
                                <div className="space-y-4">
                                    {selectedTicket.messages?.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] ${msg.sender === 'agent' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'agent'
                                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                                    : 'bg-[#2a2d36] text-gray-200 border border-white/5 rounded-tl-sm'
                                                    }`}>
                                                    {msg.sender === 'agent' && <div className="text-[10px] font-bold text-blue-200 mb-1">Agent</div>}
                                                    {msg.message}
                                                </div>
                                                <span className="text-[10px] text-gray-600 mt-1 px-1">
                                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-5 bg-[#14161b] border-t border-white/5 z-10">
                                {selectedTicket.status !== 'closed' ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleGrantAccess}
                                                    className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/20 hover:bg-purple-500/20 flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Lock className="w-3.5 h-3.5" /> Grant Access
                                                </button>

                                                <div className="bg-[#20232a] border border-white/10 rounded-lg flex items-center px-2 py-1">
                                                    <span className="text-[10px] text-gray-500 mr-2 uppercase font-bold tracking-wider">Assign</span>
                                                    <select
                                                        className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer py-0.5"
                                                        onChange={(e) => {
                                                            if (e.target.value) handleAssignTicket(selectedTicket._id, e.target.value);
                                                        }}
                                                        value={selectedTicket.assignedTo?._id || ""}
                                                    >
                                                        <option value="">Select Admin...</option>
                                                        {managers.map(m => (
                                                            <option key={m._id} value={m._id}>{m.username}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleCloseTicket(selectedTicket._id)}
                                                className="text-xs text-red-400 hover:text-red-300 font-medium px-2"
                                            >
                                                Close Ticket
                                            </button>
                                        </div>

                                        <form onSubmit={(e) => handleReplyTicket(e)} className="flex gap-2 relative">
                                            <input
                                                value={replyMessage}
                                                onChange={e => setReplyMessage(e.target.value)}
                                                placeholder="Type a reply..."
                                                className="flex-1 bg-[#20232a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!replyMessage.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                Send
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center p-2 text-gray-500 gap-2 bg-white/5 rounded-xl border border-dashed border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                        <span className="font-medium text-sm">This ticket is closed</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
