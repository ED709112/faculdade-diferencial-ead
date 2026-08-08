'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FiPlus, FiSearch, FiFilter, FiUser, FiPhone, FiMail, FiMessageSquare,
  FiArrowRight, FiArrowLeft, FiX, FiSave, FiEye, FiTrash2, FiClock,
  FiTag, FiChevronDown, FiChevronRight, FiUsers,
  FiTrendingUp, FiCalendar, FiHash, FiDownload, FiZap, FiBell, FiUpload,
  FiSend, FiWifi, FiWifiOff,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  cpf?: string;
  source: string;
  source_detail?: string;
  status: string;
  course_interest?: string;
  course_id?: number;
  course_name?: string;
  notes?: string;
  assigned_to?: number;
  assigned_name?: string;
  interaction_count?: number;
  last_contact?: string;
  created_at: string;
  updated_at: string;
  interactions?: Interaction[];
  tags?: Tag[];
}

interface Interaction {
  id: number;
  type: string;
  direction: string;
  subject?: string;
  message: string;
  author_name?: string;
  created_at: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Stats {
  total: number;
  today: number;
  byStatus: Record<string, number>;
  byStatusList: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; border: string }> = {
  new:        { label: 'Novo',          color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  contacted:  { label: 'Contato',       color: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  interested: { label: 'Interessado',   color: '#8b5cf6', bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  enrolled:   { label: 'Matriculado',   color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  lost:       { label: 'Perdido',        color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_FLOW = ['new', 'contacted', 'interested', 'enrolled', 'lost'];

export default function AdminCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '', email: '', phone: '', whatsapp: '', cpf: '',
    source: 'manual', source_detail: '', status: 'new',
    course_interest: '', notes: '', assigned_to: '' as string,
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('note');
  const [newDirection, setNewDirection] = useState('outbound');
  const [newSubject, setNewSubject] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [team, setTeam] = useState<{ id: number; name: string; email: string }[]>([]);
  const [quickResponses, setQuickResponses] = useState<{ id: number; title: string; content: string; category: string }[]>([]);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const [reminders, setReminders] = useState<any[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', notes: '', remind_at: '' });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatLead, setChatLead] = useState<Lead | null>(null);
  const [chatConversation, setChatConversation] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterSource]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!chatLead) return;
    const interval = setInterval(() => loadChat(), 5000);
    return () => clearInterval(interval);
  }, [chatLead]);

  const fetchData = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source = filterSource;

      const [leadsRes, statsRes, tagsRes, teamRes, quickRes] = await Promise.allSettled([
        api.get('/crm/leads', { params }),
        api.get('/crm/stats'),
        api.get('/crm/tags'),
        api.get('/crm/team'),
        api.get('/crm/quick-responses'),
      ]);

      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value.data.leads || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (tagsRes.status === 'fulfilled') setTags(tagsRes.value.data || []);
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
      if (quickRes.status === 'fulfilled') setQuickResponses(quickRes.value.data?.filter((q: any) => q.is_active) || []);
    } catch {
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLeadForm({ name: '', email: '', phone: '', whatsapp: '', cpf: '', source: 'manual', source_detail: '', status: 'new', course_interest: '', notes: '', assigned_to: '' });
    setEditingLead(null);
  };

  const openCreate = () => { resetForm(); setShowLeadModal(true); };
  const openEdit = (lead: Lead) => {
    setLeadForm({
      name: lead.name, email: lead.email || '', phone: lead.phone || '',
      whatsapp: lead.whatsapp || '', cpf: lead.cpf || '',
      source: lead.source || 'manual', source_detail: lead.source_detail || '',
      status: lead.status, course_interest: lead.course_interest || '',
      notes: lead.notes || '', assigned_to: lead.assigned_to?.toString() || '',
    });
    setEditingLead(lead);
    setShowLeadModal(true);
  };

  const handleSaveLead = async () => {
    if (!leadForm.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const body = { ...leadForm, assigned_to: leadForm.assigned_to ? parseInt(leadForm.assigned_to) : null };
      if (editingLead) {
        await api.put(`/crm/leads/${editingLead.id}`, body);
        toast.success('Lead atualizado!');
      } else {
        await api.post('/crm/leads', body);
        toast.success('Lead criado!');
      }
      setShowLeadModal(false);
      resetForm();
      fetchData();
      if (selectedLead && editingLead) {
        const { data } = await api.get(`/crm/leads/${editingLead.id}`);
        setSelectedLead(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDeleteLead = async (id: number) => {
    try {
      await api.delete(`/crm/leads/${id}`);
      toast.success('Lead removido!');
      setDeleteConfirmId(null);
      if (selectedLead?.id === id) { setSelectedLead(null); setShowDetail(false); }
      fetchData();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleMoveLead = async (leadId: number, newStatus: string) => {
    try {
      await api.patch(`/crm/leads/${leadId}/move`, { status: newStatus });
      toast.success(`Lead movido para ${STATUS_CONFIG[newStatus]?.label}`);
      fetchData();
    } catch { toast.error('Erro ao mover lead'); }
  };

  const handleAddInteraction = async () => {
    if (!selectedLead || !newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await api.post(`/crm/leads/${selectedLead.id}/interactions`, {
        type: newType, direction: newDirection, subject: newSubject || null, message: newMessage,
      });
      toast.success('Interação adicionada!');
      setNewMessage(''); setNewSubject('');
      const { data } = await api.get(`/crm/leads/${selectedLead.id}`);
      setSelectedLead(data);
    } catch { toast.error('Erro ao adicionar interação'); }
    finally { setSendingMsg(false); }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source = filterSource;
      if (search) params.search = search;

      const res = await api.get('/crm/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exportação concluída!');
    } catch { toast.error('Erro ao exportar'); }
  };

  const loadChat = async () => {
    if (!chatLead) return;
    try {
      const { data } = await api.get(`/crm/leads/${chatLead.id}/whatsapp`);
      setChatConversation(data.conversation || null);
      setChatMessages(data.messages || []);
      setWaConnected(!!data.connected);
    } catch {}
    finally { setChatLoading(false); }
  };

  const openWhatsAppChat = async (lead: Lead) => {
    setChatLead(lead);
    setChatMessages([]);
    setChatConversation(null);
    setChatText('');
    setChatLoading(true);
    await loadChat();
  };

  const closeWhatsAppChat = () => {
    setChatLead(null);
    setChatMessages([]);
    setChatConversation(null);
    setChatText('');
    setWaConnected(null);
  };

  const handleSendChat = async () => {
    if (!chatLead || !chatText.trim() || chatSending) return;
    setChatSending(true);
    const text = chatText;
    try {
      const { data } = await api.post(`/crm/leads/${chatLead.id}/whatsapp/messages`, { content: text });
      setChatText('');
      if (data.sendError) {
        toast.error('Mensagem salva, mas o WhatsApp está desconectado. Reconecte a instância para enviar.');
      }
      await loadChat();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar mensagem');
    } finally { setChatSending(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast.error('Envie um arquivo Excel (.xlsx)'); return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/crm/import', form);
      toast.success(data.message || 'Importação concluída!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao importar');
    } finally { setImporting(false); }
  };

  const handleAssign = async (leadId: number, userId: string) => {
    try {
      await api.put(`/crm/leads/${leadId}`, { assigned_to: userId ? parseInt(userId) : null });
      toast.success('Atendente atualizado!');
      const { data } = await api.get(`/crm/leads/${leadId}`);
      if (selectedLead) setSelectedLead(data);
      fetchData();
    } catch { toast.error('Erro ao atribuir'); }
  };

  const loadReminders = async () => {
    try {
      const { data } = await api.get('/crm/reminders', { params: { pending: 'true' } });
      setReminders(data || []);
    } catch { /* silencioso */ }
  };

  const addReminder = async () => {
    if (!selectedLead || !reminderForm.title.trim() || !reminderForm.remind_at) {
      toast.error('Título e data são obrigatórios'); return;
    }
    try {
      await api.post('/crm/reminders', {
        lead_id: selectedLead.id,
        title: reminderForm.title,
        notes: reminderForm.notes || null,
        remind_at: new Date(reminderForm.remind_at).toISOString(),
      });
      toast.success('Lembrete criado!');
      setReminderForm({ title: '', notes: '', remind_at: '' });
      loadReminders();
    } catch { toast.error('Erro ao criar lembrete'); }
  };

  const toggleReminder = async (id: number, isDone: boolean) => {
    try {
      await api.put(`/crm/reminders/${id}`, { is_done: isDone });
      loadReminders();
    } catch { toast.error('Erro ao atualizar lembrete'); }
  };

  const openLeadDetail = async (lead: Lead) => {
    try {
      const { data } = await api.get(`/crm/leads/${lead.id}`);
      setSelectedLead(data);
      setShowDetail(true);
      loadReminders();
    } catch { toast.error('Erro ao carregar detalhes'); }
  };

  if (loading) return <Loading text="Carregando CRM..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">CRM</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus leads e conversões</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-60">
            <FiUpload /> {importing ? 'Importando...' : 'Importar Excel'}
          </button>
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
            <FiDownload /> Exportar Excel
          </button>
          <button onClick={() => { setShowReminders(!showReminders); if (!showReminders) loadReminders(); }}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
            <FiBell /> Lembretes
            {reminders.filter(r => !r.is_done).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {reminders.filter(r => !r.is_done).length}
              </span>
            )}
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors">
            <FiPlus className="text-lg" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Lembretes Panel */}
      {showReminders && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FiBell className="text-primary-500" /> Lembretes pendentes
            </h2>
            <button onClick={() => setShowReminders(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiX className="text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            {reminders.filter(r => !r.is_done).map(r => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <FiClock className="inline mr-1" />
                    {new Date(r.remind_at).toLocaleString('pt-BR')}
                    {r.lead_name && ` • ${r.lead_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleReminder(r.id, true)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                    Concluir
                  </button>
                </div>
              </div>
            ))}
            {reminders.filter(r => !r.is_done).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Nenhum lembrete pendente</p>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiUsers className="text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          {STATUS_FLOW.map(s => (
            <div key={s} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${STATUS_CONFIG[s].color}15` }}>
                  <FiHash style={{ color: STATUS_CONFIG[s].color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byStatus[s] || 0}</p>
                  <p className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone, CPF..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
          <FiFilter /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none">
              <option value="">Todos</option>
              {STATUS_FLOW.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Origem</label>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none">
              <option value="">Todas</option>
              {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_FLOW.map(status => {
          const config = STATUS_CONFIG[status];
          const columnLeads = leads.filter(l => l.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-72">
              <div className={`rounded-xl border ${config.border} ${config.bg} p-3 mb-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
                    {columnLeads.length}
                  </span>
                </div>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {columnLeads.map(lead => (
                  <div key={lead.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openLeadDetail(lead)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{lead.name}</h4>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {status !== 'new' && (
                          <button onClick={() => handleMoveLead(lead.id, STATUS_FLOW[STATUS_FLOW.indexOf(status) - 1])}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600" title="Mover para trás">
                            <FiArrowLeft className="text-xs" />
                          </button>
                        )}
                        {status !== 'lost' && status !== 'enrolled' && (
                          <button onClick={() => handleMoveLead(lead.id, STATUS_FLOW[STATUS_FLOW.indexOf(status) + 1])}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500" title="Avançar">
                            <FiArrowRight className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>
                    {lead.course_interest && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">📚 {lead.course_interest}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {lead.phone && <span className="flex items-center gap-1"><FiPhone />{lead.phone.slice(0, 10)}</span>}
                      {lead.whatsapp && (
                        <button onClick={e => { e.stopPropagation(); openWhatsAppChat(lead); }}
                          className="flex items-center gap-1 text-green-500 hover:text-green-600 font-medium" title="Abrir WhatsApp na plataforma">
                          <FiMessageSquare /> WhatsApp
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <FiCalendar /> {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {lead.interaction_count !== undefined && lead.interaction_count > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <FiMessageSquare /> {lead.interaction_count}
                        </span>
                      )}
                    </div>
                    {deleteConfirmId === lead.id && (
                      <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDeleteLead(lead.id)} className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
                      </div>
                    )}
                    {deleteConfirmId !== lead.id && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(lead.id); }}
                        className="mt-2 text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1">
                        <FiTrash2 /> Excluir
                      </button>
                    )}
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Panel */}
      {showDetail && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedLead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: `${STATUS_CONFIG[selectedLead.status]?.color}15`,
                    color: STATUS_CONFIG[selectedLead.status]?.color,
                  }}>{STATUS_CONFIG[selectedLead.status]?.label}</span>
                  <span className="text-xs text-gray-400">#{selectedLead.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selectedLead)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Editar">
                  <FiEye />
                </button>
                <button onClick={() => setShowDetail(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FiX className="text-lg text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dados de Contato</h3>
              {selectedLead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <FiMail className="text-gray-400 shrink-0" />
                  <a href={`mailto:${selectedLead.email}`} className="text-primary-500 hover:underline">{selectedLead.email}</a>
                </div>
              )}
              {selectedLead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <FiPhone className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.whatsapp && (
                <div className="flex items-center gap-3 text-sm">
                  <FiMessageSquare className="text-green-500 shrink-0" />
                  <button onClick={() => openWhatsAppChat(selectedLead)}
                    className="text-green-500 hover:underline flex items-center gap-1 font-medium" title="Abrir WhatsApp na plataforma">
                    {selectedLead.whatsapp} <FiMessageSquare className="text-xs" />
                  </button>
                </div>
              )}
              {selectedLead.cpf && (
                <div className="flex items-center gap-3 text-sm">
                  <FiHash className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{selectedLead.cpf}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <FiTag className="text-gray-400 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Origem: {SOURCE_OPTIONS.find(s => s.value === selectedLead.source)?.label || selectedLead.source}</span>
              </div>
              {selectedLead.course_interest && (
                <div className="flex items-center gap-3 text-sm">
                  <FiTrendingUp className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Interesse: {selectedLead.course_interest}</span>
                </div>
              )}
              {selectedLead.notes && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Notas</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedLead.notes}</p>
                </div>
              )}
              {/* Atendente responsável */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-500 mb-2">Atendente responsável</label>
                <div className="flex gap-2">
                  <select
                    value={selectedLead.assigned_to?.toString() || ''}
                    onChange={e => handleAssign(selectedLead.id, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none">
                    <option value="">Não atribuído</option>
                    {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {selectedLead.assigned_name && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <FiUser className="text-primary-500" /> {selectedLead.assigned_name}
                  </p>
                )}
              </div>
            </div>

            {/* Status Actions */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mover para</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.filter(s => s !== selectedLead.status).map(s => (
                  <button key={s} onClick={() => handleMoveLead(selectedLead.id, s)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:opacity-80"
                    style={{ borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color, backgroundColor: `${STATUS_CONFIG[s].color}10` }}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactions */}
            <div className="px-6 py-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Histórico de Contato</h3>

              {/* New Interaction Form */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex gap-2">
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none">
                    <option value="note">Nota</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Telefone</option>
                    <option value="email">Email</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="meeting">Reunião</option>
                  </select>
                  <select value={newDirection} onChange={e => setNewDirection(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none">
                    <option value="outbound">Enviado</option>
                    <option value="inbound">Recebido</option>
                  </select>
                  <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
                    placeholder="Assunto (opcional)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={2}
                      placeholder="Digite a mensagem ou nota..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none resize-none" />
                    {/* Botão respostas rápidas */}
                    <button
                      onClick={() => { setShowQuickMenu(!showQuickMenu); setQuickSearch(''); }}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-primary-50 text-primary-500 hover:bg-primary-100"
                      title="Respostas rápidas">
                      <FiZap className="text-sm" />
                    </button>
                    {showQuickMenu && (
                      <div className="absolute bottom-10 right-0 w-72 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-20">
                        <input type="text" value={quickSearch} onChange={e => setQuickSearch(e.target.value)}
                          placeholder="Buscar resposta..."
                          className="sticky top-0 w-full px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                          autoFocus />
                        {quickResponses.filter(q =>
                          q.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
                          q.content.toLowerCase().includes(quickSearch.toLowerCase())
                        ).map(q => (
                          <button key={q.id}
                            onClick={() => { setNewMessage(q.content); setShowQuickMenu(false); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{q.title}</p>
                            <p className="text-[11px] text-gray-500 truncate">{q.content}</p>
                          </button>
                        ))}
                        {quickResponses.filter(q =>
                          q.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
                          q.content.toLowerCase().includes(quickSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-center text-xs text-gray-400 py-4">Nenhuma resposta encontrada</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddInteraction} disabled={!newMessage.trim() || sendingMsg}
                    className="self-end px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
                    {sendingMsg ? '...' : 'Salvar'}
                  </button>
                </div>
              </div>

              {/* Lembretes do lead */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lembretes</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={reminderForm.title} onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                    placeholder="Título do lembrete"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none" />
                  <input type="datetime-local" value={reminderForm.remind_at} onChange={e => setReminderForm({ ...reminderForm, remind_at: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none" />
                  <button onClick={addReminder}
                    className="px-4 py-2 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600">
                    Criar
                  </button>
                </div>
                <div className="space-y-2">
                  {reminders.filter(r => r.lead_id === selectedLead.id).map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FiClock className="text-gray-400 shrink-0" />
                        <span className={`truncate ${r.is_done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{r.title}</span>
                        <span className="text-gray-400 shrink-0">{new Date(r.remind_at).toLocaleString('pt-BR')}</span>
                      </div>
                      {!r.is_done && (
                        <button onClick={() => toggleReminder(r.id, true)}
                          className="text-emerald-500 hover:text-emerald-600 font-semibold shrink-0">
                          Concluir
                        </button>
                      )}
                    </div>
                  ))}
                  {reminders.filter(r => r.lead_id === selectedLead.id).length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-2">Sem lembretes para este lead</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {(selectedLead.interactions || []).map(interaction => (
                  <div key={interaction.id} className="flex gap-3">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        interaction.type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                        interaction.type === 'email' ? 'bg-blue-100 text-blue-600' :
                        interaction.type === 'phone' ? 'bg-amber-100 text-amber-600' :
                        interaction.type === 'system' ? 'bg-gray-100 text-gray-500' :
                        'bg-violet-100 text-violet-600'
                      }`}>
                        {interaction.type === 'whatsapp' ? <FiMessageSquare className="text-sm" /> :
                         interaction.type === 'email' ? <FiMail className="text-sm" /> :
                         interaction.type === 'phone' ? <FiPhone className="text-sm" /> :
                         <FiClock className="text-sm" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{interaction.author_name || 'Sistema'}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(interaction.created_at).toLocaleString('pt-BR')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          interaction.direction === 'inbound' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {interaction.direction === 'inbound' ? 'Recebido' : 'Enviado'}
                        </span>
                      </div>
                      {interaction.subject && <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{interaction.subject}</p>}
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">{interaction.message}</p>
                    </div>
                  </div>
                ))}
                {(!selectedLead.interactions || selectedLead.interactions.length === 0) && (
                  <p className="text-center text-gray-400 text-sm py-4">Nenhuma interação registrada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Drawer */}
      {chatLead && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" onClick={closeWhatsAppChat}>
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={closeWhatsAppChat} className="p-1 rounded-lg hover:bg-emerald-500 shrink-0" title="Voltar">
                  <FiArrowLeft className="text-lg" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold truncate">{chatLead.name}</h2>
                  <p className="text-xs text-emerald-100 truncate">{chatLead.whatsapp || chatLead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {waConnected !== null && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
                    waConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {waConnected ? <FiWifi /> : <FiWifiOff />}
                    {waConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                )}
                <button onClick={closeWhatsAppChat} className="p-1 rounded-lg hover:bg-emerald-500" title="Fechar">
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
              {chatLoading && chatMessages.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Carregando conversa...</p>
              )}
              {!chatLoading && chatMessages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FiMessageSquare className="text-4xl mx-auto mb-3 opacity-50 text-green-500" />
                  <p className="text-sm">Nenhuma conversa ainda.</p>
                  <p className="text-xs mt-1">Envie a primeira mensagem para iniciar o atendimento pelo WhatsApp.</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.direction === 'outbound'
                      ? 'bg-emerald-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.direction === 'outbound' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shrink-0">
              <div className="flex items-end gap-2">
                <textarea value={chatText} onChange={e => setChatText(e.target.value)} rows={2}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  placeholder="Digite a mensagem..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none resize-none" />
                <button onClick={handleSendChat} disabled={!chatText.trim() || chatSending}
                  className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shrink-0">
                  <FiSend className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h2>
              <button onClick={() => { setShowLeadModal(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input type="text" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input type="text" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="(86) 99999-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
                  <input type="text" value={leadForm.whatsapp} onChange={e => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="(86) 99999-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                  <input type="text" value={leadForm.cpf} onChange={e => setLeadForm({ ...leadForm, cpf: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={leadForm.status} onChange={e => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                    {STATUS_FLOW.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
                  <select value={leadForm.source} onChange={e => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm">
                    {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Curso de Interesse</label>
                  <input type="text" value={leadForm.course_interest} onChange={e => setLeadForm({ ...leadForm, course_interest: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="Ex: Pedagogia, Administração..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea value={leadForm.notes} onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
                  placeholder="Observações sobre o lead..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => { setShowLeadModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={handleSaveLead} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50">
                <FiSave className="text-sm" /> {saving ? 'Salvando...' : editingLead ? 'Atualizar' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
