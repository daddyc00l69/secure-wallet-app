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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    // Default locked if token exists (will be verified against hasPin later)
    const [isAppLocked, setIsAppLocked] = useState(!!localStorage.getItem('token'));

    const fetchUser = useCallback(async (currentToken: string) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
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
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        setIsAppLocked(false);
    };

    const refreshUser = async () => {
        if (token) await fetchUser(token);
    };

    const unlockApp = () => setIsAppLocked(false);
    const lockApp = () => setIsAppLocked(true);

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
            lockApp
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
