import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageCircle, ChevronDown, ChevronUp, Mail, Plus, Ticket, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

interface Ticket {
    _id: string;
    subject: string;
    message: string;
    type: 'card_variant' | 'support' | 'bug';
    status: 'open' | 'closed' | 'in_progress';
    messages?: { sender: 'user' | 'agent', message: string, timestamp: string }[];
    lastMessageAt?: string;
    lastMessageSender?: 'user' | 'agent';
    createdAt: string;
    allowAttachments?: boolean;
    attachments?: { originalName: string, path: string, filename: string }[];
}

export const HelpPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);

    // Form State
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'card_variant' | 'support' | 'bug'>('support');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedTicket || !uploadFile) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', uploadFile);

            const res = await axios.post(`${API_URL}/support/${selectedTicket._id}/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update ticket
            setSelectedTicket(res.data);
            setTickets(tickets.map(t => t._id === res.data._id ? res.data : t));
            setUploadFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // ... (faqs) ...

    // ... (fetchTickets) ...

    const handleReopenTicket = async (id: string) => {
        try {
            console.log('Sending reply...');
            const token = localStorage.getItem('token');
            // Reopening by replying with empty message or specific endpoint? 
            // The user originally could reopen by replying. But now we locked reply.
            // So we need a dedicated reopen endpoint OR just call the reply endpoint with a system message which reopens it?
            // Checking support.ts: It reopens if status is 'closed' on reply.
            // But I disabled the reply input.
            // So I should probably add a dedicated reopen endpoint for the user, OR make the button send a "Reopening Ticket" message to the existing reply endpoint.
            // I'll use the existing reply endpoint but send a system message to trigger the reopen logic.

            await axios.post(`${API_URL}/support/${id}/reply`,
                { message: "User reopened the ticket." },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refetch
            const res = await axios.get(`${API_URL}/support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);

            // Update selected ticket to the reopened one
            const updatedTicket = res.data.find((t: any) => t._id === id);
            if (updatedTicket) setSelectedTicket(updatedTicket);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reopen ticket');
        }
    };

    const handleReplyTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyMessage.trim()) return;

        try {
            console.log('Sending reply...');
            const token = localStorage.getItem('token');
            // We need a route for users to reply. Assuming /api/support/:id/reply exists or using same endpoint
            // Wait, looking at support.ts, there is no reply endpoint for users yet?
            // I should check support.ts. If not, I'll add it. 
            // For now, I'll assume I need to add it to support.ts or use the same logic.
            // Let's use /api/support/:id/reply
            const res = await axios.post(`${API_URL}/support/${selectedTicket._id}/reply`,
                { message: replyMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setSelectedTicket(res.data);
            setTickets(tickets.map(t => t._id === res.data._id ? res.data : t));
            setReplyMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const faqs = [
        {
            question: "How do I secure my wallet?",
            answer: "You can enable App Lock in the Security Settings. This will require a 4-digit PIN every time you open the app."
        },
        {
            question: "Can I recover my account if I lose my phone?",
            answer: "Yes, you can log in to your account on a new device using your email and password. Your data is securely synced."
        },
        {
            question: "How do I add a new card?",
            answer: "Go to the Dashboard and click the 'Add New' button. Select 'Credit Card' and enter your card details."
        },
        {
            question: "Is my data safe?",
            answer: "Yes, we use industry-standard encryption for all your data. Your PIN and passwords are hashed and never stored in plain text."
        }
    ];

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'tickets') {
            fetchTickets();
        }
    }, [activeTab]);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/support`, { subject, message, type }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubject('');
            setMessage('');
            setType('support');
            setShowNewTicketForm(false);
            fetchTickets();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl bg-white min-h-screen shadow-2xl relative flex flex-col">
                {/* Header */}
                <div className="px-6 pt-8 pb-6 bg-white border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'faq' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            FAQ
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'tickets' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Tickets
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'faq' ? (
                        /* FAQ Section */
                        <div className="space-y-3 pb-24">
                            <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-blue-900">Need Help?</h2>
                                <p className="text-sm text-blue-700 mb-4">
                                    Can't find what you're looking for? Open a ticket.
                                </p>
                                <button
                                    onClick={() => {
                                        setActiveTab('tickets');
                                        setShowNewTicketForm(true);
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Mail className="w-4 h-4" />
                                    Contact Support
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5" />
                                Frequently Asked Questions
                            </h3>
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300"
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                        className="w-full p-4 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-semibold text-gray-800 text-sm">{faq.question}</span>
                                        {openFaqIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    {openFaqIndex === index && (
                                        <div className="bg-gray-50 px-4 py-4 text-sm text-gray-600 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Tickets Section */
                        <div className="pb-24">
                            {!showNewTicketForm ? (
                                <>
                                    <button
                                        onClick={() => setShowNewTicketForm(true)}
                                        className="w-full py-3 bg-black text-white rounded-xl font-bold mb-6 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Ticket
                                    </button>

                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No tickets yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {tickets.map((ticket) => (
                                                <div key={ticket._id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)} capitalize`}>
                                                                {ticket.status.replace('_', ' ')}
                                                            </span>
                                                            {(ticket.lastMessageSender === 'agent') && (
                                                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                                    New Reply
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(ticket.lastMessageAt || ticket.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3 className={`font-bold text-gray-900 mb-1 ${ticket.lastMessageSender === 'agent' ? 'text-blue-700' : ''}`}>
                                                        {ticket.subject}
                                                    </h3>
                                                    <p className={`text-sm text-gray-600 line-clamp-2 ${ticket.lastMessageSender === 'agent' ? 'font-semibold' : ''}`}>
                                                        {ticket.message}
                                                    </p>
                                                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                                        <span className="uppercase tracking-wider font-semibold">{ticket.type.replace('_', ' ')}</span>
                                                        <span>ID: {ticket._id.slice(-6)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* New Ticket Form */
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* ... form content ... */}
                                    <div className="flex items-center gap-2 mb-6">
                                        <button
                                            onClick={() => setShowNewTicketForm(false)}
                                            className="text-sm text-gray-500 hover:text-gray-900 font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <h2 className="text-lg font-bold">New Request</h2>
                                    </div>

                                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['support', 'card_variant', 'bug'] as const).map((t) => (
                                                    <button
                                                        type="button"
                                                        key={t}
                                                        onClick={() => setType(t)}
                                                        className={`py-2 text-xs font-bold rounded-lg border capitalize ${type === t
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {t.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                                                placeholder={type === 'card_variant' ? "e.g., Requested Metal Card Logic" : "Brief summary"}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black min-h-[120px]"
                                                placeholder="Describe your request..."
                                                required
                                            />
                                        </div>

                                        {error && <p className="text-red-500 text-sm">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Ticket Chat Modal */}
                            {selectedTicket && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                                            <div>
                                                <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                                                <p className="text-xs text-gray-500">
                                                    ID: {selectedTicket._id.slice(-6)} • {new Date(selectedTicket.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedTicket(null)}
                                                className="p-2 hover:bg-gray-200 rounded-full"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                            {/* Original Message */}
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                                                    <p className="font-bold text-xs text-gray-500 mb-1">You</p>
                                                    {selectedTicket.message}
                                                </div>
                                            </div>

                                            {/* Chat History */}
                                            {selectedTicket.messages?.map((msg, i) => (
                                                <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    {msg.sender === 'agent' && (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <MessageCircle className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[80%] space-y-1 ${msg.sender === 'user' ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                                        <div className={`p-4 rounded-2xl shadow-sm text-sm ${msg.sender === 'user'
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                            }`}>
                                                            {msg.message}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 px-1">
                                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Closed Ticket Warning */}
                                            {selectedTicket.status === 'closed' && (
                                                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center my-4">
                                                    <p className="text-sm text-yellow-800 font-bold mb-1">Ticket Closed</p>
                                                    <p className="text-xs text-yellow-600 mb-3">
                                                        This ticket is closed and will be automatically deleted in 24 hours.
                                                        If your issue is not resolved, please click Reopen below.
                                                        Replies are disabled while the ticket is closed.
                                                    </p>
                                                    <button
                                                        onClick={() => handleReopenTicket(selectedTicket._id)}
                                                        className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-200"
                                                    >
                                                        Reopen Ticket
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <form onSubmit={handleReplyTicket} className="p-4 border-t bg-gray-50 rounded-b-3xl flex flex-col gap-2">
                                            {selectedTicket.allowAttachments && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <label className="cursor-pointer p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                                        <Plus className="w-5 h-5" />
                                                        <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                                                    </label>
                                                    {uploadFile && (
                                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg text-xs text-blue-700">
                                                            <span>{uploadFile.name}</span>
                                                            <button type="button" onClick={() => handleUpload()} disabled={uploading} className="font-bold hover:underline">
                                                                {uploading ? 'Uploading...' : 'Upload'}
                                                            </button>
                                                            <button type="button" onClick={() => setUploadFile(null)} className="ml-2 text-gray-400 font-bold">✕</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={replyMessage}
                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                    placeholder={
                                                        selectedTicket.status === 'closed' ? "Ticket is closed" :
                                                            (selectedTicket.status === 'open' && selectedTicket.lastMessageSender === 'user') ? "Waiting for agent response..." :
                                                                "Type a reply..."
                                                    }
                                                    className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                                    disabled={selectedTicket.status === 'closed' || (selectedTicket.status === 'open' && selectedTicket.lastMessageSender === 'user')}
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!replyMessage.trim() || selectedTicket.status === 'closed' || (selectedTicket.status === 'open' && selectedTicket.lastMessageSender === 'user')}
                                                >
                                                    Send
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
