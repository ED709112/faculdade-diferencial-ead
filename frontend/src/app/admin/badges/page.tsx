'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiStar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiAward,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  points: number;
  is_active: number;
  awarded_count: number;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Badge | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '', criteria: '', points: 0 });

  const fetchBadges = useCallback(async () => {
    try {
      const { data } = await api.get('/badges/admin/all');
      setBadges(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '', criteria: '', points: 0 });
    setModalOpen(true);
  };

  const openEdit = (badge: Badge) => {
    setEditing(badge);
    setForm({ name: badge.name, description: badge.description || '', icon: badge.icon || '', criteria: badge.criteria || '', points: badge.points });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/badges/${editing.id}`, form);
        toast.success('Badge atualizada');
      } else {
        await api.post('/badges/admin', form);
        toast.success('Badge criada');
      }
      setModalOpen(false);
      fetchBadges();
    } catch {
      toast.error('Erro ao salvar badge');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta badge?')) return;
    try {
      await api.delete(`/badges/${id}`);
      toast.success('Badge removida');
      fetchBadges();
    } catch {
      toast.error('Erro ao remover badge');
    }
  };

  if (loading) return <Loading text="Carregando badges..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Badges</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie as badges de gamificação</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Nova Badge
        </button>
      </div>

      {badges.length === 0 ? (
        <EmptyState
          icon={<FiStar />}
          title="Nenhuma badge encontrada"
          description="Crie a primeira badge de gamificação."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white rounded-xl shadow-sm p-5 border-2 ${
                badge.is_active ? 'border-transparent hover:border-primary-200' : 'border-gray-100 opacity-60'
              } transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">
                  {badge.icon || '⭐'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(badge)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-500">
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button onClick={() => handleDelete(badge.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500">
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{badge.name}</h4>
              <p className="text-xs text-gray-500 mb-3">{badge.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary-600 font-medium">+{badge.points} pts</span>
                <span className="text-gray-400 flex items-center gap-1">
                  <FiAward className="text-xs" /> {badge.awarded_count} concedidas
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100">
              <FiX className="text-lg" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-5">{editing ? 'Editar Badge' : 'Nova Badge'}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Ex: Primeiro Passo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Ex: Completou a primeira aula"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="🚀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pontos</label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Critério</label>
                <textarea
                  rows={2}
                  value={form.criteria}
                  onChange={(e) => setForm({ ...form, criteria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Descreva como o aluno conquista esta badge"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600">
                {editing ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
