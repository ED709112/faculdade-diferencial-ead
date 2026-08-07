'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiX, FiSearch, FiFileText, FiCheckCircle, FiClock,
  FiAlertTriangle, FiRotateCcw, FiDownload, FiUsers, FiUser,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface BoletoRow {
  id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  course_title: string | null;
  turma_name: string | null;
  plan_name: string | null;
  description: string | null;
  installment_number: number;
  installment_total: number;
  original_value: number;
  discount_value: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'error';
  boleto_url: string | null;
  barcode: string | null;
  charge_id: string | null;
  error_message: string | null;
  paid_value: number | null;
  paid_at: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  errors: number;
  cancelled: number;
  total_received: number;
}

interface PlanRow {
  id: number;
  name: string;
  type: string;
  turma_name: string | null;
  course_title: string | null;
  student_name: string | null;
  installments_total: number;
  installment_value: number;
  discount_value: number;
  first_due_date: string;
  total_boletos: number;
  paid_boletos: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Aguardando', classes: 'bg-yellow-50 text-yellow-700' },
  paid: { label: 'Pago', classes: 'bg-green-50 text-green-700' },
  overdue: { label: 'Vencido', classes: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelado', classes: 'bg-gray-100 text-gray-600' },
  error: { label: 'Erro', classes: 'bg-red-50 text-red-700' },
};

function fmtCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const emptyPlanForm = {
  name: '', turma_id: '', installments_total: '18', installment_value: '', discount_value: '0',
  first_due_date: '', due_day: '', interval_days: '30', description: '',
};

const emptyIndForm = {
  user_id: '', installments_total: '1', installment_value: '', discount_value: '0',
  first_due_date: '', due_day: '', interval_days: '30', description: '',
};

export default function BoletosTab() {
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', turma_id: '', q: '' });
  const [saving, setSaving] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlanForm);

  const [showIndModal, setShowIndModal] = useState(false);
  const [indForm, setIndForm] = useState(emptyIndForm);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);

  const [showConfirm, setShowConfirm] = useState<BoletoRow | null>(null);
  const [confirmValue, setConfirmValue] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const fetchBoletos = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.turma_id) params.turma_id = filters.turma_id;
      if (filters.q) params.q = filters.q;
      const { data } = await api.get('/boletos/admin', { params });
      setBoletos(data.boletos || []);
      setSummary(data.summary || null);
    } catch {
      toast.error('Erro ao carregar boletos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/boletos/admin/plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setPlans([]);
    }
  }, []);

  const fetchTurmas = useCallback(async () => {
    try {
      const { data } = await api.get('/turmas');
      setTurmas(Array.isArray(data) ? data : data.data || []);
    } catch {
      setTurmas([]);
    }
  }, []);

  useEffect(() => { fetchBoletos(); }, [fetchBoletos]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchTurmas(); }, [fetchTurmas]);

  useEffect(() => {
    if (!showIndModal) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/admin/users', {
          params: { role: 'student', limit: 20, search: studentSearch || undefined },
        });
        setStudentResults(Array.isArray(data) ? data : data.data || []);
      } catch {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, showIndModal]);

  const effectiveValue = (b: BoletoRow) => {
    const due = new Date(`${b.due_date}T00:00:00`);
    const today = new Date();
    const expired = due.getTime() < today.setHours(0, 0, 0, 0);
    return Number(b.original_value) - (expired ? 0 : Number(b.discount_value));
  };

  const handleCreatePlan = async () => {
    if (!planForm.turma_id) { toast.error('Selecione a turma'); return; }
    if (!planForm.installment_value) { toast.error('Informe o valor da parcela'); return; }
    setSaving(true);
    try {
      await api.post('/boletos/admin/plans', {
        name: planForm.name,
        type: 'turma',
        turma_id: Number(planForm.turma_id),
        installments_total: Number(planForm.installments_total) || 1,
        installment_value: Number(planForm.installment_value.replace(',', '.')),
        discount_value: Number(planForm.discount_value.replace(',', '.')) || 0,
        first_due_date: planForm.first_due_date,
        due_day: planForm.due_day ? Number(planForm.due_day) : null,
        interval_days: Number(planForm.interval_days) || 30,
        description: planForm.description,
      });
      toast.success('Plano de boletos criado!');
      setShowPlanModal(false);
      setPlanForm(emptyPlanForm);
      fetchBoletos();
      fetchPlans();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao criar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateIndividual = async () => {
    if (!indForm.user_id) { toast.error('Selecione o aluno'); return; }
    if (!indForm.installment_value) { toast.error('Informe o valor'); return; }
    setSaving(true);
    try {
      await api.post('/boletos/admin/plans', {
        name: indForm.description,
        type: 'individual',
        user_id: Number(indForm.user_id),
        installments_total: Number(indForm.installments_total) || 1,
        installment_value: Number(indForm.installment_value.replace(',', '.')),
        discount_value: Number(indForm.discount_value.replace(',', '.')) || 0,
        first_due_date: indForm.first_due_date,
        due_day: indForm.due_day ? Number(indForm.due_day) : null,
        interval_days: Number(indForm.interval_days) || 30,
        description: indForm.description,
      });
      toast.success('Boleto(s) criado(s)!');
      setShowIndModal(false);
      setIndForm(emptyIndForm);
      setStudentSearch('');
      setStudentResults([]);
      fetchBoletos();
      fetchPlans();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao criar boleto');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!showConfirm) return;
    setSaving(true);
    try {
      const paidValue = confirmValue.replace(',', '.');
      await api.post(`/boletos/admin/${showConfirm.id}/confirm`, {
        paid_value: paidValue ? Number(paidValue) : undefined,
      });
      toast.success('Pagamento confirmado!');
      setShowConfirm(null);
      fetchBoletos();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao confirmar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (b: BoletoRow) => {
    if (!window.confirm(`Cancelar o boleto de ${b.student_name}?`)) return;
    try {
      await api.post(`/boletos/admin/${b.id}/cancel`);
      toast.success('Boleto cancelado');
      fetchBoletos();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao cancelar');
    }
  };

  const handleRetry = async (b: BoletoRow) => {
    try {
      await api.post(`/boletos/admin/${b.id}/retry`);
      toast.success('Boleto reemitido!');
      fetchBoletos();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao reemitir');
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';
  const modalCls = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto';
  const cardCls = 'bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4';

  const summaryCards = summary ? [
    { label: 'Total de boletos', value: String(summary.total), icon: FiFileText, color: 'text-primary-500 bg-primary-50' },
    { label: 'Aguardando', value: String(summary.pending), icon: FiClock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Pagos', value: String(summary.paid), icon: FiCheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Vencidos', value: String(summary.overdue), icon: FiAlertTriangle, color: 'text-red-600 bg-red-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cadastro de Boletos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {summary ? `${fmtCurrency(summary.total_received)} recebidos em ${summary.paid} boleto(s) pago(s)` : 'Gerencie os boletos dos alunos e turmas'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowIndModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <FiUser /> Boleto individual
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <FiUsers /> Novo plano de turma
          </button>
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${c.color.split(' ')[1]}`}>
                <c.icon className={c.color.split(' ')[0]} />
              </div>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Buscar por aluno ou descrição..."
            className="flex-1 outline-none text-sm"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todos os status</option>
          <option value="pending">Aguardando</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
          <option value="cancelled">Cancelado</option>
          <option value="error">Erro</option>
        </select>
        <select
          value={filters.turma_id}
          onChange={(e) => setFilters({ ...filters, turma_id: e.target.value })}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {showErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          {boletos.filter((b) => b.status === 'error').slice(0, 10).map((b) => (
            <p key={b.id} className="text-xs text-red-700">
              <strong>{b.student_name}</strong> {b.installment_number}/{b.installment_total}: {b.error_message}
            </p>
          ))}
        </div>
      )}

      {loading ? (
        <Loading text="Carregando boletos..." />
      ) : boletos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          Nenhum boleto encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Aluno</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {boletos.map((b) => {
                const discounted = effectiveValue(b);
                const st = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.student_name}</p>
                      <p className="text-xs text-gray-400">
                        {b.installment_number}/{b.installment_total} {b.turma_name ? `· ${b.turma_name}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[220px]">
                      <p className="truncate">{b.description || 'Boleto'}</p>
                      {b.discount_value > 0 && (
                        <p className="text-xs text-emerald-600">
                          {fmtCurrency(b.discount_value)} de desconto até o vencimento
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(b.due_date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{fmtCurrency(b.original_value)}</p>
                      {b.discount_value > 0 && b.status === 'pending' && (
                        <p className="text-xs text-emerald-600">{fmtCurrency(discounted)} até o vencimento</p>
                      )}
                      {b.status === 'paid' && b.paid_value && (
                        <p className="text-xs text-green-600">Pago: {fmtCurrency(b.paid_value)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${st.classes}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {b.status === 'pending' && (
                          <>
                            {b.boleto_url && (
                              <a
                                href={b.boleto_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 border border-primary-200 hover:bg-primary-50"
                              >
                                <FiDownload /> Baixar
                              </a>
                            )}
                            <button
                              onClick={() => { setConfirmValue(String(discounted).replace('.', ',')); setShowConfirm(b); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50"
                            >
                              <FiCheckCircle /> Confirmar pagamento
                            </button>
                            <button
                              onClick={() => handleCancel(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
                            >
                              <FiX /> Cancelar
                            </button>
                          </>
                        )}
                        {b.status === 'error' && (
                          <button
                            onClick={() => handleRetry(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 border border-primary-200 hover:bg-primary-50"
                          >
                            <FiRotateCcw /> Reemitir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {plans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Planos criados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Parcelas</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Progresso</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.type === 'turma' ? p.turma_name : p.student_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.installments_total}x</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{fmtCurrency(p.installment_value)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: p.total_boletos ? `${Math.round((p.paid_boletos / p.total_boletos) * 100)}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{p.paid_boletos}/{p.total_boletos}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className={modalCls}>
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Novo plano de boletos para turma</h2>
              <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Turma *</label>
                <select
                  value={planForm.turma_id}
                  onChange={(e) => setPlanForm({ ...planForm, turma_id: e.target.value })}
                  className={`${inputCls} bg-white`}
                >
                  <option value="">Selecione a turma</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.course_title ? ` - ${t.course_title}` : ''} ({t.students_count || 0} alunos)
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Nome do plano (opcional)</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ex: Mensalidades 2026.2 - Turma Enfermagem"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nº de parcelas *</label>
                <input
                  type="number"
                  min="1"
                  value={planForm.installments_total}
                  onChange={(e) => setPlanForm({ ...planForm, installments_total: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Valor de cada parcela (R$) *</label>
                <input
                  type="text"
                  value={planForm.installment_value}
                  onChange={(e) => setPlanForm({ ...planForm, installment_value: e.target.value })}
                  placeholder="Ex: 200,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Desconto até o vencimento (R$)</label>
                <input
                  type="text"
                  value={planForm.discount_value}
                  onChange={(e) => setPlanForm({ ...planForm, discount_value: e.target.value })}
                  placeholder="Ex: 20,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Primeiro vencimento *</label>
                <input
                  type="date"
                  value={planForm.first_due_date}
                  onChange={(e) => setPlanForm({ ...planForm, first_due_date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Dia fixo de vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={planForm.due_day}
                  onChange={(e) => setPlanForm({ ...planForm, due_day: e.target.value })}
                  placeholder="Ex: 10 (em branco = a cada X dias)"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Intervalo em dias (se sem dia fixo)</label>
                <input
                  type="number"
                  min="1"
                  value={planForm.interval_days}
                  onChange={(e) => setPlanForm({ ...planForm, interval_days: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Descrição</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Ex: Mensalidade do curso"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'Gerando...' : 'Gerar boletos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIndModal && (
        <div className={modalCls}>
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Boleto individual</h2>
              <button onClick={() => setShowIndModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Aluno *</label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar aluno por nome ou e-mail..."
                  className={inputCls}
                />
                <div className="mt-1 border border-gray-100 rounded-xl max-h-40 overflow-y-auto">
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setIndForm({ ...indForm, user_id: String(s.id) });
                        setStudentSearch(`${s.name} (${s.email})`);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${indForm.user_id === String(s.id) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                    >
                      {s.name} <span className="text-gray-400">· {s.email}</span>
                    </button>
                  ))}
                  {studentResults.length === 0 && (
                    <p className="px-3 py-2 text-xs text-gray-400">Digite para buscar alunos...</p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Nº de parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={indForm.installments_total}
                  onChange={(e) => setIndForm({ ...indForm, installments_total: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Valor de cada parcela (R$) *</label>
                <input
                  type="text"
                  value={indForm.installment_value}
                  onChange={(e) => setIndForm({ ...indForm, installment_value: e.target.value })}
                  placeholder="Ex: 200,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Desconto até o vencimento (R$)</label>
                <input
                  type="text"
                  value={indForm.discount_value}
                  onChange={(e) => setIndForm({ ...indForm, discount_value: e.target.value })}
                  placeholder="Ex: 20,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Primeiro vencimento *</label>
                <input
                  type="date"
                  value={indForm.first_due_date}
                  onChange={(e) => setIndForm({ ...indForm, first_due_date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Dia fixo de vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={indForm.due_day}
                  onChange={(e) => setIndForm({ ...indForm, due_day: e.target.value })}
                  placeholder="Ex: 10 (em branco = a cada X dias)"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Intervalo em dias (se sem dia fixo)</label>
                <input
                  type="number"
                  min="1"
                  value={indForm.interval_days}
                  onChange={(e) => setIndForm({ ...indForm, interval_days: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Descrição</label>
                <input
                  type="text"
                  value={indForm.description}
                  onChange={(e) => setIndForm({ ...indForm, description: e.target.value })}
                  placeholder="Ex: Mensalidade 1/18"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowIndModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateIndividual}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Gerando...' : 'Gerar boleto(s)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className={modalCls}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Confirmar pagamento</h2>
              <button onClick={() => setShowConfirm(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>{showConfirm.student_name}</strong> · parcela {showConfirm.installment_number}/{showConfirm.installment_total}</p>
              <p className="text-gray-400 mt-1">Vencimento: {fmtDate(showConfirm.due_date)}</p>
            </div>
            <div>
              <label className={labelCls}>Valor pago (R$)</label>
              <input
                type="text"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Confirmando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
