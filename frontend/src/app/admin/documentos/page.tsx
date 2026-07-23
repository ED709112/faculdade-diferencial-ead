'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFile,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiX,
  FiSearch,
  FiFilter,
  FiUser,
  FiCheck,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface AdminDocument {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  document_type: string;
  document_type_label: string;
  document_url: string;
  original_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface DocStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
  approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700', icon: FiCheckCircle },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-700', icon: FiXCircle },
};

const DOCUMENT_TYPES: Record<string, string> = {
  rg: 'RG', cpf: 'CPF', comprovante_residencia: 'Comprovante de Residência',
  certificado_ensino_medio: 'Certificado Ensino Médio', diploma_graduacao: 'Diploma de Graduação',
  titulo_eleitoral: 'Título de Eleitor', certidao_nascimento: 'Certidão de Nascimento',
  foto_3x4: 'Foto 3x4', outros: 'Outros'
};

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [stats, setStats] = useState<DocStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [reviewModal, setReviewModal] = useState<AdminDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [docsRes, statsRes] = await Promise.allSettled([
        api.get('/admin/documents'),
        api.get('/admin/documents/stats'),
      ]);
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.data.documents || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectReason.trim()) {
      toast.error('Informe o motivo da recusa.');
      return;
    }
    try {
      await api.patch(`/admin/documents/${id}/review`, {
        status,
        rejection_reason: status === 'rejected' ? rejectReason : null,
      });
      toast.success(`Documento ${status === 'approved' ? 'aprovado' : 'recusado'} com sucesso!`);
      setReviewModal(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao revisar documento.');
    }
  };

  const filteredDocs = documents.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.user_name?.toLowerCase().includes(q) || d.user_email?.toLowerCase().includes(q) ||
        d.document_type_label?.toLowerCase().includes(q) || d.original_name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <Loading text="Carregando documentos..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos dos Alunos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revise e aprove/recuse documentos enviados pelos alunos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['pending', 'approved', 'rejected'] as const).map(status => {
          const cfg = statusConfig[status];
          const count = stats[status] || documents.filter(d => d.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                filter === status ? 'border-primary-400 dark:border-primary-500 ring-1 ring-primary-200' : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cfg.color.split(' ')[0]}`}>
                <cfg.icon className={`text-sm ${cfg.color.split(' ')[1]}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</p>
            </button>
          );
        })}
        <button
          onClick={() => setFilter('all')}
          className={`bg-white dark:bg-gray-800 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            filter === 'all' ? 'border-primary-400 dark:border-primary-500 ring-1 ring-primary-200' : 'border-gray-100 dark:border-gray-700'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100">
            <FiFile className="text-sm text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || documents.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por aluno, email ou tipo de documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Lista */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiFile className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Arquivo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Enviado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const cfg = statusConfig[doc.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                            <FiUser className="text-xs text-primary-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{doc.user_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900 dark:text-white font-medium">{doc.document_type_label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs truncate block max-w-[180px]">{doc.original_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <StatusIcon className="inline w-3 h-3 mr-1" />
                          {cfg.label}
                        </span>
                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate">{doc.rejection_reason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <FiEye />
                          </button>
                          {doc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setReviewModal(doc); setRejectReason(''); }}
                                className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Aprovar"
                              >
                                <FiCheck />
                              </button>
                              <button
                                onClick={() => { setReviewModal(doc); setRejectReason(''); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Recusar"
                              >
                                <FiXCircle />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewDoc.document_type_label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {previewDoc.user_name} • {previewDoc.original_name}
                </p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {previewDoc.document_url.endsWith('.pdf') ? (
                <iframe src={previewDoc.document_url} className="w-full h-[60vh] rounded-xl" title="Documento" />
              ) : (
                <img src={previewDoc.document_url} alt={previewDoc.document_type_label} className="w-full rounded-xl object-contain max-h-[60vh]" />
              )}
            </div>
            {previewDoc.status === 'pending' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                <button
                  onClick={() => { setReviewModal(previewDoc); setPreviewDoc(null); setRejectReason(''); }}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <FiCheck /> Aprovar
                </button>
                <button
                  onClick={() => { setReviewModal(previewDoc); setPreviewDoc(null); }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <FiXCircle /> Recusar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Review */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setReviewModal(null); setRejectReason(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Revisar Documento
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {reviewModal.document_type_label} de {reviewModal.user_name}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reviewModal.user_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{reviewModal.user_email}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleReview(reviewModal.id, 'approved')}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FiCheckCircle /> Aprovar
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo da Recusa (obrigatório para recusar)</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Documento ilegível, foto borrada, arquivo corrompido..."
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={() => handleReview(reviewModal.id, 'rejected')}
                  disabled={!rejectReason.trim()}
                  className="mt-2 w-full px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiXCircle /> Recusar Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
