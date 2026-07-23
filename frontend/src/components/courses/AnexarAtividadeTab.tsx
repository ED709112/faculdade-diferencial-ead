'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiUpload, FiFile, FiFileText, FiCheckCircle, FiXCircle,
  FiClock, FiDownload, FiTrash2, FiSend, FiAlertCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DisciplineMaterial {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_url: string;
  external_url: string;
  created_at: string;
}

interface CourseDiscipline {
  id: number;
  name: string;
  materials: DisciplineMaterial[];
}

interface Module {
  id: number;
  title: string;
  lessons: { id: number; title: string; file_url?: string; type: string }[];
}

interface Submission {
  id: number;
  discipline_id: number;
  discipline_name: string;
  title: string;
  description: string;
  file_url: string;
  status: 'pending' | 'graded' | 'rejected';
  grade: number | null;
  max_grade: number;
  feedback: string | null;
  created_at: string;
}

interface Props {
  courseId: string;
  disciplines: CourseDiscipline[];
  modules: Module[];
}

export default function AnexarAtividadeTab({ courseId, disciplines, modules }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number>(disciplines[0]?.id || 0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true);
      const { data } = await api.get('/submissions/student');
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleSubmit = async () => {
    if (!selectedDiscipline) {
      toast.error('Selecione uma disciplina.');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe o título da atividade.');
      return;
    }
    if (!file) {
      toast.error('Anexe o arquivo da atividade.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('discipline_id', String(selectedDiscipline));
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('file', file);

      await api.post('/submissions/student', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Atividade enviada com sucesso!');
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar atividade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta submissão?')) return;
    try {
      await api.delete(`/submissions/student/${id}`);
      toast.success('Submissão excluída.');
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: 'Aguardando correção', icon: FiClock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    graded: { label: 'Corrigido', icon: FiCheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected: { label: 'Rejeitado', icon: FiXCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Anexar Atividade</h3>

      {/* Download Section */}
      {modules.some(m => (m.lessons || []).some(l => l.file_url)) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Materiais do Curso (referência)</h4>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-48 overflow-y-auto">
            {modules.map((module) => {
              const materials = (module.lessons || []).filter((l) => l.file_url);
              if (materials.length === 0) return null;
              return materials.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFileText className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{lesson.title}</span>
                  </div>
                  <a href={lesson.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-500 hover:text-primary-600 text-xs font-medium shrink-0">
                    <FiDownload /> Baixar
                  </a>
                </div>
              ));
            })}
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FiSend className="text-primary-500" /> Enviar Atividade
        </h4>

        <div className="space-y-4">
          {/* Discipline Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={0}>Selecione a disciplina</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título da Atividade</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Exercício Capítulo 1, Lista de Exercícios..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Observações sobre a atividade enviada..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo da Atividade</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FiFile className="text-green-500 text-xl" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <FiXCircle />
                  </button>
                </div>
              ) : (
                <>
                  <FiUpload className="text-3xl text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clique para selecionar o arquivo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, Word, Imagem ou ZIP (máx. 20MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip,.rar"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedDiscipline || !title.trim() || !file}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
            {submitting ? 'Enviando...' : 'Enviar Atividade'}
          </button>
        </div>
      </div>

      {/* My Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Minhas Atividades Enviadas</h4>
        </div>

        {loadingSubmissions ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">Carregando...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center">
            <FiFileText className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma atividade enviada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {submissions.map((sub) => {
              const cfg = statusConfig[sub.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={sub.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                      <FiFileText className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.title}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <StatusIcon className="text-xs" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {sub.discipline_name} • {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {sub.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub.description}</p>
                      )}
                      {sub.status === 'graded' && sub.grade !== null && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            Nota: {sub.grade}/{sub.max_grade}
                          </p>
                          {sub.feedback && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{sub.feedback}</p>
                          )}
                        </div>
                      )}
                      {sub.status === 'rejected' && sub.feedback && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs text-red-600 dark:text-red-400">{sub.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.file_url && (
                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                          <FiDownload className="text-sm" />
                        </a>
                      )}
                      {sub.status === 'pending' && (
                        <button onClick={() => handleDelete(sub.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
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
