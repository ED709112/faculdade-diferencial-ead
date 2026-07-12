'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiMenu,
  FiTag,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  course_count: number;
  order: number;
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories((data.categories || data.data || data || []).map((c: any, i: number) => ({
        ...c,
        course_count: c.course_count ?? c.courses_count ?? 0,
        order: c.order ?? i,
      })));
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormData({ name: cat.name, description: cat.description || '', icon: cat.icon || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, formData);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/categories', formData);
        toast.success('Categoria criada com sucesso');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria excluída com sucesso');
      setDeleteConfirmId(null);
      fetchCategories();
    } catch {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (dragId === null || dragId === targetId) return;

    const dragIndex = categories.findIndex((c) => c.id === dragId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);
    if (dragIndex === -1 || targetIndex === -1) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setCategories(reordered.map((c, i) => ({ ...c, order: i })));

    try {
      await api.put('/categories/reorder', {
        order: reordered.map((c, i) => ({ id: c.id, order: i })),
      });
      toast.success('Ordem atualizada');
    } catch {
      toast.error('Erro ao reordenar');
      fetchCategories();
    }
    setDragId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h1>
          <p className="text-sm text-gray-500 mt-1">Organize os cursos por categoria</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Nova Categoria
        </button>
      </div>

      {loading ? (
        <Loading fullScreen={false} text="Carregando categorias..." />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<FiTag />}
          title="Nenhuma categoria encontrada"
          description="Crie categorias para organizar seus cursos."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cat.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cat.id)}
                className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50/50 transition-colors cursor-move ${
                  dragId === cat.id ? 'opacity-50' : ''
                }`}
              >
                <FiMenu className="text-gray-300 shrink-0 cursor-grab" />
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  {cat.icon ? (
                    <span className="text-lg">{cat.icon}</span>
                  ) : (
                    <FiTag className="text-primary-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500 shrink-0">
                  {cat.course_count} {cat.course_count === 1 ? 'curso' : 'cursos'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                    title="Editar"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  {deleteConfirmId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600"
                      title="Excluir"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                {editing ? 'Editar Categoria' : 'Nova Categoria'}
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
                  placeholder="Ex: Administração"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Descrição curta da categoria..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="📚"
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
