'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiBookOpen,
  FiUsers,
  FiDollarSign,
  FiStar,
  FiPlus,
  FiArrowRight,
  FiClock,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

interface RecentEnrollment {
  id: number;
  student: {
    name: string;
    avatar?: string;
    email: string;
  };
  course: {
    title: string;
  };
  enrolled_at: string;
  progress: number;
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrollments, setEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/teacher/dashboard');
      setStats({
        totalCourses: data.totalCourses ?? data.total_courses ?? 0,
        totalStudents: data.totalStudents ?? data.total_students ?? 0,
        totalRevenue: data.totalRevenue ?? data.total_revenue ?? 0,
        averageRating: data.averageRating ?? data.average_rating ?? 0,
      });
      setEnrollments(data.recentEnrollments ?? data.recent_enrollments ?? []);
    } catch {
      setStats({ totalCourses: 0, totalStudents: 0, totalRevenue: 0, averageRating: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading) return <Loading text="Carregando dashboard..." />;

  const statCards = [
    {
      title: 'Total de Cursos',
      value: stats?.totalCourses ?? 0,
      icon: FiBookOpen,
      color: 'bg-primary-50 text-primary-500',
      iconBg: 'bg-primary-100',
    },
    {
      title: 'Total de Alunos',
      value: stats?.totalStudents ?? 0,
      icon: FiUsers,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: FiDollarSign,
      color: 'bg-secondary-50 text-secondary-500',
      iconBg: 'bg-secondary-100',
    },
    {
      title: 'Avaliação Média',
      value: (stats?.averageRating ?? 0).toFixed(1),
      icon: FiStar,
      color: 'bg-yellow-50 text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`text-xl ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/professor/alunos"
          className="flex items-center gap-4 bg-white rounded-xl shadow-md p-5 hover:shadow-lg hover:border-primary-200 border border-transparent transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center group-hover:bg-secondary-500 transition-colors">
            <FiUsers className="text-xl text-secondary-500 group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-secondary-500 transition-colors">Ver Alunos</h3>
            <p className="text-sm text-gray-500">Acompanhe seus alunos matriculados</p>
          </div>
          <FiArrowRight className="text-gray-300 group-hover:text-secondary-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Matrículas Recentes</h2>
          </div>
          <Link href="/professor/alunos" className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            Ver todos <FiArrowRight />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <FiUsers className="text-3xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma matrícula recente encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {enrollment.student.avatar ? (
                    <img
                      src={enrollment.student.avatar}
                      alt={enrollment.student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-primary-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{enrollment.student.name}</p>
                  <p className="text-xs text-gray-500 truncate">{enrollment.course.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <FiClock className="text-gray-400" />
                    {formatDate(enrollment.enrolled_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary-500"
                        style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{Math.round(enrollment.progress)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
