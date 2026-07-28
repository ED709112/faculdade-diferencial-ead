'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin, FiX, FiUser, FiPhone, FiMail, FiCheck, FiXCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

interface Polo {
  id: number;
  name: string;
  city: string;
  state: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_email: string;
  coordinator_pix: string;
  coordinator_bank_info: string;
  is_active: number;
  created_at: string;
}

const emptyForm = {
  name: '', city: '', state: '', coordinator_name: '',
  coordinator_phone: '', coordinator_email: '', coordinator_pix: '',
  coordinator_bank_info: '', is_active: 1,
};

export default function AdminPolosPage() {
  const [polos, setPolos] = useState<Polo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/polos');
      setPolos(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error('Erro ao carregar polos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Polo) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      city: p.city || '',
      state: p.state || '',
      coordinator_name: p.coordinator_name || '',
      coordinator_phone: p.coordinator_phone || '',
      coordinator_email: p.coordinator_email || '',
      coordinator_pix: p.coordinator_pix || '',
      coordinator_bank_info: p.coordinator_bank_info || '',
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome do polo e obrigatorio'); return; }
    if (!form.city.trim()) { toast.error('Cidade e obrigatoria'); return; }
    if (!form.state) { toast.error('UF e obrigatoria'); return; }
    if (!form.coordinator_name.trim()) { toast.error('Nome do coordenador e obrigatorio'); return; }

    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), city: form.city.trim(), coordinator_name: form.coordinator_name.trim() };

      if (editingId) {
        await api.put(`/polos/${editingId}`, payload);
        toast.success('Polo atualizado!');
      } else {
        await api.post('/polos', payload);
        toast.success('Polo criado!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar polo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este polo?')) return;
    try {
      await api.delete(`/polos/${id}`);
      setPolos(polos.filter(p => p.id !== id));
      toast.success('Polo excluido!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir polo');
    }
  };

  const toggleActive = async (p: Polo) => {
    try {
      await api.put(`/polos/${p.id}`, { is_active: p.is_active ? 0 : 1 });
      setPolos(polos.map(x => x.id === p.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x));
      toast.success(p.is_active ? 'Polo desativado' : 'Polo ativado');
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const filtered = polos.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.coordinator_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Carregando polos..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie as cidades/polos onde os cursos sao ofertados</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Novo Polo
        </button>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <FiSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade ou coordenador..."
          className="flex-1 outline-none text-sm"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar Polo' : 'Novo Polo'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Polo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Polo Teresina Centro"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cidade *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="Ex: Teresina"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">UF *</label>
                <select
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="">Selecione</option>
                  {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FiUser className="text-primary-500" /> Coordenador(a)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={form.coordinator_name}
                  onChange={e => setForm({ ...form, coordinator_name: e.target.value })}
                  placeholder="Nome do coordenador"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.coordinator_phone}
                  onChange={e => setForm({ ...form, coordinator_phone: e.target.value })}
                  placeholder="(86) 99999-0000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={form.coordinator_email}
                  onChange={e => setForm({ ...form, coordinator_email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={form.coordinator_pix}
                  onChange={e => setForm({ ...form, coordinator_pix: e.target.value })}
                  placeholder="Chave PIX para pagamentos"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Dados Bancarios</label>
                <textarea
                  value={form.coordinator_bank_info}
                  onChange={e => setForm({ ...form, coordinator_bank_info: e.target.value })}
                  placeholder="Banco, Agencia, Conta, Titular..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active === 1}
                    onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Polo ativo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiMapPin />}
          title="Nenhum polo cadastrado"
          description="Cadastre polos (cidades) para vincular aos cursos."
          action={{ label: 'Criar Primeiro Polo', href: '#', onClick: openNew }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Polo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Cidade/UF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Coordenador</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Contato</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700">{p.city}/{p.state}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-700">{p.coordinator_name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      {p.coordinator_phone && (
                        <span className="text-gray-500 text-xs flex items-center gap-1"><FiPhone className="text-[10px]" /> {p.coordinator_phone}</span>
                      )}
                      {p.coordinator_email && (
                        <span className="text-gray-500 text-xs flex items-center gap-1"><FiMail className="text-[10px]" /> {p.coordinator_email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {p.is_active ? <><FiCheck className="text-[10px]" /> Ativo</> : <><FiXCircle className="text-[10px]" /> Inativo</>}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                        title="Editar"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Excluir"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
