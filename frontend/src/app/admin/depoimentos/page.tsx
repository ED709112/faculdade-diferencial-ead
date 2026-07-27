'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiX, FiSave, FiMessageSquare } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Testimonial {
  id: number;
  alumni_id: number;
  title: string;
  content: string;
  rating: number;
  photo_url: string;
  video_url: string;
  is_active: number;
  sort_order: number;
  alumni_name: string;
  alumni_course: string;
}

interface AlumniOption {
  id: number;
  full_name: string;
  course: string;
}

export default function AdminDepoimentosPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ alumni_id: '', title: '', content: '', rating: '5', video_url: '', sort_order: '0', is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        api.get('/alumni/testimonials/all'),
        api.get('/alumni'),
      ]);
      setTestimonials(Array.isArray(tRes.data) ? tRes.data : []);
      setAlumniList(Array.isArray(aRes.data) ? aRes.data : []);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ alumni_id: '', title: '', content: '', rating: '5', video_url: '', sort_order: '0', is_active: true });
    setShowModal(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      alumni_id: t.alumni_id?.toString() || '',
      title: t.title || '',
      content: t.content || '',
      rating: t.rating?.toString() || '5',
      video_url: t.video_url || '',
      sort_order: t.sort_order?.toString() || '0',
      is_active: !!t.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.alumni_id || !form.content.trim()) { toast.error('Egresso e conteúdo são obrigatórios'); return; }
    setSaving(true);
    try {
      const payload = {
        alumni_id: parseInt(form.alumni_id),
        title: form.title || null,
        content: form.content,
        rating: parseInt(form.rating) || 5,
        video_url: form.video_url || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editing) {
        await api.put(`/alumni/testimonials/${editing.id}`, payload);
        toast.success('Depoimento atualizado!');
      } else {
        await api.post('/alumni/testimonials', payload);
        toast.success('Depoimento criado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este depoimento?')) return;
    try { await api.delete(`/alumni/testimonials/${id}`); toast.success('Excluído!'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depoimentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os depoimentos dos egressos</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600">
          <FiPlus /> Novo Depoimento
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <FiMessageSquare className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum depoimento</h3>
          <p className="text-gray-500 mb-4">Cadastre egressos primeiro para adicionar depoimentos.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-semibold"><FiPlus /> Criar Primeiro</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Depoimento</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Egresso</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Avaliação</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 max-w-xs">
                    {t.title && <p className="font-medium text-gray-900 truncate">{t.title}</p>}
                    <p className="text-xs text-gray-500 truncate">{t.content}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{t.alumni_name || '—'}<br /><span className="text-xs text-gray-400">{t.alumni_course}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <FiStar key={i} className="text-yellow-400 text-sm fill-current" />)}</div>
                  </td>
                  <td className="px-6 py-4">{t.is_active ? <span className="text-xs text-green-600 font-semibold">Ativo</span> : <span className="text-xs text-gray-400">Inativo</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"><FiEdit2 className="text-sm" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><FiTrash2 className="text-sm" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{editing ? 'Editar Depoimento' : 'Novo Depoimento'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Egresso *</label>
                <select value={form.alumni_id} onChange={e => setForm({ ...form, alumni_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Selecione o egresso</option>
                  {alumniList.map(a => <option key={a.id} value={a.id}>{a.full_name} - {a.course}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ex: Minha experiência profissional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Depoimento do egresso..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                  <select value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-500 rounded" />
                    <span className="text-sm text-gray-700">Ativo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl disabled:opacity-50">
                <FiSave /> {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
