import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { Ticket, Lock, Loader2, Trash2, RefreshCw, Paperclip, AlertOctagon } from 'lucide-react';

interface ITicket {
    _id: string;
    subject: string;
    message: string;
    status: 'open' | 'closed' | 'in_progress';
    user: { _id: string, username: string, email: string };
    createdAt: string;
    escalated: boolean;
    closedAt?: string;
    messages?: { sender: string, message: string, timestamp: string }[];
    lastMessageAt?: string;
    lastMessageSender?: 'user' | 'agent';
    allowAttachments?: boolean;
    assignedTo?: { _id: string, username: string };
}

const Linkify = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
        <>
            {parts.map((part, i) =>
                urlRegex.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {part}
                    </a>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const TicketsView: React.FC = () => {
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
    const [managers, setManagers] = useState<{ _id: string, username: string, role: string }[]>([]);
    const [reply, setReply] = useState('');
    const lastTicketsRef = useRef<string>('');
    const { user: currentUser } = useAuth();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTickets();
        fetchManagers();
        const interval = setInterval(fetchTickets, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } });

            // Sort: Escalated Open > Open > In Progress > Closed
            // Then by Last Message or Created At
            const sortedTickets = (res.data as ITicket[]).sort((a, b) => {
                if (a.escalated && !b.escalated) return -1;
                if (!a.escalated && b.escalated) return 1;

                // Priority to open tickets
                // ... logic handled by backend mainly, but let's refine here if needed
                return new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime();
            });

            const strData = JSON.stringify(sortedTickets);
            if (strData !== lastTicketsRef.current) {
                setTickets(sortedTickets);
                lastTicketsRef.current = strData;

                // Update selected ticket if open
                if (selectedTicket) {
                    const updated = sortedTickets.find((t: ITicket) => t._id === selectedTicket._id);
                    if (updated) {
                        // Only update if messages changed or status changed to avoid UI jitter
                        if (JSON.stringify(updated.messages) !== JSON.stringify(selectedTicket.messages) ||
                            updated.status !== selectedTicket.status ||
                            updated.allowAttachments !== selectedTicket.allowAttachments) {
                            setSelectedTicket(updated);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            const updated = { ...selectedTicket!, assignedTo: res.data.assignedTo, escalated: res.data.escalated }; // Update escalated status too
            setTickets(prev => prev.map(t => t._id === ticketId ? updated : t));
            setSelectedTicket(updated);
        } catch (err) {
            console.error("Failed to assign", err);
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
            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, messages: res.data.messages, status: res.data.status } : t));
            setSelectedTicket(prev => prev ? { ...prev, messages: res.data.messages, status: res.data.status } : null);
            setReply('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/manager/tickets/${id}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchTickets();
        } catch (err) {
            console.error(err);
        }
    };

    const handleReopenTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/manager/tickets/${id}/reopen`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'open' } : t));
            if (selectedTicket?._id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTicket = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setTickets(prev => prev.filter(t => t._id !== id));
            if (selectedTicket?._id === id) setSelectedTicket(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGrantAccess = async () => {
        if (!selectedTicket) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/access/grant`,
                { userId: selectedTicket.user._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const link = `${window.location.origin}/secure-edit?token=${res.data.token}`;

            // Auto-paste link into reply
            setReply(prev => `${prev ? prev + '\n' : ''}Here is a temporary secure link to edit your profile: ${link} (valid for 15 mins)`);
        } catch (err) {
            console.error(err);
            alert('Failed to generate grant link');
        }
    };

    const handleToggleUpload = async () => {
        if (!selectedTicket) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/manager/tickets/${selectedTicket._id}/toggle-upload`, {}, { headers: { Authorization: `Bearer ${token}` } });

            setSelectedTicket(prev => prev ? { ...prev, allowAttachments: res.data.allowAttachments } : null);
            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, allowAttachments: res.data.allowAttachments } : t));
        } catch (err) {
            console.error(err);
            alert('Failed to toggle upload permission');
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

    return (
        <div className="h-full flex bg-[#1a1d24] text-white">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold">Tickets</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedTicket?._id === ticket._id ? 'bg-white/5 border-l-2 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    {ticket.escalated && <AlertOctagon className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                    <h4 className={`font-bold text-sm line-clamp-1 ${ticket.status === 'closed' ? 'text-gray-500' : 'text-gray-200'}`}>{ticket.subject}</h4>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0 ml-2 ${ticket.status === 'open' ? 'bg-green-500/10 text-green-500' :
                                    ticket.status === 'closed' ? 'bg-gray-500/10 text-gray-500' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.message}</p>
                            <div className="flex justify-between items-center text-[10px] text-gray-600">
                                <span>{ticket.user?.username || 'User'}</span>
                                <div>
                                    {ticket.assignedTo && <span className="text-blue-400 mr-2">@{ticket.assignedTo.username}</span>}
                                    <span>{new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#14161b]">
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1d24]">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        {selectedTicket.subject}
                                        {selectedTicket.escalated && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">PRIORITY</span>}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>#{selectedTicket._id.slice(-6)}</span>
                                        <span>•</span>
                                        <span>{selectedTicket.user?.email || 'No Email'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                {/* Toggle Upload Button */}
                                {currentUser?.role !== 'user' && (
                                    <button
                                        onClick={handleToggleUpload}
                                        title={selectedTicket.allowAttachments ? "Disable Uploads" : "Allow File Uploads"}
                                        className={`p-2 rounded-lg transition-colors ${selectedTicket.allowAttachments ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-700/50 text-gray-400 border border-transparent'}`}
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                )}

                                {currentUser?.role !== 'admin' && (
                                    <div className="flex items-center gap-2 bg-[#20232a] p-1 rounded-lg border border-white/10">
                                        <span className="text-[10px] uppercase font-bold text-gray-500 pl-1">Assign</span>
                                        <select
                                            className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer py-1 pr-2"
                                            value={selectedTicket.assignedTo?._id || ''}
                                            onChange={(e) => handleAssignTicket(selectedTicket._id, e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {managers.map(m => (
                                                <option key={m._id} value={m._id}>{m.username} ({m.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedTicket.status === 'closed' ? (
                                    <>
                                        {currentUser?.email !== 'admin@test.app' && (
                                            <>
                                                <button onClick={() => handleReopenTicket(selectedTicket._id)} className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-500/20 transition-colors flex items-center gap-1">
                                                    <RefreshCw className="w-3 h-3" /> Reopen
                                                </button>
                                                <button onClick={() => handleDeleteTicket(selectedTicket._id)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 transition-colors flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {currentUser?.email !== 'admin@test.app' && (
                                            <button onClick={() => handleCloseTicket(selectedTicket._id)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 transition-colors">
                                                Close
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={chatContainerRef}>
                            <div className="bg-[#1a1d24] border border-white/5 p-4 rounded-xl mb-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Request</h4>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap"><Linkify text={selectedTicket.message} /></p>
                            </div>

                            {selectedTicket.messages?.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${msg.sender === 'agent' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.sender === 'agent'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-[#1a1d24] border border-white/5 text-gray-200 rounded-tl-sm'
                                            }`}>
                                            <div className="whitespace-pre-wrap"><Linkify text={msg.message} /></div>
                                        </div>
                                        <span className="text-[10px] text-gray-600 mt-1 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.sender === 'agent' ? 'Admin' : 'User'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <div className="p-4 bg-[#1a1d24] border-t border-white/5">
                                <div className="flex gap-2">
                                    <button onClick={handleGrantAccess} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-colors" title="Generate Secure Edit Link">
                                        <Lock className="w-5 h-5" />
                                    </button>
                                    <input
                                        className="flex-1 bg-[#14161b] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="Type a reply..."
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleReply()}
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={!reply.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Ticket className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
