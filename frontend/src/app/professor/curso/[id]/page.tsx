'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiImage,
  FiSave,
  FiSend,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiStar,
  FiFileText,
  FiVideo,
  FiBook,
  FiCheckSquare,
  FiMenu,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiMail,
  FiUser,
  FiAward,
  FiMessageSquare,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';

interface CourseFormData {
  title: string;
  subtitle: string;
  description: string;
  category_id: string;
  price: string;
  original_price: string;
  workload: string;
  requirements: string;
  target_audience: string;
  what_you_learn: string;
  video_url: string;
  has_certificate: boolean;
  is_free: boolean;
  featured: boolean;
  status: string;
  max_installments: string;
}

interface Category {
  id: number;
  name: string;
}

interface Module {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'quiz';
  duration?: number;
  order: number;
}

interface Review {
  id: number;
  student: { name: string; avatar?: string };
  rating: number;
  comment: string;
  created_at: string;
}

interface EnrolledStudent {
  id: number;
  student: { id: number; name: string; email: string; avatar?: string };
  progress: number;
  last_accessed?: string;
  enrolled_at: string;
}

interface QuizQuestionOption { label: string; text: string; is_correct: boolean; }
interface QuizQuestion { id?: number; question_text: string; question_type: 'multiple_choice' | 'true_false'; options: QuizQuestionOption[]; points: number; explanation: string; sort_order: number; }
interface Quiz { id: number; title: string; description: string; time_limit_minutes: number; passing_grade: number; max_attempts: number; shuffle_questions: boolean; show_answers_after: string; is_active: boolean; questions?: QuizQuestion[]; questions_count?: number; }

interface LessonComment {
  id: number;
  lesson_id?: number;
  comment: string;
  parent_id: number | null;
  created_at: string;
  user_id: number;
  user_name: string;
  user_role?: string;
  user_avatar?: string;
  replies?: LessonComment[];
}

interface CourseCommentsLesson {
  id: number;
  title: string;
  module_id: number;
  module_title: string;
  comments: LessonComment[];
}

type TabType = 'dados' | 'modulos' | 'avaliacoes' | 'alunos' | 'comentarios';

function CommentBlock({
  lessonId,
  comment,
  depth,
  replyingTo,
  replyText,
  replySending,
  formatDate,
  onReplyClick,
  onReplyChange,
  onReplySend,
  onCancelReply,
}: {
  lessonId: number;
  comment: LessonComment;
  depth: number;
  replyingTo: number | null;
  replyText: string;
  replySending: boolean;
  formatDate: (date: string) => string;
  onReplyClick: (commentId: number) => void;
  onReplyChange: (value: string) => void;
  onReplySend: (lessonId: number, commentId: number) => void;
  onCancelReply: () => void;
}) {
  const roleLabels: Record<string, string> = { admin: 'Admin', teacher: 'Professor', student: 'Aluno' };
  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-600', teacher: 'bg-blue-100 text-blue-600', student: 'bg-gray-100 text-gray-600' };

  return (
    <div className={depth === 0 ? 'p-4' : 'p-4 ml-5 border-l-2 border-gray-100'}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {comment.user_avatar ? (
            <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <FiUser className="text-gray-500 text-sm" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-gray-900">{comment.user_name}</span>
            {comment.user_role && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleColors[comment.user_role] || roleColors.student}`}>
                {roleLabels[comment.user_role] || comment.user_role}
              </span>
            )}
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line">{comment.comment}</p>

          <div className="mt-2">
            <button onClick={() => onReplyClick(comment.id)} className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              Responder
            </button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-2">
              <textarea
                value={replyText}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Escreva sua resposta..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={onCancelReply} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancelar</button>
                <button
                  onClick={() => onReplySend(lessonId, comment.id)}
                  disabled={!replyText.trim() || replySending}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium"
                >
                  <FiSend className="text-xs" /> {replySending ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(comment.replies || []).length > 0 && (
        <div className="mt-3">
          {(comment.replies || []).map((reply) => (
            <CommentBlock
              key={reply.id}
              lessonId={lessonId}
              comment={reply}
              depth={depth + 1}
              replyingTo={replyingTo}
              replyText={replyText}
              replySending={replySending}
              formatDate={formatDate}
              onReplyClick={onReplyClick}
              onReplyChange={onReplyChange}
              onReplySend={onReplySend}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modules state
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleSaving, setModuleSaving] = useState(false);

  // Lesson form state
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<Lesson['type']>('video');
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', time_limit_minutes: 120, passing_grade: 60, max_attempts: 3, shuffle_questions: false, show_answers_after: 'after_submit' });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  // Students state
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Comments state
  const [commentsData, setCommentsData] = useState<CourseCommentsLesson[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const [form, setForm] = useState<CourseFormData>({
    title: '', subtitle: '', description: '', category_id: '',
    price: '', original_price: '', workload: '', requirements: '',
    target_audience: '', what_you_learn: '', video_url: '',
    has_certificate: true, is_free: false, featured: false, status: 'draft',
    max_installments: '1',
  });

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/courses/${courseId}`);
      const c = data.course || data;
      setForm({
        title: c.title || '',
        subtitle: c.subtitle || '',
        description: c.description || '',
        category_id: c.category_id ? String(c.category_id) : '',
        price: c.price ? String(c.price) : '',
        original_price: c.original_price ? String(c.original_price) : '',
        workload: c.workload ? String(c.workload) : '',
        requirements: c.requirements || '',
        target_audience: c.target_audience || '',
        what_you_learn: c.what_you_learn || '',
        video_url: c.video_url || '',
        has_certificate: c.has_certificate ?? true,
        is_free: c.is_free ?? false,
        featured: c.featured ?? false,
        status: c.status || 'draft',
        max_installments: c.max_installments ? String(c.max_installments) : '1',
      });
      if (c.image) setImagePreview(c.image);
    } catch {
      toast.error('Erro ao carregar curso.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchModules = useCallback(async () => {
    try {
      setModulesLoading(true);
      const { data } = await api.get(`/courses/${courseId}/modules`);
      const allModules = data.modules || data.data || data || [];
      setModules(allModules);
    } catch {
      // silently fail
    } finally {
      setModulesLoading(false);
    }
  }, [courseId]);

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const { data } = await api.get(`/courses/${courseId}/reviews`);
      setReviews(data.reviews || data.data || data || []);
    } catch {
      // silently fail
    } finally {
      setReviewsLoading(false);
    }
  }, [courseId]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const { data } = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(data);
    } catch {
      // silently fail
    }
  }, [courseId]);

  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const { data } = await api.get(`/courses/${courseId}/students`);
      setStudents(data.students || data.data || data || []);
    } catch {
      // silently fail
    } finally {
      setStudentsLoading(false);
    }
  }, [courseId]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const { data } = await api.get(`/lessons/course/${courseId}/comments`);
      setCommentsData(data || []);
    } catch {
      // silently fail
    } finally {
      setCommentsLoading(false);
    }
  }, [courseId]);

  const sendReply = async (lessonId: number, commentId: number) => {
    if (!replyText.trim()) return;
    try {
      setReplySending(true);
      await api.post(`/lessons/${lessonId}/comments`, {
        comment: replyText.trim(),
        parent_id: commentId,
      });
      setReplyText('');
      setReplyingTo(null);
      toast.success('Resposta enviada!');
      await fetchComments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar resposta.');
    } finally {
      setReplySending(false);
    }
  };

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['dados', 'modulos', 'avaliacoes', 'alunos', 'comentarios'].includes(t)) {
      setActiveTab(t as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCourse();
    api.get('/categories').then(({ data }) => {
      setCategories(data.categories || data.data || data || []);
    }).catch(() => {});
  }, [fetchCourse]);

  useEffect(() => {
    if (activeTab === 'modulos') fetchModules();
    if (activeTab === 'avaliacoes') { fetchQuizzes(); fetchReviews(); }
    if (activeTab === 'alunos') fetchStudents();
    if (activeTab === 'comentarios') fetchComments();
  }, [activeTab, fetchModules, fetchReviews, fetchStudents, fetchQuizzes, fetchComments]);

  // === Course form handlers ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value };
      if (name === 'is_free' && (e.target as HTMLInputElement).checked) updated.price = '0';
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveCourse = async () => {
    if (!form.title.trim()) { toast.error('O título é obrigatório.'); return; }
    if (!form.description.trim()) { toast.error('A descrição é obrigatória.'); return; }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle);
      fd.append('description', form.description);
      if (form.category_id) fd.append('category_id', form.category_id);
      fd.append('price', form.is_free ? '0' : form.price);
      if (form.original_price) fd.append('original_price', form.original_price);
      fd.append('workload', form.workload);
      if (form.requirements) fd.append('requirements', form.requirements);
      if (form.target_audience) fd.append('target_audience', form.target_audience);
      if (form.what_you_learn) fd.append('what_you_learn', form.what_you_learn);
      if (form.video_url) fd.append('video_url', form.video_url);
      fd.append('has_certificate', String(form.has_certificate));
      fd.append('is_free', String(form.is_free));
      fd.append('featured', String(form.featured));
      fd.append('status', form.status);
      fd.append('max_installments', form.max_installments || '1');
      if (imageFile) fd.append('image', imageFile);

      await api.put(`/courses/${courseId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Curso atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar curso.');
    } finally {
      setSaving(false);
    }
  };

  // === Module handlers ===
  const openModuleForm = (mod?: Module) => {
    setEditingModule(mod || null);
    setModuleTitle(mod?.title || '');
    setShowModuleForm(true);
  };

  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) { toast.error('Título obrigatório.'); return; }
    try {
      setModuleSaving(true);
      if (editingModule) {
        await api.put(`/courses/${courseId}/modules/${editingModule.id}`, { title: moduleTitle });
        toast.success('Módulo atualizado!');
      } else {
        await api.post(`/courses/${courseId}/modules`, { title: moduleTitle, order: modules.length + 1 });
        toast.success('Módulo criado!');
      }
      setShowModuleForm(false);
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar módulo.');
    } finally {
      setModuleSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
    try {
      await api.delete(`/courses/${courseId}/modules/${moduleId}`);
      toast.success('Módulo excluído!');
      fetchModules();
    } catch {
      toast.error('Erro ao excluir módulo.');
    }
  };

  // === Lesson handlers ===
  const openLessonForm = (moduleId: number, lesson?: Lesson) => {
    setLessonModuleId(moduleId);
    setEditingLesson(lesson || null);
    setLessonTitle(lesson?.title || '');
    setLessonType(lesson?.type || 'video');
    setLessonVideoFile(null);
    setShowLessonForm(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !lessonModuleId) { toast.error('Título obrigatório.'); return; }
    try {
      setLessonSaving(true);
      let lessonId: number;
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson.id}`, {
          title: lessonTitle,
          content_type: lessonType,
        });
        lessonId = editingLesson.id;
        toast.success('Aula atualizada!');
      } else {
        const mod = modules.find(m => m.id === lessonModuleId);
        const { data } = await api.post('/lessons', {
          module_id: lessonModuleId,
          title: lessonTitle,
          content_type: lessonType,
          sort_order: (mod?.lessons?.length || 0) + 1,
        });
        lessonId = data.id || data.lesson?.id;
        toast.success('Aula criada!');
      }

      if (lessonVideoFile && lessonId) {
        const fd = new FormData();
        fd.append('video', lessonVideoFile);
        await api.post(`/lessons/${lessonId}/video`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setShowLessonForm(false);
      setLessonVideoFile(null);
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar aula.');
    } finally {
      setLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId: number, lessonId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      toast.success('Aula excluída!');
      fetchModules();
    } catch {
      toast.error('Erro ao excluir aula.');
    }
  };

  // === Quiz handlers ===
  const openNewQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ title: '', description: '', time_limit_minutes: 120, passing_grade: 60, max_attempts: 3, shuffle_questions: false, show_answers_after: 'after_submit' });
    setQuizQuestions([]);
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) { toast.error('Título é obrigatório'); return; }
    try {
      const payload = { ...quizForm, course_id: Number(courseId), questions: quizQuestions };
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz}`, payload);
        toast.success('Avaliação atualizada!');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Avaliação criada!');
      }
      setShowQuizModal(false);
      setEditingQuiz(null);
      fetchQuizzes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar avaliação.');
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Excluir esta avaliação e todas as suas perguntas?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(quizzes.filter(q => q.id !== id));
      toast.success('Avaliação excluída!');
    } catch {
      toast.error('Erro ao excluir avaliação.');
    }
  };

  const handleToggleQuiz = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/quizzes/${id}`, { is_active: !isActive });
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, is_active: !isActive } : q));
      toast.success(isActive ? 'Avaliação desativada' : 'Avaliação ativada');
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    setEditingQuiz(quiz.id);
    setQuizForm({
      title: quiz.title, description: quiz.description || '',
      time_limit_minutes: quiz.time_limit_minutes || 120,
      passing_grade: quiz.passing_grade || 60,
      max_attempts: quiz.max_attempts || 3,
      shuffle_questions: quiz.shuffle_questions || false,
      show_answers_after: quiz.show_answers_after || 'after_submit',
    });
    setQuizQuestions([]);
    setShowQuizModal(true);
    try {
      const { data } = await api.get(`/quizzes/${quiz.id}`);
      setQuizQuestions(data.questions || []);
    } catch {
      // keep empty
    }
  };

  const toggleExpandQuiz = async (quizId: number) => {
    if (expandedQuiz === quizId) { setExpandedQuiz(null); return; }
    setExpandedQuiz(quizId);
    const existing = quizzes.find(q => q.id === quizId);
    if (existing && !existing.questions) {
      try {
        const { data } = await api.get(`/quizzes/${quizId}`);
        setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, questions: data.questions || [] } : q));
      } catch {
        // silently fail
      }
    }
  };

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      question_text: '', question_type: 'multiple_choice',
      options: [{ label: 'A', text: '', is_correct: true }, { label: 'B', text: '', is_correct: false }],
      points: 1, explanation: '', sort_order: quizQuestions.length + 1,
    }]);
  };

  const updateQuizQuestion = (idx: number, field: string, value: any) => {
    const updated = [...quizQuestions];
    (updated[idx] as any)[field] = value;
    setQuizQuestions(updated);
  };

  const updateQuizOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    const updated = [...quizQuestions];
    (updated[qIdx].options[oIdx] as any)[field] = value;
    setQuizQuestions(updated);
  };

  const removeQuizOption = (qIdx: number, oIdx: number) => {
    const updated = [...quizQuestions];
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuizQuestions(updated);
  };

  const addQuizOption = (qIdx: number) => {
    const updated = [...quizQuestions];
    const labels = 'ABCDEF';
    updated[qIdx].options.push({ label: labels[updated[qIdx].options.length] || `${updated[qIdx].options.length + 1}`, text: '', is_correct: false });
    setQuizQuestions(updated);
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    const updated = [...quizQuestions];
    updated[qIdx].options = updated[qIdx].options.map((o, i) => ({ ...o, is_correct: i === oIdx }));
    setQuizQuestions(updated);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const lessonTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    video: { label: 'Vídeo', icon: FiVideo, color: 'text-red-500 bg-red-50' },
    text: { label: 'Texto', icon: FiFileText, color: 'text-blue-500 bg-blue-50' },
    pdf: { label: 'PDF', icon: FiFileText, color: 'text-green-500 bg-green-50' },
    quiz: { label: 'Quiz', icon: FiCheckSquare, color: 'text-purple-500 bg-purple-50' },
  };

  if (loading) return <Loading text="Carregando curso..." />;

  const tabs: { label: string; value: TabType; icon: React.ElementType }[] = [
    { label: 'Dados', value: 'dados', icon: FiEdit2 },
    { label: 'Módulos & Aulas', value: 'modulos', icon: FiBook },
    { label: 'Avaliações', value: 'avaliacoes', icon: FiStar },
    { label: 'Alunos', value: 'alunos', icon: FiUsers },
    { label: 'Comentários', value: 'comentarios', icon: FiMessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/professor/cursos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiArrowLeft className="text-xl text-gray-600" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Editar Curso</h2>
          <p className="text-gray-500 text-sm truncate">{form.title || 'Carregando...'}</p>
        </div>
        <button onClick={handleSaveCourse} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
          <FiSave /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* === TAB: DADOS === */}
          {activeTab === 'dados' && (
            <div className="space-y-6 max-w-4xl">
              {/* Image */}
              <div>
                <label className="label">Imagem do Curso</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-full max-w-md h-56 object-cover rounded-xl" />
                    <button onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                    <FiImage className="text-3xl text-gray-400" />
                    <span className="text-sm text-gray-500">Clique para selecionar uma imagem</span>
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div>
                <label className="label">Título *</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" maxLength={200} />
              </div>
              <div>
                <label className="label">Subtítulo</label>
                <input type="text" name="subtitle" value={form.subtitle} onChange={handleChange} className="input-field" maxLength={300} />
              </div>
              <div>
                <label className="label">Descrição *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={6} className="input-field resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Categoria</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
                    <option value="">Selecione</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Carga Horária (h)</label>
                  <input type="number" name="workload" value={form.workload} onChange={handleChange} className="input-field" min="1" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                </label>
                <span className="text-sm font-medium text-gray-700">Curso Gratuito</span>
              </div>

              {!form.is_free && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Preço (R$)</label>
                    <input type="number" name="price" value={form.price} onChange={handleChange} className="input-field" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="label">Preço Original (R$)</label>
                    <input type="number" name="original_price" value={form.original_price} onChange={handleChange} className="input-field" min="0" step="0.01" />
                  </div>
                </div>
              )}

              {!form.is_free && (
                <div>
                  <label className="label">Parcelas máximas no cartão</label>
                  <input
                    type="number"
                    name="max_installments"
                    value={form.max_installments}
                    onChange={handleChange}
                    className="input-field max-w-xs"
                    min="1"
                    max="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número máximo de parcelas para pagamento no cartão de crédito</p>
                </div>
              )}

              <div>
                <label className="label">URL do Vídeo de Apresentação</label>
                <input type="url" name="video_url" value={form.video_url} onChange={handleChange} className="input-field" placeholder="https://youtube.com/..." />
              </div>

              <div>
                <label className="label">Pré-requisitos</label>
                <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Público-Alvo</label>
                <textarea name="target_audience" value={form.target_audience} onChange={handleChange} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">O que você vai aprender</label>
                <textarea name="what_you_learn" value={form.what_you_learn} onChange={handleChange} rows={4} className="input-field resize-none" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="has_certificate" checked={form.has_certificate} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                  </label>
                  <span className="text-sm font-medium text-gray-700">Emitir certificado</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                  </label>
                  <span className="text-sm font-medium text-gray-700">Curso em destaque</span>
                </div>
              </div>
            </div>
          )}

          {/* === TAB: MODULOS & AULAS === */}
          {activeTab === 'modulos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Módulos do Curso</h3>
                <span className="text-xs text-gray-400">As disciplinas são gerenciadas pelo administrador</span>
              </div>

              {modulesLoading ? (
                <Loading fullScreen={false} text="Carregando módulos..." />
              ) : modules.length === 0 ? (
                <EmptyState
                  icon={<FiAward />}
                  title="Nenhuma disciplina criada"
                  description="O administrador cria as disciplinas e lota o professor responsável."
                />
              ) : (
                <div className="space-y-3">
                  {modules.sort((a, b) => a.order - b.order).map((mod) => (
                    <div key={mod.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      {/* Module Header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
                        <FiMenu className="text-gray-300 cursor-move shrink-0" />
                        <button
                          onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          {expandedModule === mod.id ? <FiChevronDown className="text-gray-400" /> : <FiChevronRight className="text-gray-400" />}
                          <span className="font-medium text-gray-900">{mod.title}</span>
                          <span className="text-xs text-gray-400 ml-1">({mod.lessons?.length || 0} aulas)</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openLessonForm(mod.id)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors" title="Adicionar aula">
                            <FiPlus />
                          </button>
                        </div>
                      </div>

                      {/* Lessons */}
                      {expandedModule === mod.id && (
                        <div className="divide-y divide-gray-100">
                          {(mod.lessons || []).length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-400">
                              Nenhuma aula neste módulo
                            </div>
                          ) : (
                            mod.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                              const ltConfig = lessonTypeConfig[lesson.type] || lessonTypeConfig.text;
                              return (
                                <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 pl-12 hover:bg-white transition-colors">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ltConfig.color}`}>
                                    <ltConfig.icon className="text-sm" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-900 truncate block">{lesson.title}</span>
                                    <span className="text-xs text-gray-400">{ltConfig.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openLessonForm(mod.id, lesson)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                                      <FiEdit2 className="text-sm" />
                                    </button>
                                    <button onClick={() => handleDeleteLesson(mod.id, lesson.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                                      <FiTrash2 className="text-sm" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB: AVALIAÇÕES === */}
          {activeTab === 'avaliacoes' && (
            <div className="space-y-8">
              {/* Quiz management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Avaliações do Curso (Provas)</h3>
                  <button onClick={openNewQuiz} className="btn-primary text-sm flex items-center gap-2">
                    <FiPlus /> Criar Nova Avaliação
                  </button>
                </div>

                {quizzes.length === 0 ? (
                  <EmptyState
                    icon={<FiCheckSquare />}
                    title="Nenhuma avaliação criada"
                    description="Crie uma prova com perguntas e respostas para os alunos do curso."
                  />
                ) : (
                  <div className="space-y-3">
                    {quizzes.map(quiz => (
                      <div key={quiz.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50">
                          <button onClick={() => toggleExpandQuiz(quiz.id)} className="flex items-center gap-3 flex-1 text-left">
                            {expandedQuiz === quiz.id ? <FiChevronUp /> : <FiChevronDown />}
                            <div>
                              <p className="font-semibold text-gray-900">{quiz.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                <span>{quiz.questions_count || quiz.questions?.length || 0} perguntas</span>
                                <span>Nota mín: {quiz.passing_grade}%</span>
                                {quiz.time_limit_minutes ? <span>{quiz.time_limit_minutes} min</span> : null}
                                <span>{quiz.max_attempts} tentativas</span>
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleToggleQuiz(quiz.id, quiz.is_active)} className={`px-3 py-1 rounded-lg text-xs font-medium ${quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {quiz.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button onClick={() => handleEditQuiz(quiz)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Editar"><FiEdit2 /></button>
                            <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Excluir"><FiTrash2 /></button>
                          </div>
                        </div>
                        {expandedQuiz === quiz.id && quiz.questions && quiz.questions.length > 0 && (
                          <div className="p-4 space-y-2">
                            {quiz.questions.map((q, i) => (
                              <div key={q.id || i} className="p-3 rounded-lg bg-gray-50">
                                <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question_text || '(pergunta sem texto)'}</p>
                                <p className="text-xs text-gray-500 mt-1">{q.question_type === 'true_false' ? 'Verdadeiro/Falso' : 'Múltipla escolha'} — {q.points} ponto(s)</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student reviews */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900">Avaliações dos Alunos</h3>

                {reviewsLoading ? (
                  <Loading fullScreen={false} text="Carregando avaliações..." />
                ) : reviews.length === 0 ? (
                  <EmptyState icon={<FiStar />} title="Nenhuma avaliação ainda" description="As avaliações dos alunos aparecerão aqui." />
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                            {review.student.avatar ? (
                              <img src={review.student.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FiUser className="text-primary-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{review.student.name}</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <FiStar key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-xs text-gray-400 ml-2">{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === TAB: ALUNOS === */}
          {activeTab === 'alunos' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Alunos Matriculados</h3>

              {studentsLoading ? (
                <Loading fullScreen={false} text="Carregando alunos..." />
              ) : students.length === 0 ? (
                <EmptyState icon={<FiUsers />} title="Nenhum aluno matriculado" description="Aguarde inscreverem-se alunos neste curso." />
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th>Aluno</th>
                        <th>Progresso</th>
                        <th>Data da Matrícula</th>
                        <th>Último Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                                {s.student.avatar ? (
                                  <img src={s.student.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <FiUser className="text-primary-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{s.student.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><FiMail className="text-gray-400" />{s.student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full ${s.progress >= 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(s.progress, 100)}%` }} />
                              </div>
                              <span className="text-sm font-medium text-gray-600">{Math.round(s.progress)}%</span>
                            </div>
                          </td>
                          <td className="text-sm text-gray-500">{formatDate(s.enrolled_at)}</td>
                          <td className="text-sm text-gray-500">{s.last_accessed ? formatDate(s.last_accessed) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comentarios' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiMessageSquare className="text-primary-500" />
                  Comentários dos Alunos
                </h3>
                <button onClick={fetchComments} className="text-sm text-primary-500 hover:text-primary-600">Atualizar</button>
              </div>

              {commentsLoading ? (
                <Loading fullScreen={false} text="Carregando comentários..." />
              ) : commentsData.every((l) => l.comments.length === 0) ? (
                <EmptyState
                  icon={<FiMessageSquare />}
                  title="Nenhum comentário"
                  description="Os comentários enviados pelos alunos nas aulas aparecerão aqui. Responda para manter o diálogo com a turma."
                />
              ) : (
                <div className="space-y-6">
                  {commentsData.filter((l) => l.comments.length > 0).map((lesson) => (
                    <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.module_title}</p>
                        </div>
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-medium">
                          {lesson.comments.length} comentário{lesson.comments.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {lesson.comments.map((comment) => (
                          <CommentBlock
                            key={comment.id}
                            lessonId={lesson.id}
                            comment={comment}
                            depth={0}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            replySending={replySending}
                            formatDate={formatDate}
                            onReplyClick={(id) => { setReplyText(''); setReplyingTo(id); }}
                            onReplyChange={setReplyText}
                            onReplySend={sendReply}
                            onCancelReply={() => setReplyingTo(null)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Título da Aula</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Aula 1 - Conceitos Básicos"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Tipo de Aula</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(lessonTypeConfig) as [string, { label: string; icon: React.ElementType; color: string }][]).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setLessonType(type as Lesson['type'])}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                        lessonType === type ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <config.icon className={`text-lg ${lessonType === type ? 'text-primary-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${lessonType === type ? 'text-primary-500' : 'text-gray-500'}`}>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {lessonType === 'video' && (
                <div>
                  <label className="label">Arquivo de Vídeo</label>
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <FiVideo className="text-red-500" />
                    {lessonVideoFile ? lessonVideoFile.name : 'Selecionar vídeo do computador'}
                  </button>
                  {lessonVideoFile && (
                    <button
                      onClick={() => setLessonVideoFile(null)}
                      className="mt-1 text-xs text-red-500 hover:text-red-600"
                    >
                      Remover arquivo
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowLessonForm(false)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={handleSaveLesson} disabled={lessonSaving} className="btn-primary text-sm">
                {lessonSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingQuiz ? 'Editar Avaliação' : 'Nova Avaliação'}</h2>
              <button onClick={() => setShowQuizModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><FiX /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="label">Título *</label>
                <input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} className="input-field" placeholder="Ex: Prova Módulo 1" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">Tempo (min)</label>
                  <input type="number" value={quizForm.time_limit_minutes} onChange={e => setQuizForm({ ...quizForm, time_limit_minutes: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label">Nota mínima (%)</label>
                  <input type="number" value={quizForm.passing_grade} onChange={e => setQuizForm({ ...quizForm, passing_grade: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label">Tentativas</label>
                  <input type="number" value={quizForm.max_attempts} onChange={e => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label">Respostas após</label>
                  <select value={quizForm.show_answers_after} onChange={e => setQuizForm({ ...quizForm, show_answers_after: e.target.value })} className="input-field">
                    <option value="after_submit">Após enviar</option>
                    <option value="never">Nunca</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={quizForm.shuffle_questions} onChange={e => setQuizForm({ ...quizForm, shuffle_questions: e.target.checked })} className="w-4 h-4 text-primary-500 rounded" />
                <span className="text-sm">Embaralhar perguntas</span>
              </label>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Perguntas ({quizQuestions.length})</h3>
                  <button onClick={addQuizQuestion} className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"><FiPlus /> Adicionar</button>
                </div>

                {quizQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-500">Pergunta {qIdx + 1}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" value={q.points} onChange={e => updateQuizQuestion(qIdx, 'points', Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-sm text-center" min="0" title="Pontos" />
                        <button onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))} className="text-red-500 hover:text-red-600"><FiTrash2 className="text-sm" /></button>
                      </div>
                    </div>
                    <input value={q.question_text} onChange={e => updateQuizQuestion(qIdx, 'question_text', e.target.value)} className="input-field text-sm" placeholder="Texto da pergunta" />
                    <select value={q.question_type} onChange={e => {
                      const type = e.target.value;
                      updateQuizQuestion(qIdx, 'question_type', type);
                      if (type === 'true_false') {
                        updateQuizQuestion(qIdx, 'options', [
                          { label: 'V', text: 'Verdadeiro', is_correct: true },
                          { label: 'F', text: 'Falso', is_correct: false },
                        ]);
                      } else if (q.options.length < 2) {
                        updateQuizQuestion(qIdx, 'options', [
                          { label: 'A', text: '', is_correct: true },
                          { label: 'B', text: '', is_correct: false },
                        ]);
                      }
                    }} className="input-field text-sm">
                      <option value="multiple_choice">Múltipla escolha</option>
                      <option value="true_false">Verdadeiro / Falso</option>
                    </select>

                    {q.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <button onClick={() => setCorrectOption(qIdx, oIdx)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${opt.is_correct ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400 hover:border-green-400'}`}>
                              {opt.is_correct ? '✓' : opt.label}
                            </button>
                            <input value={opt.text} onChange={e => updateQuizOption(qIdx, oIdx, 'text', e.target.value)} className="input-field text-sm flex-1" placeholder={`Alternativa ${opt.label}`} />
                            {q.options.length > 2 && <button onClick={() => removeQuizOption(qIdx, oIdx)} className="text-red-400 hover:text-red-500"><FiX className="text-sm" /></button>}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <button onClick={() => addQuizOption(qIdx)} className="text-xs text-primary-500 hover:text-primary-600 font-medium">+ Adicionar alternativa</button>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Explicação (opcional)</label>
                      <input value={q.explanation} onChange={e => updateQuizQuestion(qIdx, 'explanation', e.target.value)} className="input-field text-sm" placeholder="Explicação da resposta correta" />
                    </div>
                  </div>
                ))}

                {quizQuestions.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">Nenhuma pergunta adicionada. Clique em "Adicionar" para começar.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => setShowQuizModal(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button onClick={handleSaveQuiz} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
                  {editingQuiz ? 'Salvar Alterações' : 'Criar Avaliação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
