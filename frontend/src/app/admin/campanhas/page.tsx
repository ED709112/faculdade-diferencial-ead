'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSend, FiPlay, FiPause, FiUsers, FiX,
  FiUpload, FiImage, FiLink, FiMessageSquare, FiCheck, FiClock,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
  active: { label: 'Ativa', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  paused: { label: 'Pausada', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  completed: { label: 'Concluída', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

const REC_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  sent: { label: 'Enviado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  error: { label: 'Erro', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  skipped: { label: 'Ignorado', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const EMPTY_FORM = {
  id: 0, name: '', message: '', message_reminder: '', message_urgency: '',
  reminder_days: '3', urgency_days: '6',
  poster_url: '', course_id: '', course_name: '', enrollment_link: '',
};

export default function AdminCampanhasPage() {
  const [tab, setTab] = useState<'campanhas' | 'contatos' | 'config'>('campanhas');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [recCampaign, setRecCampaign] = useState('');
  const [recStatus, setRecStatus] = useState('all');

  const [configForm, setConfigForm] = useState({
    promo_active: '1', promo_send_start: '8', promo_send_end: '20',
    promo_max_per_hour: '20', promo_interval_seconds: '25', site_url: 'https://fadead.com.br',
  });
  const [configSaving, setConfigSaving] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/admin/promo/stats'); setStats(data); } catch { /* ignore */ }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try { const { data } = await api.get('/admin/promo/campaigns'); setCampaigns(Array.isArray(data) ? data : []); } catch { /* ignore */ }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (recCampaign) params.campaign_id = recCampaign;
      if (recStatus && recStatus !== 'all') params.status = recStatus;
      const { data } = await api.get('/admin/promo/records', { params });
      setRecords(data.data || []);
    } catch { /* ignore */ }
  }, [recCampaign, recStatus]);

  const fetchCourses = useCallback(async () => {
    try { const { data } = await api.get('/cursos'); setCourses(Array.isArray(data) ? data : []); } catch { /* ignore */ }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/promo/config');
      const map: any = {};
      (Array.isArray(data) ? data : []).forEach((c: any) => { map[c.key] = c.value; });
      setConfigForm({
        promo_active: map.promo_active ?? '1',
        promo_send_start: map.promo_send_start ?? '8',
        promo_send_end: map.promo_send_end ?? '20',
        promo_max_per_hour: map.promo_max_per_hour ?? '20',
        promo_interval_seconds: map.promo_interval_seconds ?? '25',
        site_url: map.site_url ?? 'https://fadead.com.br',
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStats(); fetchCampaigns(); fetchCourses(); fetchConfig(); }, [fetchStats, fetchCampaigns, fetchCourses, fetchConfig]);
  useEffect(() => {
    if (tab === 'contatos') {
      const t = setTimeout(fetchRecords, 300);
      return () => clearTimeout(t);
    }
    setLoading(false);
  }, [tab, fetchRecords]);

  const openNew = () => { setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c: any) => {
    setForm({
      id: c.id, name: c.name, message: c.message || '', message_reminder: c.message_reminder || '',
      message_urgency: c.message_urgency || '', reminder_days: String(c.reminder_days ?? 3),
      urgency_days: String(c.urgency_days ?? 6),
      poster_url: c.poster_url || '',
      course_id: c.course_id ? String(c.course_id) : '', course_name: c.course_name || '',
      enrollment_link: c.enrollment_link || '',
    });
    setShowModal(true);
  };

  const onCourseChange = (val: string) => {
    const course = courses.find((x) => String(x.id) === val);
    setForm((f) => ({
      ...f,
      course_id: val,
      course_name: course ? course.title : '',
      enrollment_link: course ? `/matricula?curso=${course.id}` : '',
    }));
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/uploads/image', fd);
      setForm((f) => ({ ...f, poster_url: data.url }));
      toast.success('Cartaz enviado!');
    } catch { toast.error('Erro ao enviar cartaz'); }
  };

  const previewLink = () => {
    if (form.enrollment_link) return form.enrollment_link.startsWith('http') ? form.enrollment_link : `${configForm.site_url}${form.enrollment_link}`;
    if (form.course_id) return `${configForm.site_url}/matricula?curso=${form.course_id}`;
    return `${configForm.site_url}/matricula`;
  };

  const previewMessage = () => {
    return (form.message || '')
      .replace(/\{nome\}/g, 'MARIA DA SILVA')
      .replace(/\{curso\}/g, form.course_name || 'Curso')
      .replace(/\{link\}/g, previewLink());
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) { toast.error('Nome e mensagem são obrigatórios'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name, message: form.message,
        message_reminder: form.message_reminder || null,
        message_urgency: form.message_urgency || null,
        reminder_days: form.reminder_days,
        urgency_days: form.urgency_days,
        poster_url: form.poster_url || null,
        course_id: form.course_id ? parseInt(form.course_id) : null,
        course_name: form.course_name || null,
        enrollment_link: form.enrollment_link || null,
      };
      if (form.id) { await api.put(`/admin/promo/campaigns/${form.id}`, payload); toast.success('Campanha atualizada!'); }
      else { await api.post('/admin/promo/campaigns', payload); toast.success('Campanha criada!'); }
      setShowModal(false);
      fetchCampaigns(); fetchStats();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleBuild = async (id: number) => {
    try {
      const { data } = await api.post(`/admin/promo/campaigns/${id}/build`, { source: 'importação' });
      toast.success(data.message || 'Lista gerada!');
      fetchCampaigns(); fetchStats();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Erro ao gerar lista'); }
  };

  const toggleStatus = async (c: any) => {
    const next = c.status === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/admin/promo/campaigns/${c.id}`, { status: next });
      toast.success(next === 'active' ? 'Campanha ativada!' : 'Campanha pausada');
      fetchCampaigns(); fetchStats();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Erro ao atualizar'); }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`Excluir a campanha "${c.name}" e seus contatos?`)) return;
    try {
      await api.delete(`/admin/promo/campaigns/${c.id}`);
      toast.success('Campanha excluída');
      fetchCampaigns(); fetchStats();
    } catch { toast.error('Erro ao excluir'); }
  };

  const handleSendNow = async (id: number) => {
    try {
      const { data } = await api.post(`/admin/promo/records/${id}/send-now`);
      toast.success(`Enviado para ${data.phone}`);
      fetchRecords(); fetchStats();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Erro ao enviar'); }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await api.put('/admin/promo/config', configForm);
      toast.success('Configurações salvas!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setConfigSaving(false); }
  };

  if (loading && tab !== 'contatos') return <Loading text="Carregando campanhas..." />;

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const btnPrimary = 'inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-sm';
  const btnGhost = 'inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campanhas WhatsApp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Divulgue novos cursos com cartaz e link de matrícula</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('config')} className={btnGhost}>Configurações</button>
          <button onClick={openNew} className={btnPrimary}><FiPlus /> Nova Campanha</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Campanhas', value: stats.campaigns ?? 0 },
          { label: 'Ativas', value: stats.active ?? 0 },
          { label: 'Enviadas', value: stats.sent ?? 0 },
          { label: 'Enviadas hoje', value: stats.sent_today ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {([['campanhas', 'Campanhas'], ['contatos', 'Contatos'], ['config', 'Configurações']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === key
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab Campanhas */}
      {tab === 'campanhas' && (
        <div className="grid gap-4">
          {campaigns.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-500">
              Nenhuma campanha ainda. Crie a primeira para divulgar um curso.
            </div>
          )}
          {campaigns.map((c) => {
            const progress = c.total_records > 0 ? Math.round((c.sent_count / c.total_records) * 100) : 0;
            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_META[c.status]?.cls}`}>{STATUS_META[c.status]?.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {c.course_name ? `Curso: ${c.course_name}` : 'Sem curso específico'} · {c.sent_count}/{c.total_records} concluídos
                      {c.message_reminder && c.message_urgency && ' · Sequência 3 msgs'}
                      {c.message_reminder && !c.message_urgency && ' · Sequência 2 msgs'}
                    </p>
                    {c.poster_url && <p className="text-xs text-gray-400 mt-0.5 truncate">Cartaz: {c.poster_url}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleBuild(c.id)} className={btnGhost} title="Gerar lista de contatos (leads importados)"><FiUsers /> Gerar contatos</button>
                    {(c.status === 'draft' || c.status === 'paused') && (
                      <button onClick={() => toggleStatus(c)} className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors text-sm"><FiPlay /> Iniciar</button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => toggleStatus(c)} className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors text-sm"><FiPause /> Pausar</button>
                    )}
                    <button onClick={() => openEdit(c)} className={btnGhost}><FiEdit2 /></button>
                    <button onClick={() => handleDelete(c)} className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm"><FiTrash2 /></button>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Contatos */}
      {tab === 'contatos' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select value={recCampaign} onChange={(e) => setRecCampaign(e.target.value)} className={inputCls + ' max-w-xs'}>
              <option value="">Todas as campanhas</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={recStatus} onChange={(e) => setRecStatus(e.target.value)} className={inputCls + ' max-w-xs'}>
              <option value="all">Todos os status</option>
              {Object.entries(REC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="text-sm text-gray-500">{records.length} contato(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-2 pr-3 font-medium">Campanha</th>
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">WhatsApp</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Enviado em</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-2 pr-3">{r.campaign_name}</td>
                    <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="py-2 pr-3">{r.whatsapp}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${REC_STATUS[r.status]?.cls}`}>{REC_STATUS[r.status]?.label}</span>
                      {r.last_error && <p className="text-xs text-red-500 mt-1 max-w-xs truncate">{r.last_error}</p>}
                    </td>
                    <td className="py-2 pr-3 text-gray-500">{r.sent_at ? new Date(r.sent_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="py-2">
                      {(r.status === 'pending' || r.status === 'error') && (
                        <button onClick={() => handleSendNow(r.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"><FiSend /> Enviar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum contato encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Config */}
      {tab === 'config' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 max-w-xl">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Gotejamento de envio</h2>
          <div className="grid gap-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={configForm.promo_active === '1'}
                onChange={(e) => setConfigForm({ ...configForm, promo_active: e.target.checked ? '1' : '0' })}
                className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Envios automáticos ativos</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Início (hora)</span>
                <input type="number" min={0} max={23} value={configForm.promo_send_start} onChange={(e) => setConfigForm({ ...configForm, promo_send_start: e.target.value })} className={inputCls + ' mt-1'} />
              </label>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fim (hora)</span>
                <input type="number" min={0} max={23} value={configForm.promo_send_end} onChange={(e) => setConfigForm({ ...configForm, promo_send_end: e.target.value })} className={inputCls + ' mt-1'} />
              </label>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Máx. por hora</span>
                <input type="number" min={1} value={configForm.promo_max_per_hour} onChange={(e) => setConfigForm({ ...configForm, promo_max_per_hour: e.target.value })} className={inputCls + ' mt-1'} />
              </label>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Intervalo (seg)</span>
                <input type="number" min={1} value={configForm.promo_interval_seconds} onChange={(e) => setConfigForm({ ...configForm, promo_interval_seconds: e.target.value })} className={inputCls + ' mt-1'} />
              </label>
            </div>
            <label className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">URL do site (para links e cartazes)</span>
              <input type="text" value={configForm.site_url} onChange={(e) => setConfigForm({ ...configForm, site_url: e.target.value })} className={inputCls + ' mt-1'} />
            </label>
            <button onClick={handleSaveConfig} disabled={configSaving} className={btnPrimary + ' justify-center disabled:opacity-60'}>
              <FiCheck /> {configSaving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Campanha */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">{form.id ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX /></button>
            </div>
            <div className="p-5 grid gap-4">
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nome da campanha *</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Novos cursos - Pedagogia" className={inputCls + ' mt-1'} />
              </label>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Curso divulgado</span>
                <select value={form.course_id} onChange={(e) => onCourseChange(e.target.value)} className={inputCls + ' mt-1'}>
                  <option value="">Nenhum (mensagem geral)</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Link de matrícula</span>
                <input type="text" value={form.enrollment_link} onChange={(e) => setForm({ ...form, enrollment_link: e.target.value })} placeholder="Ex: /matricula?curso=1" className={inputCls + ' mt-1'} />
              </label>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400 block">Cartaz (imagem opcional)</span>
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                    <FiUpload /> Enviar cartaz
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                  </label>
                  {form.poster_url && (
                    <button onClick={() => setForm({ ...form, poster_url: '' })} className="text-xs text-red-500 font-semibold hover:underline">Remover</button>
                  )}
                </div>
                {form.poster_url && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.poster_url} alt="cartaz" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    <span className="text-xs text-gray-500 truncate">{form.poster_url}</span>
                  </div>
                )}
              </div>
              <label className="text-sm">
                <span className="text-gray-600 dark:text-gray-400 block">Mensagem *</span>
                <span className="text-xs text-gray-400">Use {'{nome}'} {'{curso}'} e {'{link}'}</span>
                <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={'Olá {nome}! A Faculdade Diferencial abriu as matrículas para o curso de {curso}.\nMatricule-se agora: {link}'} className={inputCls + ' mt-1 font-mono'} />
              </label>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
                Sequência automática (opcional): a campanha envia o lembrete e a urgência somente se o contato <b>não responder</b>. Quando a pessoa responde, a sequência para e o lead vira contato/interessado no CRM.
              </div>
              <label className="text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span>Lembrete (opcional)</span>
                  <input type="number" min={1} max={60} value={form.reminder_days} onChange={(e) => setForm({ ...form, reminder_days: e.target.value })} className={inputCls + ' !w-20 text-center'} />
                  <span className="text-xs">dias após o 1º envio</span>
                </span>
                <textarea rows={3} value={form.message_reminder} onChange={(e) => setForm({ ...form, message_reminder: e.target.value })} placeholder={'Olá {nome}! Vimos que você ainda não confirmou. As vagas do curso de {curso} estão se encerrando. Garanta a sua: {link}'} className={inputCls + ' mt-1 font-mono'} />
              </label>
              <label className="text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span>Urgência (opcional)</span>
                  <input type="number" min={1} max={60} value={form.urgency_days} onChange={(e) => setForm({ ...form, urgency_days: e.target.value })} className={inputCls + ' !w-20 text-center'} />
                  <span className="text-xs">dias após o 1º envio</span>
                </span>
                <textarea rows={3} value={form.message_urgency} onChange={(e) => setForm({ ...form, message_urgency: e.target.value })} placeholder={'Última chamada {nome}! Últimas vagas do curso de {curso}. Matricule-se hoje: {link}'} className={inputCls + ' mt-1 font-mono'} />
              </label>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><FiMessageSquare /> Pré-visualização</p>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{previewMessage()}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><FiLink /> {previewLink()}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className={btnGhost}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className={btnPrimary + ' disabled:opacity-60'}>
                <FiCheck /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
