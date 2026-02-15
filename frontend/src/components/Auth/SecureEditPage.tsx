import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Loader2, Save, X } from 'lucide-react';

export const SecureEditPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        bio: ''
    });

    useEffect(() => {
        if (!token) {
            setError('No token provided');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await axios.post(`${API_URL}/access/verify`, { token });
                if (res.data.valid) {
                    setValid(true);
                    setUserId(res.data.userId);
                    // Fetch user current data to edit
                    // We need a public or token-based endpoint to get user data for editing
                    // For now, we might just allow setting new data or we need an endpoint that accepts this token to fetch data
                    // Let's assume we can't fetch without auth, but we can submit with the token.
                    // Actually, usually we'd want to pre-fill. 
                    // Let's fetch basic info if possible. If not, we start empty.
                } else {
                    setError('Invalid or expired token');
                }
            } catch (err) {
                setError('Failed to verify token');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // We need an endpoint to update user profile using the secure token
            // The existing /users/profile requires Auth header.
            // We likely need a specific endpoint for this secure edit or valid token middleware.
            // For now, I'll assume we can't easily fetch/update without a dedicated route.
            // I'll create a dedicated route in backend for this: /access/update-profile

            await axios.post(`${API_URL}/access/update-profile`, {
                token,
                ...formData
            });

            // Consume token
            await axios.post(`${API_URL}/access/consume`, { token });

            alert('Profile updated successfully!');
            navigate('/login');
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin" /></div>;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl max-w-md text-center">
                <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                <p className="text-gray-300">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                <h1 className="text-2xl font-bold text-white mb-6">Secure Profile Edit</h1>
                <p className="text-gray-400 mb-6 text-sm">You have temporary access to edit this profile. This link will expire once used.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter new username"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};
