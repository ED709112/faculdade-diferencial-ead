'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiUpload, FiFile, FiVideo, FiLink, FiTrash2, FiDownload,
  FiBook, FiClock, FiFolder, FiPlus, FiX,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Discipline {
  id: number;
  name: string;
  workload: number;
  titulacao: string;
  ementa: string;
  objetivo: string;
  conteudo_programatico: string;
  metodologia: string;
  metodologia_ensino: string;
  avaliacao: string;
  recursos_didaticos: string;
  referencias: string;
  status: string;
}

interface Material {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_url: string;
  external_url: string;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  apostila: { label: 'Apostila', icon: FiBook, color: 'bg-blue-100 text-blue-600' },
  atividade: { label: 'Atividade', icon: FiFile, color: 'bg-emerald-100 text-emerald-600' },
  video: { label: 'Vídeo', icon: FiVideo, color: 'bg-red-100 text-red-600' },
  documento: { label: 'Documento', icon: FiFile, color: 'bg-gray-100 text-gray-600' },
  link: { label: 'Link', icon: FiLink, color: 'bg-violet-100 text-violet-600' },
  outro: { label: 'Outro', icon: FiFolder, color: 'bg-yellow-100 text-yellow-600' },
};

export default function DisciplineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', material_type: 'documento', external_url: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [discRes, matRes] = await Promise.allSettled([
        api.get(`/teacher/disciplines/${id}`),
        api.get(`/teacher/disciplines/${id}/materials`),
      ]);
      if (discRes.status === 'fulfilled') setDiscipline(discRes.value.data);
      if (matRes.status === 'fulfilled') setMaterials(matRes.value.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) { toast.error('Título é obrigatório.'); return; }
    if (uploadForm.material_type === 'link' && !uploadForm.external_url.trim()) {
      toast.error('URL é obrigatória para links.'); return;
    }
    if (uploadForm.material_type !== 'link' && !selectedFile) {
      toast.error('Selecione um arquivo.'); return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('material_type', uploadForm.material_type);
      if (uploadForm.material_type === 'link') {
        formData.append('external_url', uploadForm.external_url);
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      }
      await api.post(`/teacher/disciplines/${id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Material adicionado!');
      setShowUpload(false);
      setUploadForm({ title: '', description: '', material_type: 'documento', external_url: '' });
      setSelectedFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (matId: number) => {
    if (!confirm('Excluir este material?')) return;
    try {
      await api.delete(`/teacher/disciplines/${id}/materials/${matId}`);
      toast.success('Material excluído.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  if (loading) return <Loading text="Carregando disciplina..." />;
  if (!discipline) return <div className="text-center py-12 text-gray-500">Disciplina não encontrada.</div>;

  const sections = [
    { title: 'EMENTA', content: discipline.ementa },
    { title: 'OBJETIVO', content: discipline.objetivo },
    { title: 'CONTEÚDO PROGRAMÁTICO', content: discipline.conteudo_programatico },
    { title: 'METODOLOGIA', content: discipline.metodologia },
    { title: 'METODOLOGIA DO ENSINO', content: discipline.metodologia_ensino },
    { title: 'AVALIAÇÃO', content: discipline.avaliacao },
    { title: 'RECURSOS DIDÁTICOS', content: discipline.recursos_didaticos },
    { title: 'REFERÊNCIAS', content: discipline.referencias },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professor/disciplinas" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <FiArrowLeft className="text-lg text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{discipline.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {discipline.workload > 0 && <span className="flex items-center gap-1"><FiClock className="text-xs" /> {discipline.workload}h</span>}
            {discipline.titulacao && <span>{discipline.titulacao}</span>}
          </div>
        </div>
      </div>

      {/* Ementa Sections */}
      <div className="space-y-4">
        {sections.filter(s => s.content).map(section => (
          <div key={section.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-primary-600 dark:text-primary-400 mb-3 uppercase tracking-wide text-sm">{section.title}</h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{section.content}</div>
          </div>
        ))}
      </div>

      {/* Materiais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Materiais da Disciplina</h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors"
          >
            <FiPlus /> Adicionar Material
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Novo Material</h3>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                <FiX className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Título do material *"
                value={uploadForm.title}
                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <select
                value={uploadForm.material_type}
                onChange={e => setUploadForm({ ...uploadForm, material_type: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="apostila">Apostila</option>
                <option value="atividade">Atividade</option>
                <option value="video">Vídeo</option>
                <option value="documento">Documento</option>
                <option value="link">Link Externo</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <textarea
              placeholder="Descrição (opcional)"
              rows={2}
              value={uploadForm.description}
              onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {uploadForm.material_type === 'link' ? (
              <input
                placeholder="https://..."
                value={uploadForm.external_url}
                onChange={e => setUploadForm({ ...uploadForm, external_url: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.jpg,.jpeg,.png"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
              />
            )}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiUpload /> {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}

        {/* Materials List */}
        {materials.length === 0 ? (
          <div className="text-center py-8">
            <FiFolder className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum material adicionado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map(mat => {
              const cfg = typeConfig[mat.material_type] || typeConfig.outro;
              const TypeIcon = cfg.icon;
              return (
                <div key={mat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color.split(' ')[0]}`}>
                    <TypeIcon className={`text-sm ${cfg.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{mat.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.label} • {new Date(mat.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {mat.file_url && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Baixar/Abrir"
                      >
                        <FiDownload />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
