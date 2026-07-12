'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Loading from '@/components/ui/Loading';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isStudent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isStudent)) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, isStudent, router]);

  if (loading) {
    return <Loading text="Carregando..." />;
  }

  if (!isAuthenticated || !isStudent) {
    return null;
  }

  return (
    <DashboardLayout role="student" title="Área do Aluno">
      {children}
    </DashboardLayout>
  );
}
