'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiImage,
  FiMenu,
  FiEye,
  FiEyeOff,
  FiLink,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url: string;
  link?: string;
  position: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/banners');
      setBanners((data.banners || data.data || data || []).map((b: any, i: number) => ({
        ...b,
        position: b.position ?? i,
      })));
    } catch {
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', image_url: '', link: '', start_date: '', end_date: '', is_active: true });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link: banner.link || '',
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      is_active: banner.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/banners/${editing.id}`, formData);
        toast.success('Banner atualizado com sucesso');
      } else {
        await api.post('/banners', { ...formData, position: banners.length });
        toast.success('Banner criado com sucesso');
      }
      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner excluído com sucesso');
      setDeleteConfirmId(null);
      fetchBanners();
    } catch {
      toast.error('Erro ao excluir banner');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.patch(`/banners/${id}/toggle`);
      toast.success('Status do banner atualizado');
      fetchBanners();
    } catch {
      toast.error('Erro ao atualizar banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os banners da página inicial</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Novo Banner
        </button>
      </div>

      {loading ? (
        <Loading fullScreen={false} text="Carregando banners..." />
      ) : banners.length === 0 ? (
        <EmptyState icon={<FiImage />} title="Nenhum banner encontrado" description="Crie banners para a página inicial." />
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-64 h-40 sm:h-auto bg-gray-100 shrink-0 relative">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="text-3xl text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          banner.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {banner.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-500">{banner.subtitle}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Posição: {banner.position + 1}</span>
                      {banner.link && (
                        <span className="flex items-center gap-1">
                          <FiLink /> {banner.link}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => openEdit(banner)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      <FiEdit2 /> Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        banner.is_active
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {banner.is_active ? <FiEyeOff /> : <FiEye />}
                      {banner.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    {deleteConfirmId === banner.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(banner.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 /> Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Banner' : 'Novo Banner'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Título do banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Subtítulo opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem *</label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="https://exemplo.com/banner.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (URL)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="https://exemplo.com/curso"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Banner ativo
                </label>
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
