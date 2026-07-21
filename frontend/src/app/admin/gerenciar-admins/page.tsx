'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiX, FiCheck, FiUser } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  admin_level: 'master' | 'limited';
  permissions: string[];
  is_active: number;
  created_at: string;
}

interface Permission {
  key: string;
  label: string;
}

const allPermissions: Permission[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'courses', label: 'Cursos' },
  { key: 'categories', label: 'Categorias' },
  { key: 'teachers', label: 'Professores' },
  { key: 'students', label: 'Alunos' },
  { key: 'enrollments', label: 'Matrículas' },
  { key: 'durations', label: 'Duração dos Cursos' },
  { key: 'coupons', label: 'Cupons' },
  { key: 'products', label: 'Produtos' },
  { key: 'financial', label: 'Financeiro' },
  { key: 'badges', label: 'Badges' },
  { key: 'settings', label: 'Configurações' },
  { key: 'users', label: 'Usuários' },
  { key: 'banners', label: 'Banners' },
  { key: 'news', label: 'Notícias' },
  { key: 'logs', label: 'Logs' },
  { key: 'admin_managers', label: 'Gerenciar Admins' },
];

export default function GerenciarAdminsPage() {
  const { user, isMasterAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    admin_level: 'limited' as 'master' | 'limited',
    permissions: [] as string[],
    is_active: 1,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin' || user.admin_level !== 'master') {
      router.push('/admin');
      return;
    }
    loadAdmins();
  }, [user, authLoading, router]);

  const loadAdmins = async () => {
    try {
      const { data } = await api.get('/admin/admins');
      setAdmins(data);
    } catch {
      toast.error('Erro ao carregar administradores.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', admin_level: 'limited', permissions: [], is_active: 1 });
    setShowModal(true);
  };

  const openEdit = (admin: AdminUser) => {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      admin_level: admin.admin_level,
      permissions: admin.permissions || [],
      is_active: admin.is_active,
    });
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const selectAllPermissions = () => {
    setForm(prev => ({
      ...prev,
      permissions: allPermissions.map(p => p.key),
    }));
  };

  const clearAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          admin_level: form.admin_level,
          permissions: form.admin_level === 'limited' ? form.permissions : [],
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/admins/${editing.id}`, payload);
        toast.success('Administrador atualizado!');
      } else {
        if (!form.password) {
          toast.error('Senha é obrigatória para novo administrador.');
          return;
        }
        await api.post('/admin/admins', {
          name: form.name,
          email: form.email,
          password: form.password,
          admin_level: form.admin_level,
          permissions: form.admin_level === 'limited' ? form.permissions : [],
        });
        toast.success('Administrador criado!');
      }
      setShowModal(false);
      loadAdmins();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este administrador?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      toast.success('Administrador excluído!');
      loadAdmins();
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  if (authLoading || !user || user.role !== 'admin' || user.admin_level !== 'master') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Administradores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Crie e gerencie administradores com acesso restrito</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
          <FiPlus /> Novo Admin
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <FiShield className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum administrador encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nível</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Permissões</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                          <FiUser className="text-primary-500 text-sm" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        admin.admin_level === 'master'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {admin.admin_level === 'master' ? 'Master' : 'Limitado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {admin.admin_level === 'master' ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Acesso total</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {admin.permissions?.length || 0} de {allPermissions.length} abas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        admin.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {admin.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(admin)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors" title="Editar">
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button onClick={() => handleDelete(admin.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Excluir">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editing ? 'Editar Administrador' : 'Novo Administrador'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">{editing ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} {...(!editing && { required: true })} />
              </div>
              <div>
                <label className="label">Nível de Acesso</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, admin_level: 'master' })} className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${form.admin_level === 'master' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                    <FiShield className="mx-auto mb-1" />
                    Master
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, admin_level: 'limited' })} className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${form.admin_level === 'limited' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                    <FiUser className="mx-auto mb-1" />
                    Limitado
                  </button>
                </div>
              </div>

              {form.admin_level === 'limited' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Permissões (Abas)</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllPermissions} className="text-xs text-primary-500 hover:text-primary-600">Selecionar todas</button>
                      <button type="button" onClick={clearAllPermissions} className="text-xs text-gray-400 hover:text-gray-500">Limpar</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                    {allPermissions.map(perm => (
                      <label key={perm.key} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${form.permissions.includes(perm.key) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        <input type="checkbox" checked={form.permissions.includes(perm.key)} onChange={() => togglePermission(perm.key)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{form.permissions.length} permissão(ões) selecionada(s)</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                  <FiCheck />
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
