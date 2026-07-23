'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle, FiClock, FiXCircle, FiFileText, FiDownload,
  FiSend, FiFilter, FiUser, FiStar,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
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

interface Discipline {
  id: number;
  name: string;
}

export default function ProfessorCorrecoesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDiscipline, setFilterDiscipline] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [maxGradeValue, setMaxGradeValue] = useState('10');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDisciplines = useCallback(async () => {
    try {
      const { data } = await api.get('/teacher/disciplines');
      setDisciplines(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (filterDiscipline) params.discipline_id = filterDiscipline;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/submissions/teacher', { params });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filterDiscipline, filterStatus]);

  useEffect(() => { fetchDisciplines(); }, [fetchDisciplines]);
  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleGrade = async (id: number) => {
    if (!gradeValue.trim()) {
      toast.error('Informe a nota.');
      return;
    }
    try {
      setSaving(true);
      await api.patch(`/submissions/teacher/${id}`, {
        grade: parseFloat(gradeValue),
        max_grade: parseFloat(maxGradeValue) || 10,
        feedback: feedbackValue.trim() || null,
        status: 'graded',
      });
      toast.success('Atividade corrigida!');
      setEditingId(null);
      setGradeValue('');
      setMaxGradeValue('10');
      setFeedbackValue('');
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao corrigir.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setSaving(true);
      await api.patch(`/submissions/teacher/${id}`, {
        status: 'rejected',
        feedback: feedbackValue.trim() || 'Atividade rejeitada. Por favor, reenvie.',
      });
      toast.success('Atividade rejeitada.');
      setEditingId(null);
      setFeedbackValue('');
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao rejeitar.');
    } finally {
      setSaving(false);
    }
  };

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: 'Pendente', icon: FiClock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    graded: { label: 'Corrigido', icon: FiCheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected: { label: 'Rejeitado', icon: FiXCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Correções de Atividades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pendingCount > 0 ? `${pendingCount} atividade(s) pendente(s)` : 'Todas as atividades foram corrigidas'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <FiFilter className="text-gray-400" />
        <select
          value={filterDiscipline}
          onChange={(e) => setFilterDiscipline(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value={0}>Todas as disciplinas</option>
          {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="graded">Corrigidos</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {loading ? (
        <Loading text="Carregando submissões..." />
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiFileText className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma submissão encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const cfg = statusConfig[sub.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isEditing = editingId === sub.id;

            return (
              <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                    <FiUser className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.student_name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="text-xs" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sub.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{sub.discipline_name}</span>
                      <span>{new Date(sub.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {sub.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub.description}</p>
                    )}
                    {sub.file_url && (
                      <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary-500 hover:text-primary-600 font-medium">
                        <FiDownload /> Baixar arquivo enviado
                      </a>
                    )}
                    {sub.status === 'graded' && sub.grade !== null && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg inline-flex items-center gap-2">
                        <FiStar className="text-green-500" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Nota: {sub.grade}/{sub.max_grade}
                        </span>
                      </div>
                    )}
                    {sub.feedback && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Feedback: {sub.feedback}</p>
                    )}

                    {/* Grade Form */}
                    {isEditing ? (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nota</label>
                            <input type="number" step="0.01" min="0" value={gradeValue}
                              onChange={(e) => setGradeValue(e.target.value)}
                              className="w-20 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nota Máx.</label>
                            <input type="number" step="0.01" min="0" value={maxGradeValue}
                              onChange={(e) => setMaxGradeValue(e.target.value)}
                              className="w-20 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              placeholder="10" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Feedback</label>
                          <textarea value={feedbackValue} onChange={(e) => setFeedbackValue(e.target.value)}
                            rows={2} placeholder="Observações sobre a correção..."
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none" />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleGrade(sub.id)} disabled={saving}
                            className="flex items-center gap-1 px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
                            <FiCheckCircle /> {saving ? 'Salvando...' : 'Aprovar e Nota'}
                          </button>
                          <button onClick={() => handleReject(sub.id)} disabled={saving}
                            className="flex items-center gap-1 px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                            <FiXCircle /> Rejeitar
                          </button>
                          <button onClick={() => { setEditingId(null); setGradeValue(''); setFeedbackValue(''); }}
                            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : sub.status === 'pending' ? (
                      <button onClick={() => { setEditingId(sub.id); setGradeValue(''); setMaxGradeValue('10'); setFeedbackValue(''); }}
                        className="mt-2 flex items-center gap-1 px-4 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                        <FiCheckCircle /> Corrigir
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
