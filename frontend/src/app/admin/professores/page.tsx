'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiSearch,
  FiEdit2,
  FiPlus,
  FiX,
  FiUserCheck,
  FiUserX,
  FiBook,
  FiStar,
  FiMail,
  FiPhone,
  FiSave,
  FiUsers,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  courses_count: number;
  average_rating: number;
  created_at: string;
}

export default function AdminProfessoresPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { role: 'teacher', page, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setTeachers(data.users || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '' });
    setEditingTeacher(null);
  };

  const openCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({ name: teacher.name, email: teacher.email, password: '', phone: teacher.phone || '' });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTeacher) {
        const payload: Record<string, any> = { name: formData.name, email: formData.email, phone: formData.phone };
        if (formData.password) payload.password = formData.password;
        await api.put(`/admin/users/${editingTeacher.id}`, payload);
        toast.success('Professor atualizado com sucesso');
      } else {
        await api.post('/admin/users', { ...formData, role: 'teacher' });
        toast.success('Professor criado com sucesso');
      }
      setShowCreateModal(false);
      resetForm();
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar professor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${id}`, { status: newStatus });
      toast.success(`Professor ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
      fetchTeachers();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Professores</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os professores da plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Novo Professor
        </button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      {loading ? (
        <Loading fullScreen={false} text="Carregando professores..." />
      ) : teachers.length === 0 ? (
        <EmptyState icon={<FiUsers />} title="Nenhum professor encontrado" description="Adicione um novo professor à plataforma." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Professor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Cursos</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Avaliação</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{teacher.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary-50 flex items-center justify-center overflow-hidden shrink-0">
                          {teacher.avatar ? (
                            <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-secondary-600">
                              {teacher.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
                          <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{teacher.phone || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <FiBook className="text-xs text-gray-400" /> {teacher.courses_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <FiStar className="text-xs text-secondary-400" /> {teacher.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          teacher.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(teacher)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          title="Editar"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            teacher.status === 'active'
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                              : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'
                          }`}
                          title={teacher.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          {teacher.status === 'active' ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
              </h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editingTeacher ? '(deixe vazio para manter)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingTeacher}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <FiSave /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


