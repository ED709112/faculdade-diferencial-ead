'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiStar,
  FiTrendingUp,
  FiPlay,
  FiBarChart2,
  FiXCircle,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface DashboardData {
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    avgProgress: number;
    totalLessonsCompleted: number;
    totalLessons: number;
    totalQuizzes: number;
    passedQuizzes: number;
    avgScore: number;
    bestScore: number;
    certificates: number;
    badges: number;
    points: number;
  };
  weeklyProgress: { day: string; aulas: number }[];
  quizScoreHistory: { prova: string; nota: number; aprovado: number }[];
  courseProgressData: { curso: string; progresso: number }[];
  recentActivity: {
    score: number;
    is_passed: number;
    started_at: string;
    submitted_at: string;
    time_spent_seconds: number;
    quiz_title: string;
    course_title: string;
  }[];
  enrollments: {
    id: number;
    course_id: number;
    course_title: string;
    course_image: string;
    progress: number;
    status: string;
    last_accessed: string;
  }[];
}

const COLORS = ['#f97316', '#1a56db', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AlunoDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: d } = await api.get('/students/dashboard');
        setData(d);
      } catch {
        toast.error('Erro ao carregar dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loading text="Carregando dashboard..." />;
  if (!data) return null;

  const { stats, weeklyProgress, quizScoreHistory, courseProgressData, recentActivity, enrollments } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Painel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acompanhe seu desempenho e progresso nos cursos.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FiBookOpen} label="Cursos Ativos" value={stats.inProgressCourses} color="blue" />
        <StatCard icon={FiCheckCircle} label="Concluídos" value={stats.completedCourses} color="green" />
        <StatCard icon={FiAward} label="Certificados" value={stats.certificates} color="amber" />
        <StatCard icon={FiStar} label="Pontos" value={stats.points} color="purple" />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FiPlay} label="Aulas Assistidas" value={stats.totalLessonsCompleted} suffix={`/ ${stats.totalLessons}`} color="orange" />
        <StatCard icon={FiBarChart2} label="Média Provas" value={`${stats.avgScore}%`} color="indigo" />
        <StatCard icon={FiCheckCircle} label="Provas Aprovadas" value={`${stats.passedQuizzes}/${stats.totalQuizzes}`} color="emerald" />
        <StatCard icon={FiTrendingUp} label="Progresso Médio" value={`${stats.avgProgress}%`} color="rose" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-orange-500" /> Aulas esta Semana
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="aulas" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-blue-500" /> Notas nas Provas
          </h3>
          {quizScoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quizScoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="prova" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="nota" stroke="#1a56db" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Nenhuma prova realizada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Course Progress */}
      {courseProgressData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBookOpen className="text-purple-500" /> Progresso por Curso
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={courseProgressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="curso" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="progresso" radius={[0, 4, 4, 0]}>
                {courseProgressData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity + Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Atividade Recente</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.is_passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {a.is_passed
                      ? <FiCheckCircle className="text-green-600 text-sm" />
                      : <FiXCircle className="text-red-500 text-sm" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.course_title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}>{Math.round(Number(a.score))}%</p>
                    <p className="text-[10px] text-gray-400">{new Date(a.submitted_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma atividade recente.</p>
          )}
        </div>

        {/* Enrollments List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Meus Cursos</h3>
          <div className="space-y-3">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/aluno/curso/${e.course_id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 shrink-0">
                  <CircularProgressbar
                    value={e.progress}
                    text={`${e.progress}%`}
                    styles={buildStyles({
                      textSize: '22px',
                      textColor: e.status === 'completed' ? '#16a34a' : '#f97316',
                      pathColor: e.status === 'completed' ? '#16a34a' : '#f97316',
                      trailColor: '#e5e7eb',
                    })}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.course_title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {e.status === 'completed' ? 'Concluído' : 'Em andamento'}
                  </p>
                </div>
                <FiPlay className="text-gray-400 shrink-0" />
              </Link>
            ))}
            {enrollments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum curso matriculado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon className="text-lg" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}{suffix && <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
