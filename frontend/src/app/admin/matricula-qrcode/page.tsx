'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiCopy, FiCheck, FiShare2, FiInstagram, FiFacebook, FiGlobe } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const SOURCES = [
  { id: 'instagram', label: 'Instagram', icon: FiInstagram, color: 'bg-pink-50 text-pink-600' },
  { id: 'facebook', label: 'Facebook', icon: FiFacebook, color: 'bg-blue-50 text-blue-600' },
  { id: 'whatsapp', label: 'WhatsApp', icon: FiShare2, color: 'bg-green-50 text-green-600' },
  { id: 'google', label: 'Google Ads', icon: FiGlobe, color: 'bg-amber-50 text-amber-600' },
  { id: 'social', label: 'Redes Sociais', icon: FiShare2, color: 'bg-purple-50 text-purple-600' },
];

export default function MatriculaQRCodePage() {
  const [selectedSource, setSelectedSource] = useState('instagram');
  const [qrUrl, setQrUrl] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const base = `${window.location.origin}/matricula`;
    const ref = selectedSource !== 'default' ? `?ref=${selectedSource}` : '';
    const url = `${base}${ref}`;
    setPageUrl(url);
    setQrUrl(`${window.location.origin}/api/crm/qrcode?source=${selectedSource}`);
  }, [selectedSource]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `matricula-${selectedSource}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Faça sua matrícula na Faculdade Diferencial! ${pageUrl}`)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">QR Code de Matrícula</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gere links e QR codes para divulgar nas redes sociais</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SOURCES.map(src => (
          <button key={src.id} onClick={() => setSelectedSource(src.id)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${selectedSource === src.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-xl ${src.color} flex items-center justify-center mx-auto mb-2`}>
              <src.icon className="text-lg" />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{src.label}</p>
          </button>
        ))}
      </div>

      {/* QR Code + Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">QR Code</h3>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code" className="w-56 h-56 rounded-xl shadow-sm border border-gray-100" />
              <button onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all">
                <FiDownload /> Baixar PNG
              </button>
            </div>
          )}
        </div>

        {/* Link + Share */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Link para Compartilhar</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={pageUrl}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 outline-none" />
              <button onClick={handleCopy}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors">
                {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Compartilhar</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={whatsappShare}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition-all text-sm">
                  <FiShare2 /> WhatsApp
                </button>
                <button onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success('Link copiado!'); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-all text-sm">
                  <FiCopy /> Copiar Link
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Como usar:</p>
              <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Escolha a rede social no topo</li>
                <li>Baixe o QR Code para usar em posts</li>
                <li>Copie o link para colocar na bio</li>
                <li>Leads serão criados automaticamente no CRM</li>
                <li>Acompanhe os leads em <strong>Admin → CRM</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Prévia da Página</h3>
        <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl border border-gray-100 p-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FiShare2 className="text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Invista no seu Futuro</h4>
            <p className="text-sm text-gray-500 mb-4">Deixe seus dados e entraremos em contato!</p>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="h-8 bg-gray-100 rounded-lg mb-3" />
              <div className="h-8 bg-gray-100 rounded-lg mb-3" />
              <div className="h-8 bg-gray-100 rounded-lg mb-3" />
              <div className="h-10 bg-primary-500 rounded-xl" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">O link {pageUrl ? `(${pageUrl})` : ''} já está ativo e criando leads no CRM!</p>
      </div>
    </div>
  );
}