'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiFileText,
  FiDownload,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Edital {
  id: number;
  title: string;
  description?: string;
  type: string;
  file_url: string;
  file_name?: string;
  is_active: boolean;
  published_at?: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  edital: 'Edital',
  portaria: 'Portaria',
  resolucao: 'Resolução',
  outro: 'Outro',
};

const typeColors: Record<string, string> = {
  edital: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  portaria: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  resolucao: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  outro: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminEditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Edital | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'edital',
    is_active: true,
    published_at: '',
  });

  useEffect(() => {
    fetchEditais();
  }, []);

  const fetchEditais = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/editais');
      setEditais(data.editais || data.data || data || []);
    } catch {
      toast.error('Erro ao carregar editais');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', type: 'edital', is_active: true, published_at: '' });
    setFile(null);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (edital: Edital) => {
    setFormData({
      title: edital.title,
      description: edital.description || '',
      type: edital.type,
      is_active: edital.is_active,
      published_at: edital.published_at ? edital.published_at.slice(0, 10) : '',
    });
    setEditing(edital);
    setFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (!editing && !file) {
      toast.error('Selecione um arquivo');
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('description', formData.description);
      body.append('type', formData.type);
      body.append('is_active', formData.is_active ? '1' : '0');
      if (formData.published_at) body.append('published_at', formData.published_at);
      if (file) body.append('file', file);

      if (editing) {
        await api.put(`/editais/${editing.id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Edital atualizado com sucesso!');
      } else {
        await api.post('/editais', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Edital criado com sucesso!');
      }
      setShowModal(false);
      resetForm();
      fetchEditais();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar edital');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/editais/${id}`);
      toast.success('Edital removido com sucesso!');
      setDeleteConfirmId(null);
      fetchEditais();
    } catch {
      toast.error('Erro ao remover edital');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editais e Portarias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie os documentos institucionais</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          <FiPlus className="text-lg" />
          Novo Documento
        </button>
      </div>

      {editais.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm">
          <FiFileText className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum documento</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Adicione editais e portarias para exibir na página Instituição.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors">
            <FiPlus /> Adicionar Primeiro
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Título</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Tipo</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Arquivo</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Publicado</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {editais.map((edital) => (
                  <tr key={edital.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{edital.title}</p>
                      {edital.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{edital.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${typeColors[edital.type] || typeColors.outro}`}>
                        {typeLabels[edital.type] || edital.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={edital.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-600 text-xs font-medium"
                      >
                        <FiDownload className="text-sm" />
                        {edital.file_name || 'Arquivo'}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {edital.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          <FiEye className="text-sm" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                          <FiEyeOff className="text-sm" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {edital.published_at ? new Date(edital.published_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(edital)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        {deleteConfirmId === edital.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(edital.id)}
                              className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(edital.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editing ? 'Editar Documento' : 'Novo Documento'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Ex: Portaria nº 001/2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Breve descrição do documento..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="edital">Edital</option>
                    <option value="portaria">Portaria</option>
                    <option value="resolucao">Resolução</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Publicação</label>
                  <input
                    type="date"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Arquivo * {editing && '(deixe vazio para manter o atual)'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG ou PNG — até 20MB</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
                <span className="text-sm text-gray-700 dark:text-gray-300">Ativo (visível na página)</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                <FiSave className="text-sm" />
                {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
