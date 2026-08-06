'use client';

import React, { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiSearch, FiBell, FiUser, FiLogOut, FiChevronDown, FiMenu, FiSun, FiMoon } from 'react-icons/fi';

interface DashboardLayoutProps {
  role: 'admin' | 'teacher' | 'student';
  title: string;
  children: ReactNode;
}

export default function DashboardLayout({ role, title, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { onNotification } = useSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 8 } });
      setNotifications(data.data || []);
    } catch {
      // ignore
    }
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count ?? data.unread_count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    return onNotification((n: any) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [n, ...prev].slice(0, 8));
      if (n?.message) {
        toast(n.message, { duration: 8000 });
      }
    });
  }, [onNotification]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const formatNotifDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar role={role} />
          </div>
        </>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiMenu className="text-xl text-gray-900 dark:text-gray-100" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <FiSearch className="text-gray-400 dark:text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm w-48 placeholder-gray-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? (
                <FiMoon className="text-gray-600 dark:text-gray-300" />
              ) : (
                <FiSun className="text-yellow-400" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiBell className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificações</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-primary-500 hover:text-primary-600">Marcar todas como lidas</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma notificação.</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={n.id || `sock-${i}`} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${n.is_read ? 'opacity-70' : ''}`}>
                          <Link
                            href={n.link || '#'}
                            onClick={() => { if (n.id) handleMarkRead(n.id); setNotifOpen(false); }}
                            className="block"
                          >
                            <div className="flex items-start gap-2">
                              {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                                {n.created_at && <p className="text-[10px] text-gray-400 mt-0.5">{formatNotifDate(n.created_at)}</p>}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-primary-500" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                  {user?.name}
                </span>
                <FiChevronDown
                  className={`hidden sm:block text-gray-400 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <FiLogOut />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-blue-50/50 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  );
}
