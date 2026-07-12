'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiCheck,
  FiDownload,
  FiCopy,
  FiExternalLink,
  FiArrowLeft,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

function ComprovanteContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const payment = searchParams.get('payment');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
            <FiArrowLeft /> Voltar ao site
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-4xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Matrícula Realizada!</h1>
          <p className="text-gray-500">Sua matrícula foi registrada com sucesso</p>
        </div>

        {/* Enrollment Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Código da Matrícula</h2>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <code className="flex-1 text-xl font-mono font-bold text-primary-600 tracking-wider">{code || '---'}</code>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 flex items-center gap-2 text-sm"
            >
              <FiCopy /> {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Guarde este código para acompanhar sua matrícula</p>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instruções de Pagamento</h2>

          {/* Boleto */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <FiClock className="text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Boleto Bancário</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  O boleto será gerado e enviado para seu e-mail em até 5 minutos.
                  Prazo de vencimento: <strong>3 dias úteis</strong>.
                </p>
                <div className="mt-3 bg-white rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-gray-500 mb-1">Código de barras do boleto:</p>
                  <p className="font-mono text-sm text-gray-800 break-all">
                    {payment ? `03399.${payment}.00000 00000.000000 00000.000000 0 ${payment?.slice(-1)} 00000000000000` : 'Gerando...'}
                  </p>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  <FiAlertCircle className="inline mr-1" />
                  O boleto também estará disponível para download no seu painel de aluno.
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Próximos Passos</h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal pl-4">
              <li>Aguarde o boleto no seu e-mail (ou acesse o painel de aluno)</li>
              <li>Efetue o pagamento no banco ou internet banking</li>
              <li>Após a confirmação do pagamento, o acesso será liberado automaticamente</li>
              <li>Use seu e-mail e senha para acessar a plataforma</li>
            </ol>
          </div>
        </div>

        {/* Credentials Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados de Acesso</h2>
          <p className="text-sm text-gray-600 mb-4">
            Após a confirmação do pagamento, você receberá um e-mail com:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">E-mail de acesso</p>
              <p className="font-medium text-gray-900">Será enviado após pagamento</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Senha de acesso</p>
              <p className="font-medium text-gray-900">Será enviada por e-mail</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 text-center"
          >
            Já tenho conta - Entrar
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-center"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComprovantePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <ComprovanteContent />
    </Suspense>
  );
}
