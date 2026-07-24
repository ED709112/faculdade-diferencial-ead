'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiBook, FiClock, FiX,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Discipline {
  id: number;
  name: string;
  workload: number;
  status: string;
  materials_count?: number;
}

export default function AdminDisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', workload: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/course-disciplines/disciplines');
      setDisciplines(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error('Erro ao carregar disciplinas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', workload: '' });
    setShowForm(true);
  };

  const openEdit = (d: Discipline) => {
    setEditingId(d.id);
    setForm({ name: d.name, workload: d.workload?.toString() || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da disciplina é obrigatório');
      return;
    }
    try {
      const payload = { name: form.name.trim(), workload: parseInt(form.workload) || 0 };

      if (editingId) {
        const { data } = await api.put(`/admin/course-disciplines/disciplines/${editingId}`, payload);
        setDisciplines(disciplines.map(d => d.id === editingId ? { ...d, ...data } : d));
        toast.success('Disciplina atualizada!');
      } else {
        const { data } = await api.post('/admin/course-disciplines/disciplines', payload);
        setDisciplines([...disciplines, data]);
        toast.success('Disciplina criada!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', workload: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar disciplina');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta disciplina?')) return;
    try {
      await api.delete(`/admin/course-disciplines/disciplines/${id}`);
      setDisciplines(disciplines.filter(d => d.id !== id));
      toast.success('Disciplina excluída!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir disciplina');
    }
  };

  const filtered = disciplines.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Carregando disciplinas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre as disciplinas disponíveis para vincular aos cursos</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Nova Disciplina
        </button>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <FiSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar disciplina..."
          className="flex-1 outline-none text-sm"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nome da disciplina"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              autoFocus
            />

            <input
              type="number"
              value={form.workload}
              onChange={e => setForm({ ...form, workload: e.target.value })}
              placeholder="Carga horária (horas)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              min="0"
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-xl hover:bg-primary-600"
              >
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiBook />}
          title="Nenhuma disciplina cadastrada"
          description="Crie disciplinas para poder vinculá-las aos cursos."
          action={{ label: 'Criar Primeira Disciplina', href: '#', onClick: openNew }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Disciplina</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Carga Horária</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{d.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <FiClock className="text-xs text-gray-400" /> {d.workload || 0}h
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                        title="Editar"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
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
