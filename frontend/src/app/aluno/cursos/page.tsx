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
  course: {
    id: number;
    title: string;
    slug: string;
    image?: string;
    teacher_name: string;
    workload: number;
  };
  progress: number;
  completed: boolean;
  last_accessed: string;
  enrolled_at: string;
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
      setEnrollments(data.enrollments || data.data || data);
      setTotalPages(data.totalPages || data.meta?.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Cursos</h2>
          <p className="text-gray-500 text-sm mt-1">
            Acompanhe seu progresso e continue aprendendo
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <FiFilter className="text-gray-400 ml-2" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
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

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {enrollments.map((enrollment) => (
          <Link
            key={enrollment.id}
            href={`/aluno/curso/${enrollment.course.id}`}
            className="card group"
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
              {enrollment.course.image ? (
                <img
                  src={enrollment.course.image}
                  alt={enrollment.course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-primary-500 text-4xl font-bold">
                    {enrollment.course.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Progress Badge */}
              <div className="absolute top-3 right-3 w-12 h-12">
                <CircularProgressbar
                  value={enrollment.progress}
                  text={`${Math.round(enrollment.progress)}%`}
                  styles={buildStyles({
                    textSize: '28px',
                    textColor: '#fff',
                    pathColor:
                      enrollment.progress >= 100 ? '#16a34a' : '#1a56db',
                    trailColor: 'rgba(255,255,255,0.3)',
                    pathTransitionDuration: 1,
                  })}
                />
              </div>

              {enrollment.completed && (
                <div className="absolute top-3 left-3 badge-success">
                  <FiCheckCircle className="mr-1" /> Concluído
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-500 transition-colors">
                {enrollment.course.title}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                por {enrollment.course.teacher_name}
              </p>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(enrollment.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      enrollment.progress >= 100 ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <FiClock />
                  <span>{enrollment.course.workload}h</span>
                </div>
                <span>Último acesso: {formatDate(enrollment.last_accessed)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
