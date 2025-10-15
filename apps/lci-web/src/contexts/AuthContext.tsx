// LCI Web - Auth Context
// White-hat: Centralized auth state management

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  kycLevel: string;
  status: string;
  locale: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('lci_token');
    const storedUser = localStorage.getItem('lci_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('lci_token');
        localStorage.removeItem('lci_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Giriş başarısız');
    }

    // Store auth data
    localStorage.setItem('lci_token', data.token.accessToken);
    localStorage.setItem('lci_user', JSON.stringify(data.user));
    setToken(data.token.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3201'}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Kayıt başarısız');
    }

    // Store auth data
    localStorage.setItem('lci_token', data.token.accessToken);
    localStorage.setItem('lci_user', JSON.stringify(data.user));
    setToken(data.token.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('lci_token');
    localStorage.removeItem('lci_user');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
