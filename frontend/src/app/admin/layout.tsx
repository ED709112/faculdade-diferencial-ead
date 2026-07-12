'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Loading from '@/components/ui/Loading';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) return <Loading text="Carregando painel administrativo..." />;
  if (!isAuthenticated || !isAdmin) return null;

  return (
    <DashboardLayout role="admin" title="Painel Administrativo">
      {children}
    </DashboardLayout>
  );
}
