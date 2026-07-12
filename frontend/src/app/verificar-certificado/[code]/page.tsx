'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiHash,
  FiUser,
  FiBookOpen,
  FiArrowLeft,
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';

interface CertificateData {
  certificate_code: string;
  user_name: string;
  course_title: string;
  teacher_name: string;
  final_grade: number | null;
  workload_hours: number;
  issued_at: string;
}

export default function VerificarCertificadoPage() {
  const params = useParams();
  const code = params?.code as string;
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    api.get(`/certificates/verify/${code}`)
      .then(({ data }) => {
        setValid(data.valid);
        setCertificate(data.certificate);
        if (!data.valid) setError(data.message || 'Certificado inválido.');
      })
      .catch(() => {
        setValid(false);
        setError('Certificado não encontrado.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Verificando certificado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <FiArrowLeft /> Voltar ao início
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500" />
          <div className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
              valid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {valid ? (
                <FiCheckCircle className="text-4xl text-green-500" />
              ) : (
                <FiXCircle className="text-4xl text-red-500" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {valid ? 'Certificado Válido' : 'Certificado Inválido'}
            </h1>

            {error && (
              <p className="text-gray-500 mb-6">{error}</p>
            )}

            {valid && certificate && (
              <div className="space-y-5 mt-6 text-left">
                <div className="flex justify-center mb-4">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verificar-certificado/${certificate.certificate_code}`}
                    size={120}
                    level="M"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-primary-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Aluno</p>
                      <p className="text-sm font-medium text-gray-900">{certificate.user_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiBookOpen className="text-primary-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Curso</p>
                      <p className="text-sm font-medium text-gray-900">{certificate.course_title}</p>
                    </div>
                  </div>
                  {certificate.teacher_name && (
                    <div className="flex items-center gap-3">
                      <FiAward className="text-primary-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Professor</p>
                        <p className="text-sm font-medium text-gray-900">{certificate.teacher_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <FiClock className="text-primary-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Carga Horária</p>
                      <p className="text-sm font-medium text-gray-900">{certificate.workload_hours} horas</p>
                    </div>
                  </div>
                  {certificate.final_grade != null && (
                    <div className="flex items-center gap-3">
                      <FiHash className="text-primary-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Nota Final</p>
                        <p className="text-sm font-medium text-gray-900">{Number(certificate.final_grade).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Código de Verificação</p>
                  <p className="font-mono font-bold text-primary-700 tracking-wider text-sm">
                    {certificate.certificate_code}
                  </p>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Emitido em {formatDate(certificate.issued_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
