'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiSave,
  FiSend,
  FiUpload,
  FiX,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiVideo,
  FiFileText,
  FiFile,
  FiHelpCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  period: number | null;
  sort_order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  content_type: string;
  video_url: string;
  sort_order: number;
  is_free: boolean;
}

interface CourseData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  content_program: string;
  image: string;
  category_id: number;
  teacher_id: number;
  price: number;
  original_price: number;
  workload: number;
  workload_certificate: number;
  requirements: string;
  target_audience: string;
  what_you_learn: string;
  video_presentation: string;
  has_certificate: boolean;
  is_free: boolean;
  featured: boolean;
  status: string;
  max_installments: number;
}

const lessonTypeIcons: Record<string, any> = {
  video: FiVideo,
  text: FiFileText,
  pdf: FiFile,
  quiz: FiHelpCircle,
};

export default function EditarCursoAdminPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'dados' | 'modulos' | 'avaliacoes' | 'alunos'>('dados');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [showNewModule, setShowNewModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModulePeriod, setNewModulePeriod] = useState<number | ''>('');
  const [showNewLesson, setShowNewLesson] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', content_type: 'video', video_url: '' });
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const lessonVideoInputRef = useRef<HTMLInputElement>(null);

  // Quiz state
  interface QuizQuestionOption { label: string; text: string; is_correct: boolean; }
  interface QuizQuestion { id?: number; question_text: string; question_type: 'multiple_choice' | 'true_false'; options: QuizQuestionOption[]; points: number; explanation: string; sort_order: number; }
  interface Quiz { id: number; title: string; description: string; time_limit_minutes: number; passing_grade: number; max_attempts: number; shuffle_questions: boolean; show_answers_after: string; is_active: boolean; questions: QuizQuestion[]; }
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', time_limit_minutes: 120, passing_grade: 60, max_attempts: 3, shuffle_questions: false, show_answers_after: 'after_submit' });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    content_program: '',
    category_id: '',
    teacher_id: '',
    price: '',
    original_price: '',
    workload: '',
    workload_certificate: '',
    requirements: '',
    target_audience: '',
    what_you_learn: '',
    video_presentation: '',
    has_certificate: true,
    is_free: false,
    featured: false,
    status: 'draft',
    max_installments: '',
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [courseRes, catRes, teacherRes, modRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/categories'),
          api.get('/admin/users', { params: { role: 'teacher', limit: 100 } }),
          api.get(`/modules/course/${courseId}`),
        ]);

        const c = courseRes.data.course || courseRes.data;
        setForm({
          title: c.title || '',
          subtitle: c.subtitle || '',
          description: c.description || '',
          content_program: c.content_program || '',
          category_id: c.category_id?.toString() || '',
          teacher_id: c.teacher_id?.toString() || '',
          price: c.price?.toString() || '',
          original_price: c.original_price?.toString() || '',
          workload: c.workload?.toString() || '',
          workload_certificate: c.workload_certificate?.toString() || '',
          requirements: c.requirements || '',
          target_audience: c.target_audience || '',
          what_you_learn: c.what_you_learn || '',
          video_presentation: c.video_presentation || '',
          has_certificate: c.has_certificate ?? true,
          is_free: c.is_free ?? false,
          featured: c.featured ?? false,
          status: c.status || 'draft',
          max_installments: c.max_installments?.toString() || '1',
        });

        if (c.image) setImagePreview(c.image);
        setCategories(catRes.data.data || catRes.data.categories || catRes.data || []);
        setTeachers(teacherRes.data.data || teacherRes.data.users || teacherRes.data || []);
        setModules(modRes.data.modules || modRes.data.data || modRes.data || []);

        // Load quizzes
        try {
          const quizRes = await api.get(`/quizzes/course/${courseId}`);
          setQuizzes(quizRes.data.data || quizRes.data.quizzes || quizRes.data || []);
        } catch { /* quizzes may not exist yet */ }
      } catch {
        toast.error('Erro ao carregar dados do curso');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.is_free ? 0 : parseFloat(form.price) || 0,
        original_price: parseFloat(form.original_price) || null,
        workload: parseInt(form.workload) || 0,
        workload_certificate: parseInt(form.workload_certificate) || null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        teacher_id: parseInt(form.teacher_id),
        max_installments: parseInt(form.max_installments) || 1,
      };
      await api.put(`/courses/${courseId}`, payload);

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          await api.post('/uploads/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { entity_type: 'course', entity_id: courseId },
          });
        } catch {}
      }

      toast.success('Curso atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const { data } = await api.post('/modules', {
        course_id: parseInt(courseId),
        title: newModuleTitle,
        period: newModulePeriod || null,
        sort_order: modules.length + 1,
      });
      setModules([...modules, { ...data.module || data, lessons: [] }]);
      setNewModuleTitle('');
      setNewModulePeriod('');
      setShowNewModule(false);
      toast.success('Disciplina criada!');
    } catch {
      toast.error('Erro ao criar disciplina');
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Excluir esta disciplina e todas as suas aulas?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Disciplina excluída!');
    } catch {
      toast.error('Erro ao excluir disciplina');
    }
  };

  const handleAddLesson = async (moduleId: number) => {
    if (!newLesson.title.trim()) return;
    try {
      setUploadingVideo(true);
      const mod = modules.find(m => m.id === moduleId);
      const { data } = await api.post('/lessons', {
        module_id: moduleId,
        title: newLesson.title,
        content_type: lessonVideoFile ? 'video' : newLesson.content_type,
        video_url: newLesson.video_url || null,
        sort_order: (mod?.lessons?.length || 0) + 1,
      });

      const lessonId = data.lesson?.id || data.id;

      if (lessonVideoFile && lessonId) {
        const fd = new FormData();
        fd.append('video', lessonVideoFile);
        await api.post(`/lessons/${lessonId}/video`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: [...(m.lessons || []), data.lesson || data] }
          : m
      ));
      setNewLesson({ title: '', content_type: 'video', video_url: '' });
      setLessonVideoFile(null);
      setShowNewLesson(null);
      toast.success('Aula criada!');
    } catch {
      toast.error('Erro ao criar aula');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number, moduleId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: (m.lessons || []).filter(l => l.id !== lessonId) }
          : m
      ));
      toast.success('Aula excluída!');
    } catch {
      toast.error('Erro ao excluir aula');
    }
  };

  // Quiz handlers
  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) { toast.error('Título é obrigatório'); return; }
    try {
      const payload = { ...quizForm, course_id: Number(courseId), questions: quizQuestions };
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz}`, payload);
        toast.success('Quiz atualizado!');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz criado!');
      }
      setShowQuizModal(false);
      setEditingQuiz(null);
      setQuizForm({ title: '', description: '', time_limit_minutes: 120, passing_grade: 60, max_attempts: 3, shuffle_questions: false, show_answers_after: 'after_submit' });
      setQuizQuestions([]);
      const quizRes = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(quizRes.data.data || quizRes.data.quizzes || quizRes.data || []);
    } catch { toast.error('Erro ao salvar quiz'); }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Excluir este quiz e todas as suas perguntas?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(quizzes.filter(q => q.id !== id));
      toast.success('Quiz excluído!');
    } catch { toast.error('Erro ao excluir quiz'); }
  };

  const handleToggleQuiz = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/quizzes/${id}`, { is_active: !isActive });
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, is_active: !isActive } : q));
    } catch { toast.error('Erro ao alterar status'); }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz.id);
    setQuizForm({
      title: quiz.title, description: quiz.description || '',
      time_limit_minutes: quiz.time_limit_minutes || 120,
      passing_grade: quiz.passing_grade || 60,
      max_attempts: quiz.max_attempts || 3,
      shuffle_questions: quiz.shuffle_questions || false,
      show_answers_after: quiz.show_answers_after || 'after_submit',
    });
    setQuizQuestions(quiz.questions || []);
    setShowQuizModal(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  const tabs = [
    { key: 'dados', label: 'Dados do Curso' },
    { key: 'modulos', label: 'Disciplinas & Aulas' },
    { key: 'avaliacoes', label: 'Avaliações (Quiz)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cursos" className="p-2 rounded-lg hover:bg-gray-100">
            <FiArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Curso</h1>
            <p className="text-sm text-gray-500">ID: #{courseId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <FiSave /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Dados */}
      {activeTab === 'dados' && (
        <div className="space-y-6">
          {/* Image */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <label className="label">Imagem do Curso</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg">
                  <FiX />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-primary-500">
                <FiUpload /> Enviar imagem
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Informações Básicas</h2>
            <div>
              <label className="label">Título *</label>
              <input name="title" value={form.title} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Subtítulo</label>
              <input name="subtitle" value={form.subtitle} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field" />
            </div>
            <div>
              <label className="label">Conteúdo Programático</label>
              <textarea name="content_program" value={form.content_program} onChange={handleChange} rows={4} className="input-field" />
            </div>
          </div>

          {/* Teacher & Category */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Professor e Categoria</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Professor *</label>
                <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
                  <option value="">Selecione</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
                  <option value="">Selecione</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Preço e Carga Horária</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} className="w-4 h-4 text-primary-500 rounded" />
              <span className="text-sm">Curso gratuito</span>
            </label>
            {!form.is_free && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Preço (R$)</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} className="input-field" step="0.01" />
                </div>
                <div>
                  <label className="label">Preço Original</label>
                  <input type="number" name="original_price" value={form.original_price} onChange={handleChange} className="input-field" step="0.01" />
                </div>
                <div>
                  <label className="label">Carga Horária (h)</label>
                  <input type="number" name="workload" value={form.workload} onChange={handleChange} className="input-field" />
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
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Opções</h2>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="has_certificate" checked={form.has_certificate} onChange={handleChange} className="w-4 h-4 text-primary-500 rounded" />
                <span className="text-sm">Certificado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 text-primary-500 rounded" />
                <span className="text-sm">Destaque</span>
              </label>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field max-w-xs">
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Disciplinas */}
      {activeTab === 'modulos' && (
        <div className="space-y-4">
          {modules.map(mod => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expandedModule === mod.id ? <FiChevronUp /> : <FiChevronDown />}
                  <div>
                    <p className="font-semibold text-gray-900">{mod.title}</p>
                    <p className="text-xs text-gray-500">
                      {mod.period ? `${mod.period}º Período · ` : ''}{mod.lessons?.length || 0} aulas
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowNewLesson(showNewLesson === mod.id ? null : mod.id)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    title="Adicionar aula"
                  >
                    <FiPlus />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    title="Excluir disciplina"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {expandedModule === mod.id && (
                <div className="p-4 space-y-2">
                  {(mod.lessons || []).map(lesson => {
                    const Icon = lessonTypeIcons[lesson.content_type] || FiFileText;
                    return (
                      <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                          <Icon className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{lesson.content_type}</p>
                          </div>
                          {lesson.is_free && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Grátis</span>}
                        </div>
                        <button onClick={() => handleDeleteLesson(lesson.id, mod.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    );
                  })}

                  {showNewLesson === mod.id && (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-3 mt-2">
                      <input
                        placeholder="Título da aula"
                        value={newLesson.title}
                        onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                        className="input-field text-sm"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newLesson.content_type}
                          onChange={e => setNewLesson({ ...newLesson, content_type: e.target.value })}
                          className="input-field text-sm flex-1"
                        >
                          <option value="video">Vídeo</option>
                          <option value="text">Texto</option>
                          <option value="pdf">PDF</option>
                          <option value="quiz">Prova</option>
                        </select>
                        <input
                          placeholder="URL do vídeo (opcional)"
                          value={newLesson.video_url}
                          onChange={e => setNewLesson({ ...newLesson, video_url: e.target.value })}
                          className="input-field text-sm flex-1"
                        />
                      </div>
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
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FiVideo className="text-red-500" />
                          {lessonVideoFile ? lessonVideoFile.name : 'Enviar vídeo do computador'}
                        </button>
                        {lessonVideoFile && (
                          <button
                            onClick={() => setLessonVideoFile(null)}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <FiX className="text-sm" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowNewLesson(null); setLessonVideoFile(null); }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button
                          onClick={() => handleAddLesson(mod.id)}
                          disabled={uploadingVideo}
                          className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                          {uploadingVideo ? 'Enviando...' : 'Criar Aula'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New Discipline */}
          {showNewModule ? (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <input
                placeholder="Nome da disciplina"
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                className="input-field"
                autoFocus
              />
              <select
                value={newModulePeriod}
                onChange={e => setNewModulePeriod(e.target.value ? parseInt(e.target.value) : '')}
                className="input-field"
              >
                <option value="">Selecione o período</option>
                <option value="1">1º Período</option>
                <option value="2">2º Período</option>
                <option value="3">3º Período</option>
                <option value="4">4º Período</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowNewModule(false); setNewModuleTitle(''); setNewModulePeriod(''); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleAddModule} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600">Criar Disciplina</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewModule(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center gap-2 transition-colors"
            >
              <FiPlus /> Adicionar Disciplina
            </button>
          )}
        </div>
      )}

      {/* Tab: Avaliações */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <button onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)} className="flex items-center gap-3 flex-1 text-left">
                  {expandedQuiz === quiz.id ? <FiChevronUp /> : <FiChevronDown />}
                  <div>
                    <p className="font-semibold text-gray-900">{quiz.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{quiz.questions?.length || 0} perguntas</span>
                      <span>Nota mín: {quiz.passing_grade}%</span>
                      <span>{quiz.time_limit_minutes} min</span>
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
                      <p className="text-sm font-medium text-gray-900">{i + 1}. {q.question_text}</p>
                      <p className="text-xs text-gray-500 mt-1">{q.question_type === 'true_false' ? 'Verdadeiro/Falso' : 'Múltipla escolha'} — {q.points} ponto(s)</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => { setEditingQuiz(null); setQuizForm({ title: '', description: '', time_limit_minutes: 120, passing_grade: 60, max_attempts: 3, shuffle_questions: false, show_answers_after: 'after_submit' }); setQuizQuestions([]); setShowQuizModal(true); }}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center gap-2 transition-colors"
          >
            <FiPlus /> Criar Nova Avaliação
          </button>
        </div>
      )}

      {/* Modal Quiz */}
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
