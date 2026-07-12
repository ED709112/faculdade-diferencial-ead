'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiMail,
  FiClock,
  FiBookOpen,
  FiChevronRight,
  FiX,
  FiUser,
  FiCheckCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface CourseOption {
  id: number;
  title: string;
}

interface Student {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    id: number;
    title: string;
  };
  progress: number;
  last_accessed?: string;
  enrolled_at: string;
  completed: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (courseFilter) params.course_id = courseFilter;
      if (search) params.search = search;

      const { data } = await api.get('/teacher/students', { params });
      setStudents(data.students || data.data || data);
      setTotalPages(data.totalPages || data.meta?.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, courseFilter, search]);

  useEffect(() => {
    api.get('/teacher/courses', { params: { limit: 100 } })
      .then(({ data }) => setCourses(data.courses || data.data || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [courseFilter, search]);

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const progressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-primary-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading && students.length === 0) {
    return <Loading text="Carregando alunos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meus Alunos</h2>
        <p className="text-gray-500 text-sm mt-1">Acompanhe o progresso dos alunos nos seus cursos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <FiFilter className="text-gray-400 ml-2" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-transparent border-none outline-none text-sm font-medium text-gray-600 pr-2 cursor-pointer"
          >
            <option value="">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <EmptyState
          icon={<FiUsers />}
          title="Nenhum aluno encontrado"
          description={
            courseFilter || search
              ? 'Nenhum aluno encontrado com os filtros aplicados.'
              : 'Você ainda não possui alunos matriculados nos seus cursos.'
          }
        />
      )}

      {/* Students List */}
      {students.length > 0 && (
        <div className="space-y-3">
          {students.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedStudent(s)}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                {s.student.avatar ? (
                  <img src={s.student.avatar} alt={s.student.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-primary-500 text-xl" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{s.student.name}</h3>
                  {s.completed && (
                    <span className="badge-success text-xs">
                      <FiCheckCircle className="mr-1" /> Concluído
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiMail className="text-gray-400" /> {s.student.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiBookOpen className="text-gray-400" /> {s.course.title}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="w-32">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span className="font-medium">{Math.round(s.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${progressColor(s.progress)}`}
                      style={{ width: `${Math.min(s.progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-right hidden lg:block">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FiClock className="text-gray-400" />
                    {formatDate(s.last_accessed)}
                  </div>
                </div>

                <FiChevronRight className="text-gray-300 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Detalhes do Aluno</h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedStudent.student.avatar ? (
                    <img src={selectedStudent.student.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-primary-500 text-2xl" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedStudent.student.name}</h4>
                  <p className="text-sm text-gray-500">{selectedStudent.student.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiBookOpen className="text-primary-500" />
                    <span className="font-medium">{selectedStudent.course.title}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso do curso</span>
                    <span className="font-semibold">{Math.round(selectedStudent.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${progressColor(selectedStudent.progress)}`}
                      style={{ width: `${Math.min(selectedStudent.progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Matriculado em</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedStudent.enrolled_at)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Último Acesso</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedStudent.last_accessed)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`text-sm font-semibold ${selectedStudent.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedStudent.completed ? 'Concluído' : 'Em andamento'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
