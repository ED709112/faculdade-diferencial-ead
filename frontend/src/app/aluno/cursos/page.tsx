'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiBookOpen, FiClock, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface Enrollment {
  id: number;
  course_id: number;
  course_title: string;
  course_slug?: string;
  course_image?: string;
  teacher_name?: string;
  workload?: number;
  progress_percentage: number;
  status: string;
  started_at: string;
  last_accessed_at?: string;
  completed_at?: string;
  category_name?: string;
}

type FilterType = 'all' | 'in_progress' | 'completed';

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 12 };
      if (filter === 'completed') params.completed = 'true';
      if (filter === 'in_progress') params.completed = 'false';

      const { data } = await api.get('/enrollments/my', { params });
      const list = Array.isArray(data) ? data : data.enrollments || data.data || [];
      setEnrollments(list);
      setTotalPages(data.totalPages || data.pagination?.pages || data.meta?.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  useEffect(() => { setPage(1); }, [filter]);

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Em andamento', value: 'in_progress' },
    { label: 'Concluídos', value: 'completed' },
  ];

  if (loading && enrollments.length === 0) {
    return <Loading text="Carregando seus cursos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Cursos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Acompanhe seu progresso e continue aprendendo
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        <FiFilter className="text-gray-400 dark:text-gray-500 ml-2" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && enrollments.length === 0 && (
        <EmptyState
          icon={<FiBookOpen />}
          title="Nenhum curso encontrado"
          description={
            filter === 'all'
              ? 'Você ainda não está matriculado em nenhum curso.'
              : filter === 'completed'
              ? 'Você ainda não concluiu nenhum curso.'
              : 'Todos os seus cursos foram concluídos!'
          }
          action={{ label: 'Explorar Cursos', href: '/cursos' }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {enrollments.map((enrollment) => (
          <Link
            key={enrollment.id}
            href={`/aluno/curso/${enrollment.course_id}`}
            className="card group"
          >
            <div className="relative h-40 overflow-hidden">
              {enrollment.course_image ? (
                <img
                  src={enrollment.course_image}
                  alt={enrollment.course_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-primary-500 text-4xl font-bold">
                    {enrollment.course_title?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 w-12 h-12">
                <CircularProgressbar
                  value={enrollment.progress_percentage || 0}
                  text={`${Math.round(enrollment.progress_percentage || 0)}%`}
                  styles={buildStyles({
                    textSize: '28px',
                    textColor: '#fff',
                    pathColor:
                      (enrollment.progress_percentage || 0) >= 100 ? '#16a34a' : '#1a56db',
                    trailColor: 'rgba(255,255,255,0.3)',
                    pathTransitionDuration: 1,
                  })}
                />
              </div>
              {enrollment.status === 'completed' && (
                <div className="absolute top-3 left-3 badge-success">
                  <FiCheckCircle className="mr-1" /> Concluído
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-primary-500 transition-colors">
                {enrollment.course_title}
              </h3>
              {enrollment.teacher_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  por {enrollment.teacher_name}
                </p>
              )}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(enrollment.progress_percentage || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (enrollment.progress_percentage || 0) >= 100 ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min(enrollment.progress_percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                {enrollment.workload ? (
                  <div className="flex items-center gap-1">
                    <FiClock />
                    <span>{enrollment.workload}h</span>
                  </div>
                ) : <div />}
                <span>Último acesso: {formatDate(enrollment.last_accessed_at || enrollment.started_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
