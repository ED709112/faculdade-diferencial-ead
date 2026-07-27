'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUsers, FiX, FiSave, FiStar, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Alumni {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  course: string;
  completion_year: number;
  company_name: string;
  job_title: string;
  city: string;
  state: string;
  photo_url: string;
  bio: string;
  linkedin_url: string;
  is_featured: number;
  status: string;
  testimonials_count: number;
}

const emptyForm = {
  full_name: '', email: '', phone: '', cpf: '', course: '', completion_year: '',
  registration_number: '', company_name: '', job_title: '', city: '', state: '',
  bio: '', linkedin_url: '', is_featured: false, status: 'active',
};

export default function AdminEgressosPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Alumni | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/alumni');
      setAlumni(Array.isArray(data) ? data : []);
    } catch { toast.error('Erro ao carregar egressos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setPhotoFile(null); setPhotoPreview(''); setShowModal(true); };

  const openEdit = (a: Alumni) => {
    setEditing(a);
    setForm({
      full_name: a.full_name, email: a.email, phone: a.phone || '', cpf: '', course: a.course || '',
      completion_year: a.completion_year?.toString() || '', registration_number: '',
      company_name: a.company_name || '', job_title: a.job_title || '', city: a.city || '',
      state: a.state || '', bio: a.bio || '', linkedin_url: a.linkedin_url || '',
      is_featured: !!a.is_featured, status: a.status,
    });
    setPhotoFile(null);
    setPhotoPreview(a.photo_url || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) { toast.error('Nome e email são obrigatórios'); return; }
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) body.append(k, String(v));
      });
      if (photoFile) body.append('photo', photoFile);

      if (editing) {
        await api.put(`/alumni/${editing.id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Egresso atualizado!');
      } else {
        await api.post('/alumni', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Egresso criado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este egresso?')) return;
    try {
      await api.delete(`/alumni/${id}`);
      toast.success('Egresso excluído!');
      fetchData();
    } catch { toast.error('Erro ao excluir'); }
  };

  const filtered = alumni.filter(a => a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.course?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egressos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os egressos da instituição</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600">
          <FiPlus /> Novo Egresso
        </button>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <FiSearch className="text-gray-400 mr-2" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar egresso..." className="flex-1 outline-none text-sm" />
      </div>

      {alumni.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <FiUsers className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum egresso cadastrado</h3>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-semibold"><FiPlus /> Cadastrar Primeiro</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Egresso</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Curso</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {a.photo_url ? <img src={a.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">{a.full_name?.charAt(0)}</div>}
                      <div>
                        <p className="font-medium text-gray-900">{a.full_name}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{a.course || '—'}{a.completion_year ? ` (${a.completion_year})` : ''}</td>
                  <td className="px-6 py-4">
                    {a.is_featured ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600"><FiStar /> Destaque</span> : null}
                    {a.status === 'active' ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><FiEye /> Ativo</span> : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><FiEyeOff /> Inativo</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Editar"><FiEdit2 className="text-sm" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Excluir"><FiTrash2 className="text-sm" /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">{editing ? 'Editar Egresso' : 'Novo Egresso'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input type="text" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                  <input type="text" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano de Conclusão</label>
                  <input type="number" value={form.completion_year} onChange={e => setForm({ ...form, completion_year: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input type="text" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} className="w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600" />
                {photoPreview && <img src={photoPreview} alt="" className="mt-2 w-20 h-20 rounded-full object-cover" />}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 text-primary-500 rounded" />
                  <span className="text-sm text-gray-700">Destaque</span>
                </label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
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
