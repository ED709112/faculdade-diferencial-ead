'use client';

import React, { useState, useEffect } from 'react';
import {
  FiZap, FiBell, FiGlobe, FiArchive, FiPlus, FiTrash2, FiEdit2,
  FiSend, FiX, FiCheck, FiClock, FiDownload, FiRefreshCw,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface QuickResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  is_active: number;
}

interface FollowUpRule {
  id: number;
  name: string;
  from_status: string;
  to_status: string;
  days_waiting: number;
  is_active: number;
}

interface Webhook {
  id: number;
  name: string;
  url: string;
  event: string;
  is_active: number;
  created_at: string;
}

interface Backup {
  id: number;
  file_name: string;
  file_size: number;
  type: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo', contacted: 'Contato', interested: 'Interessado',
  enrolled: 'Matriculado', lost: 'Perdido',
};

const WEBHOOK_EVENTS = [
  { value: 'lead.created', label: 'Lead criado' },
];

export default function AdminCRMConfigPage() {
  const [tab, setTab] = useState<'quick' | 'rules' | 'webhooks' | 'backups'>('quick');
  const [loading, setLoading] = useState(true);

  // Quick responses
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [quickForm, setQuickForm] = useState({ title: '', content: '', category: 'geral' });
  const [editingQuick, setEditingQuick] = useState<QuickResponse | null>(null);

  // Follow up rules
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [ruleForm, setRuleForm] = useState({ name: '', from_status: 'new', to_status: 'contacted', days_waiting: 3 });
  const [editingRule, setEditingRule] = useState<FollowUpRule | null>(null);

  // Webhooks
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', event: 'lead.created' });
  const [testing, setTesting] = useState<string | null>(null);

  // Backups
  const [backups, setBackups] = useState<Backup[]>([]);
  const [runningBackup, setRunningBackup] = useState(false);

  const loadAll = async () => {
    try {
      const [quickRes, rulesRes, hooksRes, backupsRes] = await Promise.allSettled([
        api.get('/crm/quick-responses'),
        api.get('/crm/follow-up-rules'),
        api.get('/crm/webhooks'),
        api.get('/crm/backups'),
      ]);
      if (quickRes.status === 'fulfilled') setQuickResponses(quickRes.value.data || []);
      if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.data || []);
      if (hooksRes.status === 'fulfilled') setWebhooks(hooksRes.value.data || []);
      if (backupsRes.status === 'fulfilled') setBackups(backupsRes.value.data || []);
    } catch {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <Loading text="Carregando configurações do CRM..." />;

  const TABS = [
    { key: 'quick' as const, label: 'Respostas Rápidas', icon: FiZap },
    { key: 'rules' as const, label: 'Follow-up Automático', icon: FiClock },
    { key: 'webhooks' as const, label: 'Webhooks / API', icon: FiGlobe },
    { key: 'backups' as const, label: 'Backups', icon: FiArchive },
  ];

  const resetQuickForm = () => {
    setQuickForm({ title: '', content: '', category: 'geral' });
    setEditingQuick(null);
  };

  const saveQuickResponse = async () => {
    if (!quickForm.title.trim() || !quickForm.content.trim()) { toast.error('Título e conteúdo são obrigatórios'); return; }
    try {
      if (editingQuick) {
        await api.put(`/crm/quick-responses/${editingQuick.id}`, quickForm);
        toast.success('Resposta atualizada!');
      } else {
        await api.post('/crm/quick-responses', quickForm);
        toast.success('Resposta criada!');
      }
      resetQuickForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const toggleQuickResponse = async (qr: QuickResponse) => {
    try {
      await api.put(`/crm/quick-responses/${qr.id}`, { is_active: qr.is_active ? 0 : 1 });
      loadAll();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const deleteQuickResponse = async (id: number) => {
    try {
      await api.delete(`/crm/quick-responses/${id}`);
      toast.success('Removida!');
      loadAll();
    } catch { toast.error('Erro ao remover'); }
  };

  const saveRule = async () => {
    if (!ruleForm.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (ruleForm.from_status === ruleForm.to_status) { toast.error('Status de origem e destino devem ser diferentes'); return; }
    try {
      if (editingRule) {
        await api.put(`/crm/follow-up-rules/${editingRule.id}`, ruleForm);
        toast.success('Regra atualizada!');
      } else {
        await api.post('/crm/follow-up-rules', ruleForm);
        toast.success('Regra criada!');
      }
      setRuleForm({ name: '', from_status: 'new', to_status: 'contacted', days_waiting: 3 });
      setEditingRule(null);
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const toggleRule = async (rule: FollowUpRule) => {
    try {
      await api.put(`/crm/follow-up-rules/${rule.id}`, { is_active: rule.is_active ? 0 : 1 });
      loadAll();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const deleteRule = async (id: number) => {
    try {
      await api.delete(`/crm/follow-up-rules/${id}`);
      toast.success('Regra removida!');
      loadAll();
    } catch { toast.error('Erro ao remover'); }
  };

  const saveWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) { toast.error('Nome e URL são obrigatórios'); return; }
    try {
      await api.post('/crm/webhooks', webhookForm);
      toast.success('Webhook criado!');
      setWebhookForm({ name: '', url: '', event: 'lead.created' });
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    }
  };

  const toggleWebhook = async (wh: Webhook) => {
    try {
      await api.put(`/crm/webhooks/${wh.id}`, { is_active: wh.is_active ? 0 : 1 });
      loadAll();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const deleteWebhook = async (id: number) => {
    try {
      await api.delete(`/crm/webhooks/${id}`);
      toast.success('Webhook removido!');
      loadAll();
    } catch { toast.error('Erro ao remover'); }
  };

  const testWebhook = async (wh: Webhook) => {
    setTesting(wh.id.toString());
    try {
      const { data } = await api.post('/crm/webhooks/test', { url: wh.url });
      if (data.success) toast.success(`Teste OK (HTTP ${data.status})`);
      else toast.error(`Falha no teste (HTTP ${data.status}): ${data.error || ''}`);
    } catch { toast.error('Erro no teste'); }
    finally { setTesting(null); }
  };

  const runBackup = async () => {
    setRunningBackup(true);
    try {
      await api.post('/crm/backups/run');
      toast.success('Backup realizado!');
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao realizar backup');
    } finally { setRunningBackup(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações do CRM</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Respostas rápidas, automações, integrações e backups</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
            }`}>
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {/* ============ RESPOSTAS RÁPIDAS ============ */}
      {tab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingQuick ? 'Editar resposta' : 'Nova resposta rápida'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input type="text" value={quickForm.title} onChange={e => setQuickForm({ ...quickForm, title: e.target.value })}
                  className={inputCls} placeholder="Ex: Mensagem de boas-vindas" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <input type="text" value={quickForm.category} onChange={e => setQuickForm({ ...quickForm, category: e.target.value })}
                  className={inputCls} placeholder="Ex: matrícula, valores, documentação" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo</label>
                <textarea value={quickForm.content} onChange={e => setQuickForm({ ...quickForm, content: e.target.value })} rows={5}
                  className={`${inputCls} resize-none`} placeholder="Texto da resposta..." />
              </div>
              <div className="flex gap-3">
                <button onClick={saveQuickResponse} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600">
                  <FiPlus /> {editingQuick ? 'Atualizar' : 'Salvar'}
                </button>
                {editingQuick && (
                  <button onClick={resetQuickForm} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Cancelar edição
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Respostas salvas ({quickResponses.length})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {quickResponses.map(qr => (
                <div key={qr.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{qr.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600">{qr.category}</span>
                        {!qr.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Inativa</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap line-clamp-3">{qr.content}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingQuick(qr); setQuickForm({ title: qr.title, content: qr.content, category: qr.category }); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" title="Editar">
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button onClick={() => toggleQuickResponse(qr)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" title={qr.is_active ? 'Desativar' : 'Ativar'}>
                        {qr.is_active ? <FiCheck className="text-sm text-green-500" /> : <FiX className="text-sm text-red-500" />}
                      </button>
                      <button onClick={() => deleteQuickResponse(qr.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Excluir">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {quickResponses.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Nenhuma resposta salva ainda</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ FOLLOW-UP AUTOMÁTICO ============ */}
      {tab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {editingRule ? 'Editar regra' : 'Nova regra de follow-up'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Leads que permanecem em um status por N dias serão movidos automaticamente para outro status.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input type="text" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className={inputCls} placeholder="Ex: Novo → Interessado após 3 dias" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De</label>
                  <select value={ruleForm.from_status} onChange={e => setRuleForm({ ...ruleForm, from_status: e.target.value })}
                    className={inputCls}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para</label>
                  <select value={ruleForm.to_status} onChange={e => setRuleForm({ ...ruleForm, to_status: e.target.value })}
                    className={inputCls}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dias sem contato</label>
                <input type="number" min={1} value={ruleForm.days_waiting}
                  onChange={e => setRuleForm({ ...ruleForm, days_waiting: parseInt(e.target.value) || 1 })}
                  className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button onClick={saveRule} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600">
                  <FiPlus /> {editingRule ? 'Atualizar' : 'Salvar regra'}
                </button>
                {editingRule && (
                  <button onClick={() => { setEditingRule(null); setRuleForm({ name: '', from_status: 'new', to_status: 'contacted', days_waiting: 3 }); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Regras ativas ({rules.filter(r => r.is_active).length}/{rules.length})</h2>
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rule.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {STATUS_LABELS[rule.from_status]} → {STATUS_LABELS[rule.to_status]} após {rule.days_waiting} dia(s)
                      </p>
                      {!rule.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 mt-1 inline-block">Desativada</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleRule(rule)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" title={rule.is_active ? 'Desativar' : 'Ativar'}>
                        {rule.is_active ? <FiCheck className="text-sm text-green-500" /> : <FiX className="text-sm text-red-500" />}
                      </button>
                      <button onClick={() => deleteRule(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Excluir">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Nenhuma regra criada. As automações rodam a cada 5 minutos.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ WEBHOOKS ============ */}
      {tab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Novo webhook</h2>
            <p className="text-xs text-gray-500 mb-4">
              Receba notificações HTTP quando eventos acontecerem no CRM (ex: novo lead). O payload é enviado em JSON:
              {' '}<code className="text-primary-500">{'{ event, payload, timestamp }'}</code>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input type="text" value={webhookForm.name} onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  className={inputCls} placeholder="Ex: Meu sistema externo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de destino</label>
                <input type="url" value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  className={inputCls} placeholder="https://seusistema.com/webhook/lead" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evento</label>
                <select value={webhookForm.event} onChange={e => setWebhookForm({ ...webhookForm, event: e.target.value })}
                  className={inputCls}>
                  {WEBHOOK_EVENTS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                </select>
              </div>
              <button onClick={saveWebhook} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600">
                <FiPlus /> Criar webhook
              </button>
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Webhooks configurados ({webhooks.length})</h2>
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{wh.name}</span>
                        {!wh.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Inativo</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 break-all">{wh.url}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 mt-1 inline-block">{WEBHOOK_EVENTS.find(e => e.value === wh.event)?.label || wh.event}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => testWebhook(wh)} disabled={!!testing}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" title="Testar envio">
                        <FiSend className={`text-sm ${testing === wh.id.toString() ? 'animate-pulse' : ''}`} />
                      </button>
                      <button onClick={() => toggleWebhook(wh)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" title={wh.is_active ? 'Desativar' : 'Ativar'}>
                        {wh.is_active ? <FiCheck className="text-sm text-green-500" /> : <FiX className="text-sm text-red-500" />}
                      </button>
                      <button onClick={() => deleteWebhook(wh.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Excluir">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Nenhum webhook configurado</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ BACKUPS ============ */}
      {tab === 'backups' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Backups do banco de dados</h2>
              <p className="text-xs text-gray-500 mt-1">
                Backup automático diário às 03:00. Os últimos 14 backups são mantidos.
              </p>
            </div>
            <button onClick={runBackup} disabled={runningBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50">
              <FiRefreshCw className={runningBackup ? 'animate-spin' : ''} /> {runningBackup ? 'Executando...' : 'Fazer backup agora'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 pr-4">Arquivo</th>
                  <th className="pb-3 pr-4">Tamanho</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-3 pr-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FiArchive className="text-gray-400" /> <span className="break-all">{b.file_name}</span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{(b.file_size / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="py-3 pr-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">banco de dados</span></td>
                    <td className="py-3 text-gray-500">{new Date(b.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Nenhum backup registrado ainda</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
