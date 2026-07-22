'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiImage,
  FiEye,
  FiEyeOff,
  FiFileText,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  image_url?: string;
  is_active: boolean;
  published_at?: string;
  created_at: string;
}

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    is_active: true,
    published_at: '',
  });

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/news');
      setNews(data.news || data.data || data || []);
    } catch {
      toast.error('Erro ao carregar notícias');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', summary: '', content: '', is_active: true, published_at: '' });
    setImageFile(null);
    setImagePreview('');
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (item: NewsItem) => {
    setFormData({
      title: item.title,
      summary: item.summary || '',
      content: item.content || '',
      is_active: item.is_active,
      published_at: item.published_at ? item.published_at.slice(0, 10) : '',
    });
    setImageFile(null);
    setImagePreview(item.image_url || '');
    setEditing(item);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error('Título é obrigatório'); return; }
    setSaving(true);
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('summary', formData.summary);
      body.append('content', formData.content);
      body.append('is_active', formData.is_active ? '1' : '0');
      if (formData.published_at) body.append('published_at', formData.published_at);
      if (imageFile) body.append('image', imageFile);

      if (editing) {
        await api.put(`/news/${editing.id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Notícia atualizada!');
      } else {
        await api.post('/news', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Notícia criada!');
      }
      setShowModal(false);
      resetForm();
      fetchNews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/news/${id}`);
      toast.success('Notícia removida!');
      setDeleteConfirmId(null);
      fetchNews();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notícias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie as notícias exibidas na homepage</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors">
          <FiPlus className="text-lg" /> Nova Notícia
        </button>
      </div>

      {news.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm">
          <FiFileText className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma notícia</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Crie a primeira notícia para exibir na homepage.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600">
            <FiPlus /> Criar Primeira
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Notícia</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Publicado</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <FiImage className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                          {item.summary && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.summary}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400"><FiEye className="text-sm" /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400"><FiEyeOff className="text-sm" /> Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors" title="Editar">
                          <FiEdit2 className="text-sm" />
                        </button>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Sim</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(item.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors" title="Excluir">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{editing ? 'Editar Notícia' : 'Nova Notícia'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Ex: Faculdade Diferencial lança novo curso" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Resumo</label>
                <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Breve resumo da notícia..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Conteúdo</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="Conteúdo completo da notícia..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Imagem</label>
                  <input type="file" accept="image/*" onChange={handleImageChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100" />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full h-32 object-cover rounded-xl" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Publicação</label>
                  <input type="date" value={formData.published_at} onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                  <div className="flex items-center gap-3 mt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ativo (visível na homepage)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50">
                <FiSave className="text-sm" /> {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
