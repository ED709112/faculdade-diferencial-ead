'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiAward,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Certificate {
  id: number;
  certificate_code: string;
  course_title: string;
  course_slug: string;
  issued_at: string;
  workload_hours: number;
  final_grade?: number;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyModal, setVerifyModal] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/certificates/my');
      setCertificates(data.certificates || data.data || data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDownload = async (certId: number, courseTitle: string) => {
    try {
      const { data, headers } = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificado-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao baixar certificado');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  if (loading) return <Loading text="Carregando certificados..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meus Certificados</h2>
        <p className="text-gray-500 text-sm mt-1">
          Todos os seus certificados de conclusão em um só lugar
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<FiAward />}
          title="Nenhum certificado encontrado"
          description="Conclua seus cursos para receber certificados."
          action={{ label: 'Ver Meus Cursos', href: '/aluno/cursos' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                    <FiAward className="text-2xl text-primary-500" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <FiCheckCircle className="text-green-500" /> Válido
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  {cert.course_title}
                </h3>

                <div className="space-y-2 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-green-500 shrink-0" />
                    <span>Concluído em {formatDate(cert.issued_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400 shrink-0" />
                    <span>Carga horária: {cert.workload_hours}h</span>
                  </div>
                  {cert.final_grade != null && (
                    <div className="flex items-center gap-2">
                      <FiHash className="text-gray-400 shrink-0" />
                      <span>Nota: {Number(cert.final_grade).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleDownload(cert.id, cert.course_title)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <FiDownload /> Baixar PDF
                  </button>
                  <button
                    onClick={() => setVerifyModal(cert)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <FiExternalLink /> Verificar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setVerifyModal(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX className="text-lg" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <FiAward className="text-3xl text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Verificação de Certificado
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Use o código ou QR Code abaixo para validar este certificado
              </p>

              <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center p-2">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verificar-certificado/${verifyModal.certificate_code}`}
                  size={160}
                  level="M"
                  bgColor="white"
                  fgColor="#1a1a1a"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Código de verificação</p>
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {verifyModal.certificate_code}
                </p>
              </div>

              <p className="text-xs text-gray-400">
                Curso: {verifyModal.course_title}
              </p>
              <p className="text-xs text-gray-400">
                Data de conclusão: {formatDate(verifyModal.issued_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
