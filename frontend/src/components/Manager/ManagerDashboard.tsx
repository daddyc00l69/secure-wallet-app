import React, { useState, useEffect, useRef } from 'react';
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
    allowAttachments?: boolean;
    assignedTo?: { _id: string, username: string };
}

export const ManagerDashboard: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const [managers, setManagers] = useState<{ _id: string, username: string, role: string }[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');
    const lastTicketsRef = useRef<string>('');

    useEffect(() => {
        fetchTickets();
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/manager/list-managers`, { headers: { Authorization: `Bearer ${token}` } });
            setManagers(res.data);
        } catch (err) {
            console.error("Failed to fetch managers", err);
        }
    };

    const handleAssignTicket = async (ticketId: string, managerId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/manager/tickets/${ticketId}/assign`,
                { managerId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Updating local state
            const updatedTicket = { ...selectedTicket!, assignedTo: res.data.assignedTo };
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, assignedTo: res.data.assignedTo } : t));
            setSelectedTicket(updatedTicket);
        } catch (err) {
            console.error("Failed to assign ticket", err);
        }
    }

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/manager/tickets`, { headers: { Authorization: `Bearer ${token}` } });

            // Optimization: Only update state if data changed
            const strData = JSON.stringify(res.data);
            if (strData !== lastTicketsRef.current) {
                setTickets(res.data);
                lastTicketsRef.current = strData;
            }
            return res.data;
        } catch (err) {
            console.error(err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(async () => {
            const newTickets = await fetchTickets();
            if (selectedTicket) {
                const updated = newTickets.find((t: Ticket) => t._id === selectedTicket._id);
                if (updated && JSON.stringify(updated.messages) !== JSON.stringify(selectedTicket.messages)) {
                    setSelectedTicket(updated);
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedTicket]);



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
    }

    const handleToggleUpload = async () => {
        if (!selectedTicket) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/toggle-upload`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Updating local state
            const updatedTicket = { ...selectedTicket, allowAttachments: res.data.allowAttachments };
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
                                <p className="text-xs text-gray-500">by User</p>
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
                                    Submitted by <span className="font-bold text-gray-700">User</span> on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {selectedTicket.status !== 'closed' && (
                                <div className="flex gap-2 items-center">
                                    <div className="bg-gray-100 border border-gray-200 rounded-lg flex items-center px-2 py-1 mr-2">
                                        <span className="text-[10px] text-gray-500 mr-2 uppercase font-bold tracking-wider">Assign</span>
                                        <select
                                            className="bg-transparent text-xs text-gray-700 outline-none cursor-pointer py-1 font-medium"
                                            onChange={(e) => {
                                                if (e.target.value) handleAssignTicket(selectedTicket._id, e.target.value);
                                            }}
                                            value={selectedTicket.assignedTo?._id || ""} // You might need to check how assignedTo comes back (string vs obj)
                                        >
                                            <option value="">Select Admin...</option>
                                            {managers.map(m => (
                                                <option key={m._id} value={m._id}>{m.username}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleToggleUpload}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selectedTicket.allowAttachments
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {selectedTicket.allowAttachments ? 'Uploads Allowed' : 'Allow Uploads'}
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm"
                                    >
                                        Close Ticket
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Original Message */}
                            <div className="flex justify-start">
                                <div className="max-w-[80%]">
                                    <div className="text-xs text-gray-400 mb-1 ml-2">User</div>
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
                                            {msg.sender === 'agent' ? 'Me' : 'User'}
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
