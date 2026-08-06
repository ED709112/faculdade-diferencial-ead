'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiMessageSquare, FiUser, FiBook, FiSend } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface CommentNode {
  id: number;
  comment: string;
  parent_id: number | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  user_role: string;
  replies?: CommentNode[];
}

interface LessonGroup {
  course_id: number;
  course_title: string;
  lesson_id: number;
  lesson_title: string;
  module_title: string;
  comments: CommentNode[];
}

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ProfessorCommentsPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [groups, setGroups] = useState<LessonGroup[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: courseData } = await api.get('/teacher/courses');
      const courseList = Array.isArray(courseData) ? courseData : [];
      setCourses(courseList);

      const results = await Promise.all(
        courseList.map(async (c: any) => {
          try {
            const { data } = await api.get(`/lessons/course/${c.id}/comments`);
            return { course: c, lessons: Array.isArray(data) ? data : [] };
          } catch {
            return { course: c, lessons: [] };
          }
        })
      );

      const g: LessonGroup[] = [];
      for (const r of results) {
        for (const lesson of r.lessons) {
          if ((lesson.comments || []).length > 0) {
            g.push({
              course_id: r.course.id,
              course_title: r.course.title,
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              module_title: lesson.module_title || '',
              comments: lesson.comments,
            });
          }
        }
      }
      setGroups(g);
    } catch {
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

  const renderComment = (comment: CommentNode, depth: number, lessonId: number) => {
    const isTeacher = comment.user_role === 'teacher' || comment.user_role === 'admin';
    return (
      <div key={comment.id}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 overflow-hidden">
            {comment.user_avatar ? (
              <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="text-primary-500 text-sm" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user_name || 'Aluno'}</span>
              {isTeacher && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-300">
                  Professor
                </span>
              )}
              {comment.parent_id && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Resposta
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.comment}</p>

            <button
              onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }}
              className="text-xs text-primary-500 hover:text-primary-600 mt-1.5"
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
                {(comment.replies || []).map((reply) => renderComment(reply, depth + 1, lessonId))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Loading text="Carregando comentários..." />;

  const totalCount = groups.reduce((acc, g) => {
    const count = (nodes: CommentNode[]): number => nodes.reduce((a, c) => a + 1 + count(c.replies || []), 0);
    return acc + count(g.comments);
  }, 0);

  const filtered = filterCourse === 'all'
    ? groups
    : groups.filter((g) => String(g.course_id) === filterCourse);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comentários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comentários e dúvidas dos alunos. Use "Responder" para responder diretamente.
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
          <p className="text-gray-500 dark:text-gray-400 mb-1">Nenhum comentário encontrado.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Quando um aluno comentar em uma aula, aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((group) => (
            <div key={`${group.course_id}-${group.lesson_id}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiBook className="text-secondary-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{group.lesson_title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{group.course_title}{group.module_title ? ` · ${group.module_title}` : ''}</p>
                </div>
              </div>
              <div className="space-y-3">
                {group.comments.map((comment) => renderComment(comment, 0, group.lesson_id))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
