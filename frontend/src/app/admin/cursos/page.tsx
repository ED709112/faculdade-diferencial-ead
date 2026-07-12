'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiMoreVertical,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiBook,
  FiBookOpen,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  image: string;
  teacher_name: string;
  category_name: string;
  price: number;
  status: 'published' | 'draft' | 'archived';
  enrollment_count: number;
  featured: number;
}

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: 'Publicado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  draft: { label: 'Rascunho', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  archived: { label: 'Arquivado', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' },
};

export default function AdminCursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/courses', { params });
      setCourses(data.data || data.courses || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch {
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleToggleFeatured = async (id: number) => {
    try {
      await api.put(`/courses/${id}/featured`);
      toast.success('Status de destaque atualizado');
      fetchCourses();
    } catch {
      toast.error('Erro ao atualizar destaque');
    }
  };

  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await api.put(`/courses/${id}`, { status });
      toast.success('Status atualizado com sucesso');
      fetchCourses();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${title}"?`)) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Curso excluído com sucesso');
      fetchCourses();
    } catch {
      toast.error('Erro ao excluir curso');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie todos os cursos da plataforma</p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          <FiBook className="text-lg" /> Novo Curso
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título do curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          {(['all', 'published', 'draft', 'archived'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Todos' : statusLabels[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading fullScreen={false} text="Carregando cursos..." />
      ) : courses.length === 0 ? (
        <EmptyState icon={<FiBookOpen />} title="Nenhum curso encontrado" description="Ajuste os filtros ou crie um novo curso." action={{ label: 'Ver cursos no professor', href: '/professor/cursos' }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Curso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Professor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Preço</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Alunos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{course.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {course.image ? (
                            <img src={course.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">IMG</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{course.title}</p>
                          {course.featured === 1 && (
                            <span className="inline-flex items-center gap-1 text-xs text-secondary-500 font-medium">
                              <FiStar className="text-[10px]" /> Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{course.teacher_name}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                        {course.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      R$ {course.price.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${statusLabels[course.status]?.className}`}>
                        {statusLabels[course.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{course.enrollment_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/cursos/editar/${course.id}`}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 className="text-sm" />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id, course.title)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiMoreVertical className="text-gray-500" />
                          </button>
                          {openMenuId === course.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                <Link
                                  href={`/professor/curso/${course.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <FiEdit2 className="text-xs" /> Editar
                                </Link>
                                <button
                                  onClick={() => { handleToggleFeatured(course.id); setOpenMenuId(null); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <FiStar className="text-xs" /> {course.featured === 1 ? 'Remover destaque' : 'Destacar'}
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                {course.status !== 'published' && (
                                  <button
                                    onClick={() => { handleChangeStatus(course.id, 'published'); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full text-left"
                                  >
                                    <FiArrowUp className="text-xs" /> Publicar
                                  </button>
                                )}
                                {course.status === 'published' && (
                                  <button
                                    onClick={() => { handleChangeStatus(course.id, 'archived'); setOpenMenuId(null); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 w-full text-left"
                                  >
                                    <FiArrowDown className="text-xs" /> Arquivar
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  onClick={() => { handleDelete(course.id, course.title); setOpenMenuId(null); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <FiTrash2 className="text-xs" /> Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}


