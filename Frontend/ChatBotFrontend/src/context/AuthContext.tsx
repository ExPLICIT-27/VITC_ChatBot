import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
    token: string | null;
    userEmail: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            axios.get(`${API_URL}/user/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setUserEmail(res.data.email))
                .catch(() => {
                    // If token is invalid or expired
                    setToken(null);
                    setUserEmail(null);
                    localStorage.removeItem('token');
                });
        } else {
            setUserEmail(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setToken(null);
        setUserEmail(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ token, userEmail, login, logout, isAuthenticated: !!token }}>
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
