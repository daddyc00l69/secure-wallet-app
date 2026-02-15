import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
    id: string;
    username: string;
    email: string;
    isVerified: boolean;
    hasPin?: boolean;
    role: 'user' | 'manager' | 'admin';
    canScreenshot?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    isAppLocked: boolean;
    refreshUser: () => Promise<void>;
    unlockApp: () => void;
    lockApp: () => void;
    editToken: string | null;
    setEditToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    // Default unlocked. We will lock if necessary based on user prefs/timeout later.
    const [isAppLocked, setIsAppLocked] = useState(false);

    const [editToken, setEditToken] = useState<string | null>(sessionStorage.getItem('editToken'));

    const fetchUser = useCallback(async (currentToken: string) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
            // If editToken exists, add it to headers
            // We need to do this carefully not to lose it on refresh if we don't persist it.
            // For now, let's just set it if state has it.
            // Actually, we should check if we persist it? The plan said URL param.
            // So the Dashboard will call setEditToken.
            const res = await axios.get(`${API_URL}/auth/me`);
            setUser(res.data);
            // If user has no PIN, ensure app is unlocked
            if (!res.data.hasPin) {
                setIsAppLocked(false);
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
            setIsAppLocked(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to update headers when editToken changes
    useEffect(() => {
        if (editToken) {
            axios.defaults.headers.common['x-access-token'] = editToken;
            sessionStorage.setItem('editToken', editToken);
        } else {
            delete axios.defaults.headers.common['x-access-token'];
            sessionStorage.removeItem('editToken');
        }
    }, [editToken]);

    useEffect(() => {
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
            delete axios.defaults.headers.common['Authorization'];
            setIsAppLocked(false);
        }
    }, [token, fetchUser]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // On explicit login, we don't need to lock immediately
        setIsAppLocked(false);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setEditToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-access-token'];
        setIsAppLocked(false);
    };

    const refreshUser = async () => {
        if (token) await fetchUser(token);
    };

    const unlockApp = () => setIsAppLocked(false);
    const lockApp = () => {
        if (user?.hasPin) {
            setIsAppLocked(true);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            loading,
            isAppLocked,
            refreshUser,
            unlockApp,
            lockApp,
            editToken,
            setEditToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
