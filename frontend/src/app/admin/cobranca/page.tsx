'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUpload, FiSearch, FiX, FiCheck, FiSkipForward, FiTrash2,
  FiMessageSquare, FiDollarSign, FiFileText, FiCalendar, FiSend,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Record {
  id: number;
  campaign_id: number | null;
  campaign_name: string;
  student_name: string;
  phone: string;
  course: string;
  amount: string;
  due_date: string;
  status: string;
  msg_t2_sent_at: string | null;
  msg_due_sent_at: string | null;
  msg_overdue_sent_at: string | null;
  last_error: string | null;
}

interface Template {
  template_key: string;
  title: string;
  message: string;
}

const TYPES = [
  { key: 't2', label: '2 dias antes', field: 'msg_t2_sent_at' },
  { key: 'due', label: 'Dia do vencimento', field: 'msg_due_sent_at' },
  { key: 'overdue', label: 'Após vencimento', field: 'msg_overdue_sent_at' },
];

export default function AdminCobrancaPage() {
  const [tab, setTab] = useState<'registros' | 'campanhas' | 'mensagens'>('registros');
  const [records, setRecords] = useState<Record[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('');

  const [fileName, setFileName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState<Record | null>(null);
  const [editForm, setEditForm] = useState({ due_date: '', amount: '', course: '', status: 'pending' });

  const [configForm, setConfigForm] = useState({ billing_active: '1', billing_send_start: '8', billing_send_end: '20', billing_max_per_hour: '30', billing_interval_seconds: '25' });

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/billing/stats');
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/billing/campaigns');
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (campaignFilter) params.campaign_id = campaignFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/billing', { params });
      setRecords(data.data || []);
    } catch {
      toast.error('Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, campaignFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/billing/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/billing/config');
      const map: any = {};
      (Array.isArray(data) ? data : []).forEach((c: any) => { map[c.key] = c.value; });
      setConfigForm({
        billing_active: map.billing_active ?? '1',
        billing_send_start: map.billing_send_start ?? '8',
        billing_send_end: map.billing_send_end ?? '20',
        billing_max_per_hour: map.billing_max_per_hour ?? '30',
        billing_interval_seconds: map.billing_interval_seconds ?? '25',
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
    fetchTemplates();
    fetchConfig();
  }, [fetchStats, fetchCampaigns, fetchTemplates, fetchConfig]);

  useEffect(() => {
    const timer = setTimeout(fetchRecords, 300);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleUpload = async () => {
    const fileInput = document.getElementById('billing-file') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) { toast.error('Selecione a planilha'); return; }
    if (!campaignName.trim()) { toast.error('Dê um nome para a campanha'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', campaignName.trim());

    setUploading(true);
    try {
      const { data } = await api.post('/admin/billing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Campanha importada!');
      if (data.skipped?.length) {
        toast(`Ignoradas: ${data.skipped.length} linha(s) sem dados válidos`);
      }
      setCampaignName('');
      setFileName('');
      if (fileInput) fileInput.value = '';
      fetchStats();
      fetchCampaigns();
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao importar planilha');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!editing) return;
    try {
      await api.put(`/admin/billing/records/${editing.id}`, editForm);
      toast.success('Registro atualizado');
      setEditing(null);
      fetchRecords();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar');
    }
  };

  const setStatus = async (r: Record, status: string) => {
    try {
      await api.put(`/admin/billing/records/${r.id}`, { status });
      toast.success(status === 'paid' ? 'Marcado como pago' : status === 'skipped' ? 'Registro pulado' : 'Voltou para pendente');
      fetchRecords();
      fetchStats();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const sendNow = async (r: Record, type: string) => {
    try {
      await api.post('/admin/billing/send-now', { id: r.id, type });
      toast.success('Mensagem enviada!');
      fetchRecords();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar mensagem');
    }
  };

  const deleteRecord = async (r: Record) => {
    if (!confirm(`Excluir ${r.student_name}?`)) return;
    try {
      await api.delete(`/admin/billing/records/${r.id}`);
      toast.success('Registro excluído');
      fetchRecords();
      fetchStats();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const deleteCampaign = async (c: any) => {
    if (!confirm(`Excluir a campanha "${c.name}" e todos os seus registros?`)) return;
    try {
      await api.delete(`/admin/billing/campaigns/${c.id}`);
      toast.success('Campanha excluída');
      fetchCampaigns();
      fetchRecords();
      fetchStats();
    } catch {
      toast.error('Erro ao excluir campanha');
    }
  };

  const saveTemplates = async () => {
    try {
      await api.put('/admin/billing/templates', { templates });
      toast.success('Mensagens salvas!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar mensagens');
    }
  };

  const saveConfig = async () => {
    try {
      await api.put('/admin/billing/config', configForm);
      toast.success('Configurações de envio salvas!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar configurações');
    }
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  const fmtMoney = (v?: string | null) => {
    const n = parseFloat(v as string);
    if (isNaN(n)) return '—';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fmtTime = (v?: string | null) => {
    if (!v) return '—';
    const d = new Date(String(v).replace(' ', 'T') + (String(v).includes('Z') ? '' : 'Z'));
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const sentLabel = (r: Record) => {
    const sent = TYPES.filter(t => (r as any)[t.field]).map(t => t.label);
    return sent.length ? sent.join(', ') : '—';
  };

  const statusBadge = (s: string) => {
    if (s === 'paid') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Pago</span>;
    if (s === 'skipped') return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pulado</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">Pendente</span>;
  };

  const statCards = [
    { label: 'Total', value: stats.total, color: 'text-primary-600' },
    { label: 'Pendentes', value: stats.pending, color: 'text-yellow-600' },
    { label: 'Pagas', value: stats.paid, color: 'text-green-600' },
    { label: 'Enviadas', value: (stats.sent_t2 || 0) + (stats.sent_due || 0) + (stats.sent_overdue || 0), color: 'text-blue-600' },
    { label: 'Vencem hoje', value: stats.due_today, color: 'text-orange-600' },
    { label: 'Vencidas', value: stats.overdue, color: 'text-red-600' },
  ];

  if (loading && records.length === 0) return <Loading text="Carregando régua de cobrança..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Régua de Cobrança</h1>
          <p className="text-sm text-gray-500 mt-1">
            Importe a planilha e o sistema envia: aviso 2 dias antes, lembrete no vencimento e cobrança no dia seguinte
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['registros', 'Registros'], ['campanhas', 'Campanhas'], ['mensagens', 'Mensagens']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'registros' && (
        <>
          {/* Upload */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiUpload className="text-primary-500" /> Importar planilha
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Nome da campanha (ex: Mensalidade Agosto)"
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <input
                id="billing-file"
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={e => setFileName(e.target.files?.[0]?.name || '')}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-primary-600 file:text-sm"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                <FiUpload /> {uploading ? 'Importando...' : 'Importar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Aceita Excel (.xlsx/.xls) com as colunas Nome, Telefone/WhatsApp, Curso, Valor e Vencimento — ou o PDF do "Contas a Receber".
              Se o PDF não tiver telefone, o sistema cruza com os alunos cadastrados para preencher automaticamente.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone ou curso..."
                className="flex-1 outline-none text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagas</option>
              <option value="skipped">Puladas</option>
            </select>
            <select
              value={campaignFilter}
              onChange={e => setCampaignFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
            >
              <option value="">Todas as campanhas</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.records_count})</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Aluno</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Telefone</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Curso</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Valor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Vencimento</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Enviadas</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{r.student_name}</p>
                      {r.campaign_name && <p className="text-xs text-gray-400">{r.campaign_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-5 py-3 text-gray-600">{r.course || '—'}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{fmtMoney(r.amount)}</td>
                    <td className="px-5 py-3 text-gray-700">{fmtDate(r.due_date)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {TYPES.map(t => (
                          <span key={t.key} className={`flex items-center gap-1 ${(r as any)[t.field] ? 'text-green-600' : 'text-gray-300'}`}>
                            {t.label}:
                            {(r as any)[t.field] ? ` ${fmtTime((r as any)[t.field])}` : ' não enviada'}
                          </span>
                        ))}
                      </div>
                      {r.last_error && <p className="text-xs text-red-500 mt-1 truncate max-w-[200px]" title={r.last_error}>Erro: {r.last_error}</p>}
                    </td>
                    <td className="px-5 py-3 text-center">{statusBadge(r.status)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => setStatus(r, 'paid')} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Marcar como pago">
                              <FiCheck className="text-sm" />
                            </button>
                            <button onClick={() => setStatus(r, 'skipped')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Pular envio">
                              <FiSkipForward className="text-sm" />
                            </button>
                            <button onClick={() => { setEditing(r); setEditForm({ due_date: r.due_date, amount: r.amount, course: r.course || '', status: r.status }); }} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Editar">
                              <FiCalendar className="text-sm" />
                            </button>
                            <button onClick={() => sendNow(r, 'overdue')} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Enviar cobrança agora">
                              <FiSend className="text-sm" />
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteRecord(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Excluir">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-sm">Nenhum registro encontrado. Importe uma planilha para começar.</div>
            )}
          </div>
        </>
      )}

      {tab === 'campanhas' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Campanha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Arquivo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Registros</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Pendentes</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Criada em</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.file_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{c.records_count}</td>
                  <td className="px-5 py-3 text-yellow-700">{c.pending_count}</td>
                  <td className="px-5 py-3 text-gray-500">{fmtTime(c.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => deleteCampaign(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Excluir campanha">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">Nenhuma campanha ainda.</div>}
        </div>
      )}

      {tab === 'mensagens' && (
        <div className="space-y-4">
          {/* Configurações de envio (anti-bloqueio) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <FiCalendar className="text-primary-500" /> Configurações de envio
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Limite por hora + intervalo entre mensagens reduzem o risco de bloqueio do WhatsApp (gotejamento).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hora início</label>
                <input
                  type="number" min={0} max={23}
                  value={configForm.billing_send_start}
                  onChange={e => setConfigForm({ ...configForm, billing_send_start: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hora fim</label>
                <input
                  type="number" min={0} max={23}
                  value={configForm.billing_send_end}
                  onChange={e => setConfigForm({ ...configForm, billing_send_end: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Máx. msg por hora</label>
                <input
                  type="number" min={1} max={200}
                  value={configForm.billing_max_per_hour}
                  onChange={e => setConfigForm({ ...configForm, billing_max_per_hour: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Intervalo (seg)</label>
                <input
                  type="number" min={1} max={300}
                  value={configForm.billing_interval_seconds}
                  onChange={e => setConfigForm({ ...configForm, billing_interval_seconds: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Envios automáticos</label>
                <select
                  value={configForm.billing_active}
                  onChange={e => setConfigForm({ ...configForm, billing_active: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                >
                  <option value="1">Ativo</option>
                  <option value="0">Pausado</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end mt-4">
              <button
                onClick={saveConfig}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600"
              >
                Salvar configurações
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Use os marcadores: {'{nome}'}, {'{curso}'}, {'{valor}'}, {'{vencimento}'}
            </p>
            <button
              onClick={saveTemplates}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600"
            >
              Salvar mensagens
            </button>
          </div>
          {templates.map(t => (
            <div key={t.template_key} className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <FiMessageSquare className="text-primary-500" /> {t.title}
              </h3>
              <textarea
                value={t.message}
                onChange={e => setTemplates(templates.map(x => x.template_key === t.template_key ? { ...x, message: e.target.value } : x))}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y"
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar registro</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data de vencimento</label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor</label>
              <input
                type="text"
                value={editForm.amount}
                onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="ex: 199,90"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Curso</label>
              <input
                type="text"
                value={editForm.course}
                onChange={e => setEditForm({ ...editForm, course: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="skipped">Pulado</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleSaveRecord} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-xl hover:bg-primary-600">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
