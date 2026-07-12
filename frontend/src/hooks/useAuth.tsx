'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  lgpd_consent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Login realizado com sucesso!');

      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        teacher: '/professor/dashboard',
        student: '/aluno/cursos'
      };
      router.push(roleRoutes[data.user.role] || '/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login.';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const { data: result } = await api.post('/auth/register', data);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      toast.success('Conta criada com sucesso! Verifique seu e-mail.');
      router.push('/aluno/cursos');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar conta.';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout realizado!');
    router.push('/');
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isTeacher: user?.role === 'teacher',
      isStudent: user?.role === 'student'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
