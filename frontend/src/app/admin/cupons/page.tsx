'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiTag,
  FiPercent,
  FiDollarSign,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  used_count: number;
  max_uses: number | null;
  course?: { id: number; title: string } | null;
  status: 'active' | 'inactive';
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    max_uses: '',
    course_id: '',
    start_date: '',
    end_date: '',
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/coupons', { params });
      setCoupons(data.coupons || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setFormData({ code: '', type: 'percentage', value: '', max_uses: '', course_id: '', start_date: '', end_date: '' });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      course_id: coupon.course ? String(coupon.course.id) : '',
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        course_id: formData.course_id ? parseInt(formData.course_id) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editing) {
        await api.put(`/coupons/${editing.id}`, payload);
        toast.success('Cupom atualizado com sucesso');
      } else {
        await api.post('/coupons', payload);
        toast.success('Cupom criado com sucesso');
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Cupom excluído com sucesso');
      fetchCoupons();
    } catch {
      toast.error('Erro ao excluir cupom');
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cupons</h1>
          <p className="text-sm text-gray-500 mt-1">Crie e gerencie cupons de desconto</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Novo Cupom
        </button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      {loading ? (
        <Loading fullScreen={false} text="Carregando cupons..." />
      ) : coupons.length === 0 ? (
        <EmptyState icon={<FiTag />} title="Nenhum cupom encontrado" description="Crie cupons para oferecer descontos." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Uso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Curso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Validade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                        <FiTag className="text-xs text-gray-400" />
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                        {coupon.type === 'percentage' ? (
                          <><FiPercent className="text-emerald-500" /> Percentual</>
                        ) : (
                          <><FiDollarSign className="text-primary-500" /> Fixo</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toLocaleString('pt-BR')}`}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">
                        {coupon.used_count}/{coupon.max_uses || '∞'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                      {coupon.course?.title || 'Todos'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {formatDate(coupon.start_date)} — {formatDate(coupon.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          coupon.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {coupon.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          title="Editar"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-600"
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
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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
                {editing ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="DESCONTO20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de usos</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Ilimitado"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
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
