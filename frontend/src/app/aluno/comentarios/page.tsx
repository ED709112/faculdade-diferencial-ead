'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiMessageSquare, FiUser, FiBook, FiSend } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface MyComment {
  id: number;
  lesson_id: number;
  comment: string;
  parent_id: number | null;
  created_at: string;
  user_id: number;
  user_name: string;
  user_role: string;
  user_avatar: string | null;
  lesson_title: string;
  module_title: string;
  course_id: number;
  course_title: string;
  parent_comment: string | null;
  parent_user_name: string | null;
  parent_user_role: string | null;
}

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const roleBadge = (role?: string | null) => {
  if (role === 'admin') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900">
        Administração
      </span>
    );
  }
  if (role === 'teacher') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-300">
        Professor
      </span>
    );
  }
  return null;
};

export default function AlunoComentariosPage() {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/lessons/my-comments');
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

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

  const courses = Array.from(
    new Map(comments.map((c) => [c.course_id, { id: c.course_id, title: c.course_title }])).values()
  );

  const filtered = filterCourse === 'all'
    ? comments
    : comments.filter((c) => String(c.course_id) === filterCourse);

  if (loading) return <Loading text="Carregando comentários..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comentários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mensagens e respostas enviadas pelo professor e pela administração.
          </p>
        </div>
        {courses.length > 0 && (
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.title}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiMessageSquare className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">Nenhum comentário recebido.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Quando o professor ou a administração responder, aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                  {comment.user_avatar ? (
                    <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-secondary-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user_name}</span>
                    {roleBadge(comment.user_role)}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.comment}</p>

                  {comment.parent_comment && (
                    <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 px-3 py-2">
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">
                        Respondendo a {comment.parent_user_name || 'seu comentário'}:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic whitespace-pre-line">"{comment.parent_comment}"</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }}
                    className="text-xs text-primary-500 hover:text-primary-600 mt-2"
                  >
                    Responder
                  </button>

                  {replyingTo === comment.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.lesson_id, comment.id)}
                        placeholder="Escreva sua resposta..."
                        className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleReply(comment.lesson_id, comment.id)}
                        disabled={!replyText.trim() || replySending}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-1"
                      >
                        <FiSend className="text-sm" /> Enviar
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <FiBook className="shrink-0" />
                    <span className="truncate">
                      <Link href={`/aluno/curso/${comment.course_id}`} className="text-primary-500 hover:text-primary-600 font-medium">
                        {comment.course_title}
                      </Link>
                      {comment.module_title ? ` · ${comment.module_title}` : ''} · {comment.lesson_title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
