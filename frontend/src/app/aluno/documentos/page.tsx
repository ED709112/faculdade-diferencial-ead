'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrash2,
  FiEye,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface StudentDocument {
  id: number;
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

const DOCUMENT_TYPES = [
  { value: 'rg', label: 'RG', description: 'Registro Geral (frente e verso)' },
  { value: 'cpf', label: 'CPF', description: 'Cadastro de Pessoa Física' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência', description: 'Conta de luz, água, telefone ou bank statement' },
  { value: 'certificado_ensino_medio', label: 'Certificado Ensino Médio', description: 'Certificado ou diploma do ensino médio' },
  { value: 'diploma_graduacao', label: 'Diploma de Graduação', description: 'Diploma de curso superior (se aplicável)' },
  { value: 'titulo_eleitoral', label: 'Título de Eleitor', description: 'Título de eleitor' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento', description: 'Certidão de nascimento ou casamento' },
  { value: 'foto_3x4', label: 'Foto 3x4', description: 'Foto recente tipo passe' },
  { value: 'outros', label: 'Outros', description: 'Outros documentos relevantes' },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
  approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700', icon: FiCheckCircle },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-700', icon: FiXCircle },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/documents');
      setDocuments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!selectedType) { toast.error('Selecione o tipo de documento.'); return; }
    if (!selectedFile) { toast.error('Selecione um arquivo.'); return; }
    if (selectedFile.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 10MB.'); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document_type', selectedType);
      formData.append('document', selectedFile);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Documento enviado com sucesso!');
      setSelectedType('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Documento excluído.');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  const filteredDocs = documents.filter(d => filter === 'all' || d.status === filter);
  const approvedTypes = documents.filter(d => d.status === 'approved').map(d => d.document_type);

  const missingDocs = DOCUMENT_TYPES.filter(dt =>
    !documents.some(d => d.document_type === dt.value && d.status !== 'rejected')
  );

  if (loading) return <Loading text="Carregando documentos..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Documentos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envie seus documentos para validação pela administração
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['pending', 'approved', 'rejected'] as const).map(status => {
          const cfg = statusConfig[status];
          const count = documents.filter(d => d.status === status).length;
          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cfg.color.split(' ')[0]}`}>
                <cfg.icon className={`text-sm ${cfg.color.split(' ')[1]}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</p>
            </div>
          );
        })}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100">
            <FiFile className="text-sm text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enviar Documento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Documento</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
            {selectedType && (
              <p className="text-xs text-gray-400 mt-1">
                {DOCUMENT_TYPES.find(d => d.value === selectedType)?.description}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo (PDF, JPG, PNG — máx. 10MB)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedType || !selectedFile}
              className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiUpload className="text-base" />
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>

      {/* Documentos Pendentes */}
      {missingDocs.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Documentos ainda não enviados</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingDocs.map(dt => (
                  <span key={dt.value} className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs font-medium">
                    {dt.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'Todos' : statusConfig[f].label}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'all' ? documents.length : documents.filter(d => d.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Lista de Documentos */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiFile className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => {
            const cfg = statusConfig[doc.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <FiFile className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.document_type_label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.original_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    {doc.reviewed_at && ` • Revisado em ${new Date(doc.reviewed_at).toLocaleDateString('pt-BR')}`}
                  </p>
                  {doc.status === 'rejected' && doc.rejection_reason && (
                    <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">Motivo da recusa:</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{doc.rejection_reason}</p>
                    </div>
                  )}
                  {doc.status === 'approved' && doc.reviewed_by_name && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Aprovado por {doc.reviewed_by_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <StatusIcon className="inline w-3 h-3 mr-1" />
                    {cfg.label}
                  </span>
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <FiEye />
                  </button>
                  {doc.status !== 'approved' && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewDoc.document_type_label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{previewDoc.original_name}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {previewDoc.document_url.endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.document_url}
                  className="w-full h-[60vh] rounded-xl"
                  title="Documento"
                />
              ) : (
                <img
                  src={previewDoc.document_url}
                  alt={previewDoc.document_type_label}
                  className="w-full rounded-xl object-contain max-h-[60vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
