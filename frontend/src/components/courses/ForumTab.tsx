'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiChevronRight,
  FiArrowLeft,
  FiSend,
  FiStar,
  FiEye,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ForumPost {
  id: number;
  title: string;
  content: string;
  is_pinned: number;
  is_resolved: number;
  view_count: number;
  replies_count: number;
  author_name: string;
  author_avatar?: string;
  author_role: string;
  module_title?: string;
  created_at: string;
  replies?: ForumReply[];
}

interface ForumReply {
  id: number;
  content: string;
  is_solution: number;
  author_name: string;
  author_avatar?: string;
  author_role: string;
  created_at: string;
}

interface Module {
  id: number;
  title: string;
}

interface Props {
  courseId: string;
  modules: Module[];
  currentUserId?: number;
}

export default function ForumTab({ courseId, modules, currentUserId }: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostModule, setNewPostModule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filterModule) params.set('module_id', filterModule);
      if (search) params.set('search', search);

      const { data } = await api.get(`/forum/course/${courseId}?${params}`);
      setPosts(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Erro ao carregar fórum.');
    } finally {
      setLoading(false);
    }
  }, [courseId, page, filterModule, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const fetchPost = async (postId: number) => {
    try {
      setLoadingPost(true);
      const { data } = await api.get(`/forum/${postId}`);
      setSelectedPost(data);
    } catch {
      toast.error('Erro ao carregar post.');
    } finally {
      setLoadingPost(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Preencha título e conteúdo.');
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await api.post('/forum', {
        course_id: parseInt(courseId),
        module_id: newPostModule ? parseInt(newPostModule) : null,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      });
      setPosts((prev) => [data, ...prev]);
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostModule('');
      toast.success('Post criado!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedPost || !replyContent.trim()) return;
    try {
      setSendingReply(true);
      const { data } = await api.post(`/forum/${selectedPost.id}/replies`, {
        content: replyContent.trim(),
      });
      setSelectedPost((prev) => prev ? { ...prev, replies: [...(prev.replies || []), data] } : prev);
      setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p));
      setReplyContent('');
      toast.success('Resposta enviada!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar resposta.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkSolution = async (replyId: number) => {
    try {
      await api.put(`/forum/replies/${replyId}/solution`);
      if (selectedPost) {
        setSelectedPost((prev) => prev ? {
          ...prev,
          is_resolved: 1,
          replies: (prev.replies || []).map((r) => ({ ...r, is_solution: r.id === replyId ? 1 : 0 })),
        } : prev);
      }
      toast.success('Resposta marcada como solução!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Excluir este post?')) return;
    try {
      await api.delete(`/forum/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedPost(null);
      toast.success('Post excluído!');
    } catch {
      toast.error('Erro ao excluir post.');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const roleLabels: Record<string, string> = { admin: 'Admin', teacher: 'Professor', student: 'Aluno' };
  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-600', teacher: 'bg-blue-100 text-blue-600', student: 'bg-gray-100 text-gray-600' };

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500 transition-colors">
          <FiArrowLeft /> Voltar ao Fórum
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {selectedPost.is_pinned ? <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><FiStar className="text-xs" /> Fixado</span> : null}
                {selectedPost.is_resolved ? <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FiCheckCircle className="text-xs" /> Resolvido</span> : null}
                {selectedPost.module_title && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{selectedPost.module_title}</span>}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPost.title}</h2>
            </div>
            {selectedPost.author_role !== 'student' || selectedPost.author_name === currentUserId?.toString() ? null : null}
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><FiUser className="text-xs" /> {selectedPost.author_name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[selectedPost.author_role] || roleColors.student}`}>{roleLabels[selectedPost.author_role] || selectedPost.author_role}</span>
            <span className="flex items-center gap-1"><FiClock className="text-xs" /> {formatDate(selectedPost.created_at)}</span>
            <span className="flex items-center gap-1"><FiEye className="text-xs" /> {selectedPost.view_count}</span>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {selectedPost.content}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMessageSquare className="text-gray-400" />
            Respostas ({selectedPost.replies?.length || 0})
          </h3>

          {loadingPost ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            (selectedPost.replies || []).map((reply) => (
              <div key={reply.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${reply.is_solution ? 'ring-2 ring-green-400' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FiUser className="text-gray-500 text-sm" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{reply.author_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleColors[reply.author_role] || roleColors.student}`}>{roleLabels[reply.author_role]}</span>
                      {reply.is_solution ? <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FiCheckCircle className="text-xs" /> Solução</span> : null}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                  </div>
                  {!selectedPost.is_resolved && reply.author_role !== 'student' && (
                    <button onClick={() => handleMarkSolution(reply.id)} className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50">
                      Marcar como solução
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line ml-11">{reply.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Escreva sua resposta..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleReply}
              disabled={!replyContent.trim() || sendingReply}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FiSend className="text-sm" />
              {sendingReply ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiMessageSquare /> Fórum de Dúvidas
        </h2>
        <button
          onClick={() => setShowNewPost(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <FiPlus /> Nova Pergunta
        </button>
      </div>

      {showNewPost && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nova Pergunta</h3>
            <button onClick={() => setShowNewPost(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX /></button>
          </div>
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Título da sua pergunta"
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={newPostModule}
            onChange={(e) => setNewPostModule(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Geral (sem módulo)</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Descreva sua dúvida em detalhes..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button
              onClick={handleCreatePost}
              disabled={submitting}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar no fórum..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterModule}
          onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os módulos</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <FiMessageSquare className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum post encontrado. Seja o primeiro a perguntar!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => fetchPost(post.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.is_pinned ? <FiStar className="text-amber-500 text-xs shrink-0" /> : null}
                    {post.is_resolved ? <FiCheckCircle className="text-green-500 text-xs shrink-0" /> : null}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{post.author_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleColors[post.author_role] || roleColors.student}`}>{roleLabels[post.author_role]}</span>
                    {post.module_title && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{post.module_title}</span>}
                    <span className="flex items-center gap-1"><FiEye className="text-[10px]" /> {post.view_count}</span>
                    <span className="flex items-center gap-1"><FiMessageSquare className="text-[10px]" /> {post.replies_count}</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400 shrink-0 mt-1" />
              </div>
            </button>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-sm ${p === page ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
