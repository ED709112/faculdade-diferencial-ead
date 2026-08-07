'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  FiBell,
  FiChevronRight,
  FiGift,
  FiCalendar,
  FiArrowRight,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

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
  notifications: {
    id: number;
    title: string;
    message: string;
    type: string;
    link: string;
    is_read: number;
    created_at: string;
  }[];
  unreadNotifications: number;
  badges: {
    id: number;
    name: string;
    description: string;
    icon: string;
    points: number;
    earned_at: string;
  }[];
  badgesCount: number;
  continueLesson: {
    lesson_id: number;
    lesson_title: string;
    content_type: string;
    module_id: number;
    module_title: string;
    course_id: number;
    course_title: string;
  } | null;
  nextSteps: {
    title: string;
    description: string;
    href: string;
    icon: string;
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

const stepIcons: Record<string, React.ElementType> = {
  play: FiPlay,
  book: FiBookOpen,
  award: FiAward,
};

const timeAgo = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return d.toLocaleDateString('pt-BR');
};

export default function AlunoDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
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

  const handleNotificationClick = async (n: DashboardData['notifications'][number]) => {
    if (!n.is_read) {
      try { await api.put(`/notifications/${n.id}/read`); } catch { /* ignore */ }
    }
    if (n.link) router.push(n.link);
  };

  if (loading) return <Loading text="Carregando dashboard..." />;
  if (!data) return null;

  const { stats, weeklyProgress, quizScoreHistory, courseProgressData, recentActivity, enrollments } = data;
  const firstName = user?.name?.split(' ')[0] || 'Aluno';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 text-white p-6 md:p-8">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm text-white/80 capitalize mb-1">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold">Olá, {firstName}! 👋</h1>
            <p className="text-sm text-white/90 mt-2 max-w-lg">
              {data.continueLesson
                ? `Continue de onde parou na aula "${data.continueLesson.lesson_title}".`
                : 'Que bom te ver por aqui! Escolha um curso e continue sua jornada.'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {data.continueLesson ? (
              <Link
                href={`/aluno/curso/${data.continueLesson.course_id}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-5 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                <FiPlay /> Continuar de onde parou
                <FiArrowRight />
              </Link>
            ) : (
              <Link
                href="/aluno/cursos"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-5 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                <FiBookOpen /> Ver meus cursos
                <FiArrowRight />
              </Link>
            )}
          </div>
        </div>
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

      {/* Next steps + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-orange-500" /> Próximos Passos
            </h3>
          </div>
          {data.nextSteps.length > 0 ? (
            <div className="space-y-3">
              {data.nextSteps.map((step, i) => {
                const Icon = stepIcons[step.icon] || FiPlay;
                return (
                  <Link
                    key={i}
                    href={step.href}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <Icon className="text-orange-500 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{step.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{step.description}</p>
                    </div>
                    <FiChevronRight className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma ação pendente. Continue estudando!</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiBell className="text-blue-500" /> Notificações
              {data.unreadNotifications > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  {data.unreadNotifications} novas
                </span>
              )}
            </h3>
          </div>
          {data.notifications.length > 0 ? (
            <div className="space-y-2">
              {data.notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${n.is_read ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                    <FiBell className={`text-sm ${n.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${n.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma notificação.</p>
          )}
        </div>
      </div>

      {/* Badges + Weekly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiGift className="text-purple-500" /> Conquistas
            </h3>
            <Link href="/aluno/conquistas" className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
              Ver todas <FiChevronRight />
            </Link>
          </div>
          {data.badges.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {data.badges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl mb-2">
                      {b.icon || <FiAward />}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">{b.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{b.points} pts</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                {data.badgesCount} conquista(s) no total
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Complete aulas para conquistar badges.</p>
          )}
        </div>

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
      </div>

      {/* Quiz Scores + Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBookOpen className="text-purple-500" /> Progresso por Curso
          </h3>
          {courseProgressData.length > 0 ? (
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
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Nenhum curso em andamento.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity + Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
