'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Loading from '@/components/ui/Loading';

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isTeacher } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isTeacher)) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, isTeacher, router]);

  if (loading) {
    return <Loading text="Carregando..." />;
  }

  if (!isAuthenticated || !isTeacher) {
    return null;
  }

  return (
    <DashboardLayout role="teacher" title="Área do Professor">
      {children}
    </DashboardLayout>
  );
}
