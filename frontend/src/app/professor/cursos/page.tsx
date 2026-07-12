'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiBookOpen,
  FiPlus,
  FiEdit2,
  FiUsers,
  FiTrash2,
  FiMoreVertical,
  FiClock,
  FiDollarSign,
  FiEye,
  FiGrid,
  FiList,
  FiFilter,
} from 'react-icons/fi';
import api from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  slug: string;
  image?: string;
  status: 'published' | 'draft' | 'archived';
  price: number;
  workload: number;
  enrollment_count?: number;
  enrollments_count?: number;
  average_rating?: number;
  created_at: string;
}

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await api.get('/teacher/courses', { params });
      setCourses(data.courses || data.data || data);
      setTotalPages(data.totalPages || data.meta?.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Curso excluído com sucesso!');
      fetchCourses();
    } catch {
      toast.error('Erro ao excluir curso.');
    }
    setMenuOpen(null);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusConfig: Record<string, { label: string; class: string }> = {
    published: { label: 'Publicado', class: 'badge-success' },
    draft: { label: 'Rascunho', class: 'badge-warning' },
    archived: { label: 'Arquivado', class: 'badge bg-gray-100 text-gray-600' },
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Publicados', value: 'published' },
    { label: 'Rascunhos', value: 'draft' },
    { label: 'Arquivados', value: 'archived' },
  ];

  if (loading && courses.length === 0) {
    return <Loading text="Carregando seus cursos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Cursos</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie os cursos que você ministra</p>
        </div>
        <Link
          href="/professor/curso/novo"
          className="btn-primary flex items-center gap-2 w-fit text-sm"
        >
          <FiPlus /> Novo Curso
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <FiFilter className="text-gray-400 ml-2" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-500'}`}
          >
            <FiGrid />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-500'}`}
          >
            <FiList />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <EmptyState
          icon={<FiBookOpen />}
          title="Nenhum curso encontrado"
          description={
            statusFilter === 'all'
              ? 'Você ainda não criou nenhum curso.'
              : 'Nenhum curso encontrado com este filtro.'
          }
          action={{ label: 'Criar Primeiro Curso', href: '/professor/curso/novo' }}
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                {course.image ? (
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <span className="text-primary-500 text-5xl font-bold">{course.title.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={statusConfig[course.status]?.class || 'badge-info'}>
                    {statusConfig[course.status]?.label || course.status}
                  </span>
                </div>

                {/* Actions menu */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === course.id ? null : course.id)}
                      className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
                      <FiMoreVertical className="text-gray-600" />
                    </button>
                    {menuOpen === course.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          <Link
                            href={`/professor/curso/${course.id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEdit2 className="text-gray-400" /> Editar
                          </Link>
                          <Link
                            href={`/aluno/curso/${course.slug || course.id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEye className="text-gray-400" /> Ver Alunos
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                          >
                            <FiTrash2 /> Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">{course.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiClock className="text-gray-400" />
                    <span>{course.workload}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiDollarSign className="text-gray-400" />
                    <span>{formatCurrency(course.price)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiUsers className="text-gray-400" />
                    <span>{course.enrollment_count ?? course.enrollments_count ?? 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/professor/curso/${course.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-500 text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    <FiEdit2 /> Editar
                  </Link>
                  <Link
                    href={`/aluno/curso/${course.slug || course.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <FiEye />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && courses.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th>Curso</th>
                <th>Status</th>
                <th>Carga Horária</th>
                <th>Preço</th>
                <th>Alunos</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <span className="text-primary-500 font-bold text-sm">{course.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[250px]">{course.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className={statusConfig[course.status]?.class || 'badge-info'}>
                      {statusConfig[course.status]?.label || course.status}
                    </span>
                  </td>
                  <td>{course.workload}h</td>
                  <td>{formatCurrency(course.price)}</td>
                  <td>{course.enrollment_count ?? course.enrollments_count ?? 0}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/professor/curso/${course.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-500 transition-colors"
                      >
                        <FiEdit2 />
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
