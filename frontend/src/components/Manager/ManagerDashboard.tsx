import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { MessageCircle, Loader2 } from 'lucide-react';

// ... (rest of the file content until line 64)

// I need to be careful with replace_file_content. It replaces a contiguous block. 
// The errors are on line 4 and line 64. They are far apart. 
// I should use multi_replace_file_content.

interface Ticket {
    _id: string;
    subject: string;
    message: string;
    status: 'open' | 'closed' | 'in_progress';
    user: { username: string, email: string };
    createdAt: string;
    escalated: boolean;
    closedAt?: string;
    messages?: { sender: string, message: string, timestamp: string }[];
    lastMessageAt?: string;
    lastMessageSender?: 'user' | 'agent';
}

export const ManagerDashboard: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/manager/tickets`, { headers: { Authorization: `Bearer ${token}` } });
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !reply.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/reply`,
                { message: reply },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update ticket in list and selected view
            const updatedTicket = { ...selectedTicket, ...res.data, user: selectedTicket.user }; // Preserve user population if backend doesn't return it
            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? updatedTicket : t));
            setSelectedTicket(updatedTicket);
            setReply('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleClose = async () => {
        if (!selectedTicket) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/close`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedTicket = { ...selectedTicket, status: 'closed' as const };
            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? updatedTicket : t));
            setSelectedTicket(updatedTicket);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Ticket List */}
            <div className="w-1/3 border-r border-gray-200 bg-white h-screen overflow-y-auto">
                <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
                </div>
                <div className="divide-y divide-gray-100">
                    {tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-gray-900 line-clamp-1 ${ticket.lastMessageSender === 'user' && ticket.status !== 'closed' ? 'text-blue-600' : ''}`}>
                                    {ticket.subject}
                                </h4>
                                <div className="flex items-center gap-1">
                                    {(ticket.lastMessageSender === 'user' && ticket.status !== 'closed') && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                            New
                                        </span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-gray-500">by {ticket.user?.username}</p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <p className={`text-sm text-gray-600 line-clamp-2 ${ticket.lastMessageSender === 'user' && ticket.status !== 'closed' ? 'font-semibold text-gray-800' : ''}`}>
                                {ticket.message}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ticket Detail */}
            <div className="flex-1 flex flex-col h-screen bg-gray-50">
                {selectedTicket ? (
                    <>
                        <div className="p-6 bg-white border-b border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                                <p className="text-sm text-gray-500">
                                    Submitted by <span className="font-bold text-gray-700">{selectedTicket.user?.username}</span> on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {selectedTicket.status !== 'closed' && (
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-bold text-sm"
                                >
                                    Close Ticket
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Original Message */}
                            <div className="flex justify-start">
                                <div className="max-w-[80%]">
                                    <div className="text-xs text-gray-400 mb-1 ml-2">{selectedTicket.user?.username}</div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                                        {selectedTicket.message}
                                    </div>
                                </div>
                            </div>

                            {/* Chat History */}
                            {selectedTicket.messages?.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[80%]">
                                        <div className={`text-xs text-gray-400 mb-1 ${msg.sender === 'agent' ? 'text-right mr-2' : 'ml-2'}`}>
                                            {msg.sender === 'agent' ? 'Support Agent' : selectedTicket.user?.username}
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'agent'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyPress={e => e.key === 'Enter' && handleReply()}
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={!reply.trim()}
                                    className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
