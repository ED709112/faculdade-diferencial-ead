'use client';

import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiBook,
  FiDollarSign,
  FiUserPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiArrowRight,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import Link from 'next/link';

interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  totalRevenue: number;
  newStudentsMonth: number;
  studentsChange: number;
  coursesChange: number;
  revenueChange: number;
  newStudentsChange: number;
  coursesByStatus: { status: string; count: number; color: string }[];
  recentActivity: {
    id: number;
    icon: string;
    color: string;
    message: string;
    time: string;
  }[];
  enrollmentTrends: { month: string; enrollments: number; completions: number }[];
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

const defaultRevenue: RevenueData[] = [];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>(defaultRevenue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, revenueRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/revenue-chart'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (revenueRes.status === 'fulfilled') setRevenue(revenueRes.value.data);
    } catch {
      // use fallback data
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Carregando dashboard..." />;

  const statsCards = [
    {
      label: 'Total Alunos',
      value: stats?.totalStudents ?? 1247,
      change: stats?.studentsChange ?? 12,
      icon: FiUsers,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
    },
    {
      label: 'Cursos Ativos',
      value: stats?.activeCourses ?? 48,
      change: stats?.coursesChange ?? 5,
      icon: FiBook,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Receita Total',
      value: `R$ ${(stats?.totalRevenue ?? 285000).toLocaleString('pt-BR')}`,
      change: stats?.revenueChange ?? 18,
      icon: FiDollarSign,
      color: 'bg-secondary-500',
      bgColor: 'bg-secondary-50',
    },
    {
      label: 'Novos Alunos (Mês)',
      value: stats?.newStudentsMonth ?? 89,
      change: stats?.newStudentsChange ?? -3,
      icon: FiUserPlus,
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
    },
  ];

  const fallbackRevenue: RevenueData[] = [
    { month: 'Jan', revenue: 18500, expenses: 8200 },
    { month: 'Fev', revenue: 22300, expenses: 9100 },
    { month: 'Mar', revenue: 19800, expenses: 7900 },
    { month: 'Abr', revenue: 25400, expenses: 10300 },
    { month: 'Mai', revenue: 23100, expenses: 8700 },
    { month: 'Jun', revenue: 28700, expenses: 11200 },
    { month: 'Jul', revenue: 26500, expenses: 9800 },
    { month: 'Ago', revenue: 31200, expenses: 12100 },
    { month: 'Set', revenue: 29800, expenses: 10500 },
    { month: 'Out', revenue: 33500, expenses: 11800 },
    { month: 'Nov', revenue: 35200, expenses: 12600 },
    { month: 'Dez', revenue: 38100, expenses: 13200 },
  ];

  const chartData = revenue.length > 0 ? revenue : fallbackRevenue;

  const fallbackActivity = [
    { id: 1, icon: 'FiUserPlus', color: 'text-emerald-500', message: 'Maria Silva se inscreveu no curso de Administração', time: '2 min atrás' },
    { id: 2, icon: 'FiBook', color: 'text-primary-500', message: 'Prof. João publicou a aula "Introdução ao Marketing"', time: '15 min atrás' },
    { id: 3, icon: 'FiDollarSign', color: 'text-secondary-500', message: 'Pagamento de R$ 197,00 recebido de Pedro Santos', time: '1 hora atrás' },
    { id: 4, icon: 'FiUsers', color: 'text-violet-500', message: 'Turma de Direito atingiu 50 alunos inscritos', time: '2 horas atrás' },
    { id: 5, icon: 'FiBook', color: 'text-emerald-500', message: 'Curso "Finanças Corporativas" foi publicado', time: '3 horas atrás' },
    { id: 6, icon: 'FiUserPlus', color: 'text-primary-500', message: 'Ana Costa se inscreveu no curso de Psicologia', time: '5 horas atrás' },
  ];

  const activityIcons: Record<string, any> = {
    FiUserPlus: FiUserPlus,
    FiBook: FiBook,
    FiDollarSign: FiDollarSign,
    FiUsers: FiUsers,
  };

  const activity = stats?.recentActivity ?? fallbackActivity;

  const fallbackCoursesByStatus = [
    { status: 'Publicados', count: 32, color: '#10b981' },
    { status: 'Rascunho', count: 12, color: '#f59e0b' },
    { status: 'Arquivados', count: 4, color: '#6b7280' },
  ];

  const fallbackTrends = [
    { month: 'Jan', enrollments: 45, completions: 12 },
    { month: 'Fev', enrollments: 52, completions: 18 },
    { month: 'Mar', enrollments: 48, completions: 15 },
    { month: 'Abr', enrollments: 61, completions: 22 },
    { month: 'Mai', enrollments: 58, completions: 25 },
    { month: 'Jun', enrollments: 73, completions: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.bgColor} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <card.icon className={`text-xl ${card.color.replace('bg-', 'text-')}`} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  card.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {card.change >= 0 ? (
                  <FiTrendingUp className="text-xs" />
                ) : (
                  <FiTrendingDown className="text-xs" />
                )}
                {Math.abs(card.change)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Receita Mensal</h2>
            <p className="text-sm text-gray-500">Últimos 12 meses</p>
          </div>
          <Link
            href="/admin/financeiro"
            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Ver detalhes <FiArrowRight />
          </Link>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Receita" fill="#1a56db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {activity.map((item) => {
              const IconComp = activityIcons[item.icon] || FiClock;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`${item.color} w-9 h-9 rounded-full bg-opacity-10 flex items-center justify-center shrink-0`}
                    style={{ backgroundColor: `${item.color === 'text-emerald-500' ? '#ecfdf5' : item.color === 'text-primary-500' ? '#eff6ff' : item.color === 'text-secondary-500' ? '#fff7ed' : '#f5f3ff'}` }}
                  >
                    <IconComp className={`text-sm ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Courses by Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cursos por Status</h2>
            <div className="space-y-3">
              {(stats?.coursesByStatus ?? fallbackCoursesByStatus).map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.status}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.count / Math.max(...(stats?.coursesByStatus ?? fallbackCoursesByStatus).map((s) => s.count), 1)) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment Trends */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Matrículas</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.enrollmentTrends ?? fallbackTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="enrollments" name="Matrículas" stroke="#1a56db" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="completions" name="Conclusões" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
