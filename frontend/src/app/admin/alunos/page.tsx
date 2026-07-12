'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiX,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiUsers,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  enrollments_count: number;
  created_at: string;
  enrollments?: { id: number; course: { title: string }; status: string; enrolled_at: string }[];
}

export default function AdminAlunosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { role: 'student', page, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setStudents(data.users || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleViewDetails = async (student: Student) => {
    setDetailLoading(true);
    setShowModal(true);
    try {
      const { data } = await api.get(`/admin/users/${student.id}`);
      setSelectedStudent({ ...student, ...data });
    } catch {
      setSelectedStudent(student);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const label = newStatus === 'active' ? 'ativar' : 'desativar';
    if (!confirm(`Tem certeza que deseja ${label} este aluno?`)) return;
    try {
      await api.patch(`/admin/users/${id}`, { status: newStatus });
      toast.success(`Aluno ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      fetchStudents();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
        <p className="text-sm text-gray-500 mt-1">Visualize e gerencie todos os alunos da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading fullScreen={false} text="Carregando alunos..." />
      ) : students.length === 0 ? (
        <EmptyState icon={<FiUsers />} title="Nenhum aluno encontrado" description="Ajuste os filtros para encontrar alunos." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Matrículas</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Cadastro</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{student.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
                          {student.avatar ? (
                            <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-primary-600">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{student.phone || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <FiBook className="text-xs text-gray-400" /> {student.enrollments_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          title="Ver detalhes"
                        >
                          <FiEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.status === 'active'
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                              : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'
                          }`}
                          title={student.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          {student.status === 'active' ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
                        </button>
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

      {/* Student Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Aluno</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8"><Loading fullScreen={false} text="Carregando..." /></div>
            ) : selectedStudent ? (
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden">
                    {selectedStudent.avatar ? (
                      <img src={selectedStudent.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-primary-600">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiPhone className="text-gray-400" /> {selectedStudent.phone || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="text-gray-400" /> {formatDate(selectedStudent.created_at)}
                  </div>
                </div>

                {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Matrículas</h4>
                    <div className="space-y-2">
                      {selectedStudent.enrollments.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{e.course.title}</p>
                            <p className="text-xs text-gray-500">{formatDate(e.enrolled_at)}</p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              e.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {e.status === 'active' ? 'Ativa' : 'Concluída'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}


