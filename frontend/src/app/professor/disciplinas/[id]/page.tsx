'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiPlus, FiVideo, FiFile, FiFileText, FiX, FiTrash2, FiEdit2,
  FiBook, FiClock, FiCheckSquare, FiChevronDown, FiPaperclip, FiMessageSquare, FiUser, FiSend,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Lesson {
  id: number;
  title: string;
  content_type: string;
  video_url: string | null;
  pdf_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  text_content: string | null;
  sort_order: number;
  ementa?: string | null;
  objetivo?: string | null;
  objetivo_especifico?: string | null;
  conteudo_programatico?: string | null;
  metodologia?: string | null;
  avaliacao?: string | null;
  bibliografia?: string | null;
}

interface DisciplineDetail {
  id: number;
  title: string;
  description: string;
  period: number | null;
  workload: number;
  course_id: number;
  course_title: string;
  lessons: Lesson[];
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  video: { label: 'Vídeo', icon: FiVideo, color: 'bg-red-100 text-red-600' },
  text: { label: 'Texto', icon: FiFileText, color: 'bg-gray-100 text-gray-600' },
  pdf: { label: 'PDF', icon: FiFile, color: 'bg-blue-100 text-blue-600' },
  quiz: { label: 'Prova', icon: FiCheckSquare, color: 'bg-amber-100 text-amber-600' },
};

export default function DisciplineDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [discipline, setDiscipline] = useState<DisciplineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: '', content_type: 'video', video_url: '', text_content: '',
    ementa: '', objetivo: '', objetivo_especifico: '', conteudo_programatico: '',
    metodologia: '', avaliacao: '', bibliografia: '',
  });
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonSupportFile, setLessonSupportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'aulas' | 'comentarios'>('aulas');
  const [courseComments, setCourseComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);
  const lessonFileInputRef = useRef<HTMLInputElement>(null);
  const lessonSupportInputRef = useRef<HTMLInputElement>(null);

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setNewLesson({
      title: '', content_type: 'video', video_url: '', text_content: '',
      ementa: '', objetivo: '', objetivo_especifico: '', conteudo_programatico: '',
      metodologia: '', avaliacao: '', bibliografia: '',
    });
    setLessonVideoFile(null);
    setLessonFile(null);
    setLessonSupportFile(null);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/modules/${id}`);
      setDiscipline(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchComments = useCallback(async () => {
    if (!discipline) return;
    try {
      setCommentsLoading(true);
      const { data } = await api.get(`/lessons/course/${discipline.course_id}/comments`);
      const list = Array.isArray(data) ? data : [];
      setCourseComments(list.filter((l: any) => Number(l.module_id) === Number(id)));
    } catch {} finally {
      setCommentsLoading(false);
    }
  }, [discipline, id]);

  useEffect(() => {
    if (activeTab === 'comentarios') fetchComments();
  }, [activeTab, fetchComments]);

  const handleReply = async (lessonId: number, parentId: number) => {
    if (!replyText.trim()) return;
    try {
      setReplySending(true);
      await api.post(`/lessons/${lessonId}/comments`, {
        comment: replyText.trim(),
        parent_id: parentId,
      });
      toast.success('Resposta enviada!');
      setReplyingTo(null);
      setReplyText('');
      await fetchComments();
    } catch {
      toast.error('Erro ao enviar resposta');
    } finally {
      setReplySending(false);
    }
  };

  const formatCommentDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderCommentItem = (comment: any, depth: number, lessonId: number) => (
    <div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 overflow-hidden">
          {comment.user_avatar ? (
            <img src={comment.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <FiUser className="text-primary-500 text-sm" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.user_name || 'Aluno'}</span>
            {(comment.user_role === 'teacher' || comment.user_role === 'admin') && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-300">
                Professor
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatCommentDate(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.comment}</p>
          <button
            onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }}
            className="text-xs text-primary-500 hover:text-primary-600 mt-1"
          >
            Responder
          </button>
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply(lessonId, comment.id)}
                placeholder="Escreva a resposta do professor..."
                className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleReply(lessonId, comment.id)}
                disabled={!replyText.trim() || replySending}
                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <FiSend className="text-sm" /> Enviar
              </button>
            </div>
          )}
          {(comment.replies || []).length > 0 && (
            <div className="mt-3 space-y-3">
              {(comment.replies || []).map((reply: any) => renderCommentItem(reply, depth + 1, lessonId))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) { toast.error('Título da aula é obrigatório.'); return; }
    if (!editingLessonId && (newLesson.content_type === 'pdf' || newLesson.content_type === 'quiz') && !lessonFile) {
      toast.error(newLesson.content_type === 'pdf' ? 'Anexe o arquivo PDF da aula.' : 'Anexe o arquivo da prova.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        module_id: Number(id),
        title: newLesson.title,
        content_type: lessonVideoFile ? 'video' : newLesson.content_type,
        video_url: newLesson.video_url || null,
        text_content: newLesson.content_type === 'text' ? newLesson.text_content : null,
        sort_order: (discipline?.lessons?.length || 0) + 1,
        ementa: newLesson.ementa || null,
        objetivo: newLesson.objetivo || null,
        objetivo_especifico: newLesson.objetivo_especifico || null,
        conteudo_programatico: newLesson.conteudo_programatico || null,
        metodologia: newLesson.metodologia || null,
        avaliacao: newLesson.avaliacao || null,
        bibliografia: newLesson.bibliografia || null,
      };

      let lessonId: number;
      if (editingLessonId) {
        await api.put(`/lessons/${editingLessonId}`, { ...payload, module_id: undefined });
        lessonId = editingLessonId;
      } else {
        const { data } = await api.post('/lessons', payload);
        lessonId = data.lesson?.id || data.id;
      }

      if (lessonVideoFile && lessonId) {
        const fd = new FormData();
        fd.append('video', lessonVideoFile);
        await api.post(`/lessons/${lessonId}/video`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (lessonFile && lessonId) {
        const fd = new FormData();
        fd.append('file', lessonFile);
        await api.post(`/lessons/${lessonId}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (lessonSupportFile && lessonId) {
        const fd = new FormData();
        fd.append('file', lessonSupportFile);
        await api.post(`/lessons/${lessonId}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      resetLessonForm();
      setShowNewLesson(false);
      toast.success(editingLessonId ? 'Aula atualizada!' : 'Aula criada!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar aula');
    } finally {
      setSaving(false);
    }
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setNewLesson({
      title: lesson.title,
      content_type: lesson.content_type,
      video_url: lesson.video_url || '',
      text_content: lesson.text_content || '',
      ementa: lesson.ementa || '',
      objetivo: lesson.objetivo || '',
      objetivo_especifico: lesson.objetivo_especifico || '',
      conteudo_programatico: lesson.conteudo_programatico || '',
      metodologia: lesson.metodologia || '',
      avaliacao: lesson.avaliacao || '',
      bibliografia: lesson.bibliografia || '',
    });
    setLessonVideoFile(null);
    setLessonFile(null);
    setLessonSupportFile(null);
    setShowNewLesson(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      toast.success('Aula excluída!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir aula');
    }
  };

  if (loading) return <Loading text="Carregando disciplina..." />;
  if (!discipline) return <div className="text-center py-12 text-gray-500">Disciplina não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professor/disciplinas" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <FiArrowLeft className="text-lg text-gray-500" />
        </Link>
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{discipline.course_title}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{discipline.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {discipline.workload > 0 && (
              <span className="flex items-center gap-1"><FiClock className="text-xs" /> {discipline.workload}h</span>
            )}
            {discipline.period != null && (
              <span className="flex items-center gap-1"><FiBook className="text-xs" /> {discipline.period}º Período</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('aulas')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'aulas' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <FiBook /> Aulas
        </button>
        <button
          onClick={() => setActiveTab('comentarios')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'comentarios' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <FiMessageSquare /> Comentários
        </button>
      </div>

      {activeTab === 'aulas' && (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aulas da Disciplina</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Anexe vídeo, texto, PDF (apostila) ou prova em cada aula.</p>
          </div>
          <button
            onClick={() => { setShowNewLesson(!showNewLesson); setLessonFile(null); setLessonVideoFile(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors"
          >
            {showNewLesson ? <FiChevronDown className="rotate-180" /> : <FiPlus />}
            {showNewLesson ? 'Fechar' : 'Adicionar Aula'}
          </button>
        </div>

        {showNewLesson && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-gray-750 rounded-xl space-y-3 border border-blue-100 dark:border-gray-600">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{editingLessonId ? 'Editar Aula' : 'Nova Aula'}</p>
            <input
              placeholder="Título da aula"
              value={newLesson.title}
              onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={newLesson.content_type}
                onChange={e => {
                  const ct = e.target.value;
                  setLessonFile(null);
                  setLessonVideoFile(null);
                  setNewLesson({ ...newLesson, content_type: ct });
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="video">Vídeo</option>
                <option value="text">Texto</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Prova</option>
              </select>
              {newLesson.content_type === 'video' && (
                <input
                  placeholder="URL do vídeo (opcional)"
                  value={newLesson.video_url}
                  onChange={e => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>

            {newLesson.content_type === 'video' && (
              <div className="flex items-center gap-2">
                <input
                  ref={lessonVideoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  onChange={e => setLessonVideoFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => lessonVideoInputRef.current?.click()}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
                >
                  <FiVideo className="text-red-500" />
                  {lessonVideoFile ? lessonVideoFile.name : 'Enviar vídeo do computador'}
                </button>
                {lessonVideoFile && (
                  <button onClick={() => setLessonVideoFile(null)} className="p-1 text-red-500 hover:text-red-600">
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>
            )}

            {newLesson.content_type === 'pdf' && (
              <div className="flex items-center gap-2">
                <input
                  ref={lessonFileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setLessonFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => lessonFileInputRef.current?.click()}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
                >
                  <FiFile className="text-red-500" />
                  {lessonFile ? lessonFile.name : 'Anexar apostila (PDF)'}
                </button>
                {lessonFile && (
                  <button onClick={() => setLessonFile(null)} className="p-1 text-red-500 hover:text-red-600">
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>
            )}

            {newLesson.content_type === 'text' && (
              <textarea
                placeholder="Conteúdo do texto (pode usar HTML)"
                value={newLesson.text_content}
                onChange={e => setNewLesson({ ...newLesson, text_content: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            )}

            {newLesson.content_type === 'quiz' && (
              <div className="flex items-center gap-2">
                <input
                  ref={lessonFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={e => setLessonFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => lessonFileInputRef.current?.click()}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
                >
                  <FiFile className="text-red-500" />
                  {lessonFile ? lessonFile.name : 'Anexar arquivo da prova'}
                </button>
                {lessonFile && (
                  <button onClick={() => setLessonFile(null)} className="p-1 text-red-500 hover:text-red-600">
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                ref={lessonSupportInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                className="hidden"
                onChange={e => setLessonSupportFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => lessonSupportInputRef.current?.click()}
                type="button"
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
              >
                <FiPaperclip className="text-gray-500" />
                {lessonSupportFile ? lessonSupportFile.name : 'Anexar material de apoio (arquivo)'}
              </button>
              {lessonSupportFile && (
                <button onClick={() => setLessonSupportFile(null)} className="p-1 text-red-500 hover:text-red-600">
                  <FiX className="text-sm" />
                </button>
              )}
            </div>

            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">Plano de Ensino</p>
              <div className="space-y-3">
                <textarea
                  placeholder="Ementa"
                  value={newLesson.ementa}
                  onChange={e => setNewLesson({ ...newLesson, ementa: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    placeholder="Objetivo"
                    value={newLesson.objetivo}
                    onChange={e => setNewLesson({ ...newLesson, objetivo: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <textarea
                    placeholder="Objetivo específico"
                    value={newLesson.objetivo_especifico}
                    onChange={e => setNewLesson({ ...newLesson, objetivo_especifico: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                <textarea
                  placeholder="Conteúdo programático (um item por linha)"
                  value={newLesson.conteudo_programatico}
                  onChange={e => setNewLesson({ ...newLesson, conteudo_programatico: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    placeholder="Metodologia"
                    value={newLesson.metodologia}
                    onChange={e => setNewLesson({ ...newLesson, metodologia: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <textarea
                    placeholder="Avaliação"
                    value={newLesson.avaliacao}
                    onChange={e => setNewLesson({ ...newLesson, avaliacao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                <textarea
                  placeholder="Bibliografia"
                  value={newLesson.bibliografia}
                  onChange={e => setNewLesson({ ...newLesson, bibliografia: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNewLesson(false); resetLessonForm(); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLesson}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {saving ? 'Enviando...' : editingLessonId ? 'Salvar Alterações' : 'Criar Aula'}
              </button>
            </div>
          </div>
        )}

        {discipline.lessons.length === 0 ? (
          <div className="text-center py-8">
            <FiFileText className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma aula cadastrada nesta disciplina.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {discipline.lessons.map((lesson, idx) => {
              const cfg = typeConfig[lesson.content_type] || typeConfig.text;
              const TypeIcon = cfg.icon;
              return (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color.split(' ')[0]}`}>
                    <TypeIcon className={`text-sm ${cfg.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</p>
                  </div>
                  <button
                    onClick={() => openEditLesson(lesson)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeTab === 'comentarios' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comentários dos Alunos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comentários e perguntas feitas pelos alunos nas aulas desta disciplina.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              {courseComments.reduce((acc: number, l: any) => acc + (l.comments?.length || 0), 0)}
            </span>
          </div>

          {commentsLoading ? (
            <Loading text="Carregando comentários..." />
          ) : courseComments.length === 0 ? (
            <div className="text-center py-8">
              <FiMessageSquare className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum comentário nesta disciplina ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseComments.map((lesson) => {
                const lessonComments = lesson.comments || [];
                if (lessonComments.length === 0) return null;
                return (
                  <div key={lesson.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FiBook className="text-secondary-500 text-xs" /> {lesson.title}
                    </p>
                    <div className="space-y-3">
                      {lessonComments.map((comment: any) => renderCommentItem(comment, 0, lesson.id))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
