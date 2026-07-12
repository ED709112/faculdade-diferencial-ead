'use client';

import React, { useState, useEffect } from 'react';
import {
  FiGlobe,
  FiEye,
  FiCreditCard,
  FiMail,
  FiShield,
  FiSave,
  FiUpload,
  FiSend,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

type Tab = 'geral' | 'visual' | 'pagamento' | 'email' | 'lgpd';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'geral', label: 'Geral', icon: FiGlobe },
  { key: 'visual', label: 'Visual', icon: FiEye },
  { key: 'pagamento', label: 'Pagamento', icon: FiCreditCard },
  { key: 'email', label: 'E-mail', icon: FiMail },
  { key: 'lgpd', label: 'LGPD', icon: FiShield },
];

interface Settings {
  site_name: string;
  site_description: string;
  site_email: string;
  site_phone: string;
  site_address: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  payment_gateway: string;
  payment_api_key: string;
  payment_secret_key: string;
  efibank_client_id: string;
  efibank_client_secret: string;
  efibank_pix_key: string;
  efibank_certificate_path: string;
  efibank_certificate_password: string;
  efibank_environment: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from: string;
  lgpd_consent_text: string;
  lgpd_privacy_policy: string;
}

export default function AdminConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    site_name: '',
    site_description: '',
    site_email: '',
    site_phone: '',
    site_address: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#1a56db',
    secondary_color: '#f97316',
    payment_gateway: 'efibank',
    payment_api_key: '',
    payment_secret_key: '',
    efibank_client_id: '',
    efibank_client_secret: '',
    efibank_pix_key: '',
    efibank_certificate_path: '',
    efibank_certificate_password: '',
    efibank_environment: 'sandbox',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
    lgpd_consent_text: '',
    lgpd_privacy_policy: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings((prev) => ({ ...prev, ...(data.settings || data) }));
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Configurações salvas com sucesso');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      await api.post('/settings/test-email', {
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        smtp_from: settings.smtp_from,
      });
      toast.success('E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar e-mail de teste');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <Loading text="Carregando configurações..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Personalize a plataforma</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <FiSave /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="text-base" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6">
          {activeTab === 'geral' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Site</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Faculdade Diferencial EAD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={settings.site_description}
                  onChange={(e) => handleChange('site_description', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Plataforma de ensino superior a distância..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    value={settings.site_email}
                    onChange={(e) => handleChange('site_email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="contato@faculdade.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={settings.site_phone}
                    onChange={(e) => handleChange('site_phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={settings.site_address}
                  onChange={(e) => handleChange('site_address', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="Rua Exemplo, 123 - Cidade, Estado"
                />
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Aparência Visual</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo do Site</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <FiUpload className="text-2xl text-gray-300" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo muito grande. Máx 2MB.'); return; }
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const { data } = await api.post('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                          handleChange('logo_url', data.url);
                          toast.success('Logo enviada com sucesso');
                        } catch { toast.error('Erro ao enviar logo'); }
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Escolher arquivo
                    </button>
                    <p className="text-xs text-gray-500 mt-1">PNG, SVG ou JPG. Máx 2MB.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain rounded" />
                    ) : (
                      <FiUpload className="text-lg text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    id="favicon-upload"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo muito grande. Máx 2MB.'); return; }
                      const formData = new FormData();
                      formData.append('image', file);
                      try {
                        const { data } = await api.post('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        handleChange('favicon_url', data.url);
                        toast.success('Favicon enviado com sucesso');
                      } catch { toast.error('Erro ao enviar favicon'); }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Escolher arquivo
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 mb-2">Pré-visualização</p>
                <div className="flex gap-3">
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: settings.primary_color }}>
                    Botão Primário
                  </div>
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: settings.secondary_color }}>
                    Botão Secundário
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagamento' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Pagamento</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gateway de Pagamento</label>
                <select
                  value={settings.payment_gateway}
                  onChange={(e) => handleChange('payment_gateway', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="efibank">Efíbank (PIX, Boleto, Cartão)</option>
                  <option value="asaas">Asaas</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="pagseguro">PagSeguro</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>

              {settings.payment_gateway === 'efibank' && (
                <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">Efi</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Efíbank</p>
                      <p className="text-xs text-gray-500">PIX, Boleto e Cartão de Crédito</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                      <input
                        type="password"
                        value={settings.efibank_client_id || ''}
                        onChange={(e) => handleChange('efibank_client_id', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="Client_Id_xxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                      <input
                        type="password"
                        value={settings.efibank_client_secret || ''}
                        onChange={(e) => handleChange('efibank_client_secret', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="Client_Secret_xxxxxxxx"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX (Efi)</label>
                    <input
                      type="text"
                      value={settings.efibank_pix_key || ''}
                      onChange={(e) => handleChange('efibank_pix_key', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="Sua chave PIX (CPF, e-mail, aleatória ou CNPJ)"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caminho do Certificado (.p12)</label>
                      <input
                        type="text"
                        value={settings.efibank_certificate_path || ''}
                        onChange={(e) => handleChange('efibank_certificate_path', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="/caminho/para/certificado.p12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha do Certificado</label>
                      <input
                        type="password"
                        value={settings.efibank_certificate_password || ''}
                        onChange={(e) => handleChange('efibank_certificate_password', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="Senha do certificado P12"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                    <select
                      value={settings.efibank_environment || 'sandbox'}
                      onChange={(e) => handleChange('efibank_environment', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="sandbox">Sandbox (Homologação)</option>
                      <option value="production">Produção</option>
                    </select>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Como configurar:</strong>
                    </p>
                    <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                      <li>Crie uma conta em <a href="https://sejaefi.com.br" target="_blank" className="underline">sejaefi.com.br</a></li>
                      <li>No dashboard, vá em <strong>API &gt; Minhas Aplicações</strong> e gere o Client_ID e Client_Secret</li>
                      <li>Vá em <strong>API &gt; Meus Certificados</strong> e gere um certificado P12 (baixe apenas 1 vez!)</li>
                      <li>Cadastre uma chave PIX em <strong>PIX &gt; Minhas Chaves</strong></li>
                      <li>Cole os dados acima e reinicie o servidor backend</li>
                    </ol>
                  </div>
                </div>
              )}

              {settings.payment_gateway !== 'efibank' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave de API</label>
                    <input
                      type="password"
                      value={settings.payment_api_key}
                      onChange={(e) => handleChange('payment_api_key', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="sk_xxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave Secreta</label>
                    <input
                      type="password"
                      value={settings.payment_secret_key}
                      onChange={(e) => handleChange('payment_secret_key', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="sk_live_xxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> As chaves de API e certificados são dados sensíveis. Nunca as compartilhe ou exponha em códigos-fonte públicos.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de E-mail (SMTP)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host SMTP</label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
                  <input
                    type="text"
                    value={settings.smtp_port}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário SMTP</label>
                <input
                  type="text"
                  value={settings.smtp_user}
                  onChange={(e) => handleChange('smtp_user', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="seu-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha SMTP</label>
                <input
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => handleChange('smtp_password', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Remetente</label>
                <input
                  type="email"
                  value={settings.smtp_from}
                  onChange={(e) => handleChange('smtp_from', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  placeholder="noreply@faculdade.com"
                />
              </div>
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50"
              >
                <FiSend /> {sendingTest ? 'Enviando...' : 'Enviar E-mail de Teste'}
              </button>
            </div>
          )}

          {activeTab === 'lgpd' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">LGPD - Proteção de Dados</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Consentimento</label>
                <textarea
                  rows={4}
                  value={settings.lgpd_consent_text}
                  onChange={(e) => handleChange('lgpd_consent_text', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Ao se cadastrar, você concorda com a nossa Política de Privacidade e os Termos de Uso..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Política de Privacidade</label>
                <textarea
                  rows={8}
                  value={settings.lgpd_privacy_policy}
                  onChange={(e) => handleChange('lgpd_privacy_policy', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Política de Privacidade completa da plataforma..."
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>LGPD:</strong> Certifique-se de que os textos estejam em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
