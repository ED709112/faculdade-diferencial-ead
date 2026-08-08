'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FiSettings, FiMessageSquare, FiSend, FiZap, FiUsers, FiClock,
  FiCheck, FiX, FiSave, FiRefreshCw, FiEye, FiEyeOff, FiPhone,
  FiWifi, FiWifiOff, FiMessageCircle, FiUser, FiSearch,
  FiChevronDown, FiPlay, FiRotateCcw, FiHash, FiCpu as FiBot,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface ChatConfig {
  [key: string]: string;
}

interface Conversation {
  id: number;
  phone: string;
  contact_name: string;
  status: string;
  lead_id?: number;
  last_message?: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  messages?: Message[];
}

interface Message {
  id: number;
  conversation_id: number;
  direction: string;
  message_type: string;
  content: string;
  is_bot: number;
  created_at: string;
}

interface ChatStats {
  totalConversations: number;
  activeConversations: number;
  humanConversations: number;
  todayMessages: number;
  todayBotMessages: number;
  todayHumanMessages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Bot Ativo', color: 'text-green-600', bg: 'bg-green-50' },
  paused: { label: 'Pausado', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  bot: { label: 'Bot', color: 'text-blue-600', bg: 'bg-blue-50' },
  human: { label: 'Humano', color: 'text-purple-600', bg: 'bg-purple-50' },
  closed: { label: 'Fechado', color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function AdminChatbotPage() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'config' | 'test'>('conversations');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ChatConfig>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingAI, setTestingAI] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrInstance, setQrInstance] = useState('faculdade');
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrStatus, setQrStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchConversations(); }, [search, filterStatus]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedConv) refreshConversation(selectedConv.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedConv]);

  useEffect(() => {
    if (!showQR) return;
    const timer = setInterval(() => checkQrStatus(), 3000);
    return () => clearInterval(timer);
  }, [showQR, qrInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const fetchData = async () => {
    try {
      const [configRes, statsRes, convRes, waRes] = await Promise.allSettled([
        api.get('/chatbot/config'),
        api.get('/chatbot/stats'),
        api.get('/chatbot/conversations'),
        api.get('/chatbot/whatsapp/status'),
      ]);
      if (configRes.status === 'fulfilled') setConfig(configRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (convRes.status === 'fulfilled') setConversations(convRes.value.data || []);
      if (waRes.status === 'fulfilled') setWhatsappStatus(waRes.value.data);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  };

  const fetchConversations = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/chatbot/conversations', { params });
      setConversations(data || []);
    } catch {}
  };

  const refreshConversation = async (id: number) => {
    try {
      const { data } = await api.get(`/chatbot/conversations/${id}`);
      setSelectedConv(data);
    } catch {}
  };

  const handleSendManual = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    setSending(true);
    try {
      await api.post('/chatbot/messages', {
        conversation_id: selectedConv.id,
        content: newMessage,
      });
      setNewMessage('');
      await refreshConversation(selectedConv.id);
      fetchConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar');
    } finally { setSending(false); }
  };

  const handleUpdateStatus = async (convId: number, status: string) => {
    try {
      await api.put(`/chatbot/conversations/${convId}`, { status });
      toast.success(`Status alterado para ${STATUS_CONFIG[status]?.label}`);
      fetchConversations();
      if (selectedConv?.id === convId) refreshConversation(convId);
    } catch { toast.error('Erro ao atualizar'); }
  };

  const handleReconnect = async (instance: string) => {
    setQrInstance(instance);
    setShowQR(true);
    setQrData(null);
    setQrLoading(true);
    try {
      const { data } = await api.get('/chatbot/whatsapp/qr', { params: { instance } });
      setQrData(data);
    } catch {
      toast.error('Erro ao gerar QR code');
    } finally { setQrLoading(false); }
  };

  const checkQrStatus = async () => {
    try {
      const { data } = await api.get('/chatbot/whatsapp/status', { params: { instance: qrInstance } });
      setQrStatus(data);
      if ((data?.instance?.state || data?.state) === 'open') {
        toast.success('WhatsApp conectado!');
        setShowQR(false);
        setQrData(null);
        fetchData();
      }
    } catch {}
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put('/chatbot/config', config);
      toast.success('Configurações salvas!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSavingConfig(false); }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) return;
    setTestingAI(true);
    setTestResponse('');
    try {
      const { data } = await api.post('/chatbot/test-ai', { message: testMessage });
      setTestResponse(data.response);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao testar IA');
    } finally { setTestingAI(false); }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <Loading text="Carregando chatbot..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chatbot IA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">WhatsApp + ChatGPT integrado</p>
        </div>
        <div className="flex items-center gap-2">
          {whatsappStatus && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              whatsappStatus.state === 'open' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {whatsappStatus.state === 'open' ? <FiWifi /> : <FiWifiOff />}
              {whatsappStatus.state === 'open' ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </span>
          )}
          <button onClick={() => handleReconnect('faculdade')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
            <FiRefreshCw /> Reconectar WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Conversas', value: stats.totalConversations, icon: FiMessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Ativas (Bot)', value: stats.activeConversations, icon: FiBot, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Atendimento Humano', value: stats.humanConversations, icon: FiUser, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Mensagens Hoje', value: stats.todayMessages, icon: FiMessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Respostas Bot', value: stats.todayBotMessages, icon: FiZap, color: 'text-cyan-500', bg: 'bg-cyan-50' },
            { label: 'Humanas Hoje', value: stats.todayHumanMessages, icon: FiUsers, color: 'text-violet-500', bg: 'bg-violet-50' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`text-lg ${card.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                  <p className="text-[10px] text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {([
          { key: 'conversations', label: 'Conversas', icon: FiMessageSquare },
          { key: 'config', label: 'Configurações', icon: FiSettings },
          { key: 'test', label: 'Testar IA', icon: FiZap },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.key ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="flex gap-4 h-[600px]">
          {/* Conversation List */}
          <div className="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 space-y-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs outline-none">
                <option value="">Todos os status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map(conv => (
                <div key={conv.id}
                  onClick={() => refreshConversation(conv.id)}
                  className={`p-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedConv?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500' : ''
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{conv.contact_name || conv.phone}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[conv.status]?.bg} ${STATUS_CONFIG[conv.status]?.color}`}>
                      {STATUS_CONFIG[conv.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">{conv.last_message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <FiPhone className="text-[9px]" /> {conv.phone}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FiMessageCircle className="text-4xl mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma conversa</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedConv.contact_name}</h3>
                  <span className="text-xs text-gray-400">{selectedConv.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedConv.status} onChange={e => handleUpdateStatus(selectedConv.id, e.target.value)}
                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold bg-white dark:bg-gray-700 outline-none">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                {selectedConv.messages?.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.direction === 'outbound'
                        ? msg.is_bot ? 'bg-primary-500 text-white rounded-br-md' : 'bg-green-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-600'
                    }`}>
                      {msg.is_bot && msg.direction === 'outbound' && (
                        <div className="flex items-center gap-1 mb-1">
                          <FiBot className="text-[10px] opacity-70" />
                          <span className="text-[10px] opacity-70">Bot</span>
                        </div>
                      )}
                      {!msg.is_bot && msg.direction === 'outbound' && (
                        <div className="flex items-center gap-1 mb-1">
                          <FiUser className="text-[10px] opacity-70" />
                          <span className="text-[10px] opacity-70">Atendente</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendManual()}
                    placeholder="Digite uma resposta..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  <button onClick={handleSendManual} disabled={!newMessage.trim() || sending}
                    className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                    <FiSend />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                  Digite <strong>atendente</strong> para transferir para humano
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="text-center text-gray-400">
                <FiMessageSquare className="text-5xl mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold">Selecione uma conversa</p>
                <p className="text-sm mt-1">Ou aguarde novas mensagens no WhatsApp</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* OpenAI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiZap className="text-green-500" /> OpenAI (ChatGPT)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <div className="relative">
                  <input type={showPasswords['openai_api_key'] ? 'text' : 'password'} value={config.openai_api_key || ''}
                    onChange={e => updateConfig('openai_api_key', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
                    placeholder="sk-..." />
                  <button onClick={() => setShowPasswords(p => ({ ...p, openai_api_key: !p.openai_api_key }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasswords['openai_api_key'] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                <select value={config.openai_model || 'gpt-4o-mini'} onChange={e => updateConfig('openai_model', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none">
                  <option value="gpt-4o-mini">GPT-4o Mini (rápido + barato)</option>
                  <option value="gpt-4o">GPT-4o (melhor qualidade)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (mais barato)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Tokens por Resposta</label>
                <input type="number" value={config.max_tokens || '300'} onChange={e => updateConfig('max_tokens', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt do Sistema</label>
                <textarea value={config.bot_system_prompt || ''} onChange={e => updateConfig('bot_system_prompt', e.target.value)} rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiPhone className="text-green-500" /> WhatsApp (Evolution API)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da API</label>
                <input type="text" value={config.whatsapp_api_url || ''} onChange={e => updateConfig('whatsapp_api_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none"
                  placeholder="http://localhost:8080" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instância</label>
                <input type="text" value={config.whatsapp_instance || ''} onChange={e => updateConfig('whatsapp_instance', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <div className="relative">
                  <input type={showPasswords['whatsapp_api_key'] ? 'text' : 'password'} value={config.whatsapp_api_key || ''}
                    onChange={e => updateConfig('whatsapp_api_key', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
                  <button onClick={() => setShowPasswords(p => ({ ...p, whatsapp_api_key: !p.whatsapp_api_key }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasswords['whatsapp_api_key'] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL (configure na Evolution API)</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/chatbot/webhook`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 outline-none" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/chatbot/webhook`); toast.success('Copiado!'); }}
                    className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 transition-colors">Copiar</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiBot className="text-primary-500" /> Mensagens do Bot
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Bot</label>
                <input type="text" value={config.bot_name || ''} onChange={e => updateConfig('bot_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Palavra-chave (Humano)</label>
                <input type="text" value={config.human_takeover_keyword || ''} onChange={e => updateConfig('human_takeover_keyword', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem de Boas-vindas</label>
                <textarea value={config.bot_welcome_message || ''} onChange={e => updateConfig('bot_welcome_message', e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem Fora do Horário</label>
                <textarea value={config.outside_hours_message || ''} onChange={e => updateConfig('outside_hours_message', e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário Início</label>
                <input type="time" value={config.working_hours_start || '08:00'} onChange={e => updateConfig('working_hours_start', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário Fim</label>
                <input type="time" value={config.working_hours_end || '22:00'} onChange={e => updateConfig('working_hours_end', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={config.auto_reply === 'true'}
                    onChange={e => updateConfig('auto_reply', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar respostas automáticas</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveConfig} disabled={savingConfig}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors">
              <FiSave /> {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}

      {/* Test AI Tab */}
      {activeTab === 'test' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <FiZap className="text-green-500" /> Testar ChatGPT
            </h3>
            <p className="text-sm text-gray-500 mb-4">Simule uma conversa antes de ativar o bot no WhatsApp</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem do aluno</label>
                <div className="flex gap-2">
                  <textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={3}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none resize-none"
                    placeholder="Ex: Olá! Quais cursos vocês oferecem?" />
                  <button onClick={handleTestAI} disabled={!testMessage.trim() || testingAI}
                    className="self-end px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {testingAI ? <FiRotateCcw className="animate-spin" /> : <FiPlay />}
                    {testingAI ? 'Testando...' : 'Testar'}
                  </button>
                </div>
              </div>

              {testResponse && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBot className="text-primary-500" />
                    <span className="text-sm font-semibold text-primary-600">Resposta do ChatGPT:</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowQR(false); setQrData(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiWifi className="text-emerald-500" /> Conectar WhatsApp
              </h3>
              <button onClick={() => { setShowQR(false); setQrData(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <select value={qrInstance} onChange={e => handleReconnect(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none">
                <option value="faculdade">Número principal (86) 99493-4404</option>
                <option value="divulgacao">Divulgação (86) 99439-5019</option>
              </select>
              <button onClick={() => handleReconnect(qrInstance)} disabled={qrLoading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                <FiRefreshCw className={qrLoading ? 'animate-spin' : ''} /> Gerar
              </button>
            </div>

            {qrLoading && !qrData && (
              <div className="text-center py-10 text-gray-400">
                <FiRefreshCw className="animate-spin text-3xl mx-auto mb-3" />
                <p className="text-sm">Gerando QR code...</p>
              </div>
            )}

            {!qrLoading && !qrData && (
              <div className="text-center py-10 text-gray-400">
                <FiWifiOff className="text-3xl mx-auto mb-3" />
                <p className="text-sm">Clique em "Gerar" para obter o QR code</p>
              </div>
            )}

            {qrData && (
              <div className="space-y-4">
                {qrData.base64 ? (
                  <div className="flex justify-center bg-white p-4 rounded-xl border border-gray-200">
                    <img src={qrData.base64.startsWith('data:image') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                      alt="QR Code WhatsApp" className="w-56 h-56" />
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500">{qrData.error || 'QR code indisponível'}</p>
                )}
                {qrData.pairingCode && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Ou use o código de pareamento no WhatsApp:</p>
                    <p className="text-xl font-bold tracking-wider text-gray-900 dark:text-gray-100">{qrData.pairingCode}</p>
                  </div>
                )}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-xs text-emerald-700 dark:text-emerald-300">
                  No WhatsApp do celular: <b>Ajustes → Dispositivos conectados → Conectar um dispositivo</b> e escaneie o QR.
                </div>
                {qrStatus && (qrStatus?.instance?.state || qrStatus?.state) === 'close' && (
                  <p className="text-center text-xs text-gray-400">Aguardando escaneamento... (verifica a cada 3s)</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
