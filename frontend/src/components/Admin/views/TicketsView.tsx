import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { Ticket, Eye, Settings, Lock, Loader2 } from 'lucide-react';
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
    const [managers, setManagers] = useState<User[]>([]);
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
                setManagers(usersRes.data.filter((u: User) => u.role === 'manager'));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                                <div>
                                    <h3 className="font-bold text-lg">Ticket Details</h3>
                                    <p className="text-xs text-gray-400">{selectedTicket.subject}</p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-full">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh] custom-scrollbar">
                                <div className="bg-gray-800/50 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1 font-bold">Original Request</p>
                                    <p className="text-sm">{selectedTicket.message}</p>
                                </div>
                                {selectedTicket.messages?.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'agent' ? 'bg-blue-600/90 text-white rounded-tr-none shadow-lg shadow-blue-500/10' : 'bg-gray-800 border border-white/10 text-gray-200 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                            <div className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-800/50 border-t border-white/10">
                                {selectedTicket.status !== 'closed' ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2 justify-between items-center">
                                            <button
                                                onClick={handleGrantAccess}
                                                className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/30 hover:bg-purple-600/30 flex items-center gap-1"
                                                title="Grant 15 min edit access"
                                            >
                                                <Lock className="w-3 h-3" /> Grant Access
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">Assign:</span>
                                                <select
                                                    className="bg-gray-900 border border-white/10 text-xs rounded-lg p-1"
                                                    onChange={(e) => handleAssignTicket(selectedTicket._id, e.target.value)}
                                                    value={selectedTicket.assignedTo?._id || ""}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {managers.map(m => (
                                                        <option key={m._id} value={m._id}>{m.username}</option>
                                                    ))}
                                                </select>
                                            </div>
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
                                    <div className="text-center text-gray-500">Ticket Closed</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
