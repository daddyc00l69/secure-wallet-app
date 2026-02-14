import React, { useState } from 'react';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { Upload, Download, ArrowLeft, Loader2, CloudUpload, CloudDownload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../../config';


export const DataManagement: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();

    const fetchAllData = async () => {
        const [cards, banks, addresses] = await Promise.all([
            axios.get(`${API_URL}/cards`),
            axios.get(`${API_URL}/bank-accounts`),
            axios.get(`${API_URL}/addresses`)
        ]);
        return {
            cards: cards.data,
            bankAccounts: banks.data,
            addresses: addresses.data
        };
    };

    const handleExport = async () => {
        if (!password) {
            setMessage({ type: 'error', text: 'Please enter a password to encrypt your backup.' });
            return;
        }

        try {
            setLoading(true);
            const data = await fetchAllData();
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();

            const blob = new Blob([encrypted], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.enc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Backup exported successfully!' });
        } catch (err) {
            console.error('Export failed:', err);
            setMessage({ type: 'error', text: 'Failed to export data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!password) {
            setMessage({ type: 'error', text: 'Please enter the password to decrypt this backup.' });
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setLoading(true);
                const encrypted = event.target?.result as string;
                const bytes = CryptoJS.AES.decrypt(encrypted, password);
                const decryptedApps = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                if (!decryptedApps.cards || !decryptedApps.bankAccounts || !decryptedApps.addresses) {
                    throw new Error('Invalid backup format');
                }

                // Batch Import (Looping for now)
                let successCount = 0;

                // Cards
                for (const card of decryptedApps.cards) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _id, user, __v, ...cleanCard } = card; // Remove ID and system fields
                    await axios.post(`${API_URL}/cards`, cleanCard);
                    successCount++;
                }

                // Banks
                for (const account of decryptedApps.bankAccounts) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _id, user, __v, ...cleanAccount } = account;
                    await axios.post(`${API_URL}/bank-accounts`, cleanAccount);
                    successCount++;
                }

                // Addresses
                for (const address of decryptedApps.addresses) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _id, user, __v, ...cleanAddress } = address;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    await axios.post(`${API_URL}/addresses`, cleanAddress);
                    successCount++;
                }

                setMessage({ type: 'success', text: `Successfully imported data!` });
                e.target.value = ''; // Reset
            } catch (err) {
                console.error('Import failed:', err);
                setMessage({ type: 'error', text: 'Failed to import. Wrong password or corrupted file.' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleCloudBackup = async () => {
        if (!password) {
            setMessage({ type: 'error', text: 'Please enter a password to encrypt your backup.' });
            return;
        }

        try {
            setLoading(true);
            const data = await fetchAllData();
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();

            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/backup`,
                { encryptedData: encrypted },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage({ type: 'success', text: 'Encrypted backup saved to Secure Cloud!' });
        } catch (err) {
            console.error('Cloud Backup failed:', err);
            setMessage({ type: 'error', text: 'Failed to save to cloud.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCloudRestore = async () => {
        if (!password) {
            setMessage({ type: 'error', text: 'Please enter your password to decrypt the cloud backup.' });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/backup`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const encrypted = res.data.encryptedData;
            if (!encrypted) throw new Error('No backup found');

            const bytes = CryptoJS.AES.decrypt(encrypted, password);
            const decryptedApps = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

            if (!decryptedApps.cards || !decryptedApps.bankAccounts || !decryptedApps.addresses) {
                throw new Error('Invalid backup format');
            }

            // Restore Logic (Re-using the logic from file import can be refactored, but copying for simplicity here)
            // Batch Import
            let successCount = 0;
            // Cards
            for (const card of decryptedApps.cards) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _id, user, __v, ...cleanCard } = card;
                await axios.post(`${API_URL}/cards`, cleanCard);
                successCount++;
            }
            // Banks
            for (const account of decryptedApps.bankAccounts) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _id, user, __v, ...cleanAccount } = account;
                await axios.post(`${API_URL}/bank-accounts`, cleanAccount);
                successCount++;
            }
            // Addresses
            for (const address of decryptedApps.addresses) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _id, user, __v, ...cleanAddress } = address;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                await axios.post(`${API_URL}/addresses`, cleanAddress);
                successCount++;
            }

            setMessage({ type: 'success', text: `Successfully restored data from cloud!` });
        } catch (err) {
            console.error('Cloud Restore failed:', err);
            setMessage({ type: 'error', text: 'Failed to restore. Wrong password or no backup found.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-2xl">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-3xl font-bold mb-2">Data Management</h2>
                    <p className="text-gray-500 mb-8">Securely backup and restore your wallet data.</p>

                    {message && (
                        <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Encryption Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter a secure password for backup/restore"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                This password is used to encrypt your exported file and decrypt it during import.
                                <strong> Do not forget it!</strong>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all group"
                            >
                                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                                    <Download className="w-6 h-6" />
                                </div>
                                <span className="font-semibold">Local Export</span>
                                <span className="text-xs text-gray-400 text-center">Save file to device</span>
                            </button>

                            <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all group cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <span className="font-semibold">{loading ? 'Importing...' : 'Local Import'}</span>
                                <span className="text-xs text-gray-400 text-center">Restore from file</span>
                                <input
                                    type="file"
                                    accept=".enc,.json"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={loading}
                                />
                            </label>

                            <button
                                onClick={handleCloudBackup}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl hover:border-blue-500 hover:bg-blue-100 transition-all group"
                            >
                                <div className="p-3 bg-white rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <CloudUpload className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-blue-900">Cloud Backup</span>
                                <span className="text-xs text-blue-600 text-center">Save encrypted to server</span>
                            </button>

                            <button
                                onClick={handleCloudRestore}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-purple-200 bg-purple-50 rounded-2xl hover:border-purple-500 hover:bg-purple-100 transition-all group"
                            >
                                <div className="p-3 bg-white rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <CloudDownload className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-purple-900">Cloud Restore</span>
                                <span className="text-xs text-purple-600 text-center">Restore from server</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
