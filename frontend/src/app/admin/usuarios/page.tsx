'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiEdit2,
  FiPlus,
  FiX,
  FiSave,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  avatar?: string;
  phone?: string;
  created_at: string;
}

type RoleFilter = 'all' | 'admin' | 'teacher' | 'student';

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  teacher: { label: 'Professor', className: 'bg-secondary-50 text-secondary-700 ring-secondary-600/20' },
  student: { label: 'Aluno', className: 'bg-primary-50 text-primary-700 ring-primary-600/20' },
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    phone: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, search]);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'student', phone: '' });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, any> = { name: formData.name, email: formData.email, role: formData.role, phone: formData.phone };
        if (formData.password) payload.password = formData.password;
        await api.put(`/admin/users/${editing.id}`, payload);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await api.post('/admin/users', formData);
        toast.success('Usuário criado com sucesso');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${id}`, { status: newStatus });
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
      fetchUsers();
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie todos os usuários da plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Novo Usuário
        </button>
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
        <div className="flex gap-2 flex-wrap">
          {(['all', 'admin', 'teacher', 'student'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r === 'all' ? 'Todos' : roleConfig[r]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading fullScreen={false} text="Carregando usuários..." />
      ) : users.length === 0 ? (
        <EmptyState icon={<FiUsers />} title="Nenhum usuário encontrado" description="Ajuste os filtros ou crie um novo usuário." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Papel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Cadastro</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{user.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-primary-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${roleConfig[user.role]?.className}`}>
                        {roleConfig[user.role]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          title="Editar"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                              : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'
                          }`}
                          title={user.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          {user.status === 'active' ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
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
                  Senha {editing ? '(deixe vazio para manter)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editing}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Papel *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="student">Aluno</option>
                  <option value="teacher">Professor</option>
                  <option value="admin">Administrador</option>
                </select>
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
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
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


