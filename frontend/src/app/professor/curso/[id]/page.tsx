'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  FiClock,
  FiMail,
  FiUser,
  FiAward,
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

type TabType = 'dados' | 'modulos' | 'avaliacoes' | 'alunos';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
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

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Students state
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

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
      setModules(data.modules || data.data || data || []);
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

  useEffect(() => {
    fetchCourse();
    api.get('/categories').then(({ data }) => {
      setCategories(data.categories || data.data || data || []);
    }).catch(() => {});
  }, [fetchCourse]);

  useEffect(() => {
    if (activeTab === 'modulos') fetchModules();
    if (activeTab === 'avaliacoes') fetchReviews();
    if (activeTab === 'alunos') fetchStudents();
  }, [activeTab, fetchModules, fetchReviews, fetchStudents]);

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
    setShowLessonForm(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !lessonModuleId) { toast.error('Título obrigatório.'); return; }
    try {
      setLessonSaving(true);
      if (editingLesson) {
        await api.put(
          `/courses/${courseId}/modules/${lessonModuleId}/lessons/${editingLesson.id}`,
          { title: lessonTitle, type: lessonType }
        );
        toast.success('Aula atualizada!');
      } else {
        const mod = modules.find(m => m.id === lessonModuleId);
        await api.post(
          `/courses/${courseId}/modules/${lessonModuleId}/lessons`,
          { title: lessonTitle, type: lessonType, order: (mod?.lessons?.length || 0) + 1 }
        );
        toast.success('Aula criada!');
      }
      setShowLessonForm(false);
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
      await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
      toast.success('Aula excluída!');
      fetchModules();
    } catch {
      toast.error('Erro ao excluir aula.');
    }
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
                <button onClick={() => openModuleForm()} className="btn-primary flex items-center gap-2 text-sm">
                  <FiPlus /> Novo Módulo
                </button>
              </div>

              {modulesLoading ? (
                <Loading fullScreen={false} text="Carregando módulos..." />
              ) : modules.length === 0 ? (
                <EmptyState
                  icon={<FiAward />}
                  title="Nenhum módulo criado"
                  description="Adicione módulos para organizar as aulas do seu curso."
                  action={{ label: 'Criar Primeiro Módulo', href: '#' }}
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
                          <button onClick={() => openModuleForm(mod)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Editar módulo">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDeleteModule(mod.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Excluir módulo">
                            <FiTrash2 />
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
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Avaliações dos Alunos</h3>

              {reviewsLoading ? (
                <Loading fullScreen={false} text="Carregando avaliações..." />
              ) : reviews.length === 0 ? (
                <EmptyState icon={<FiCheckSquare />} title="Nenhuma avaliação ainda" description="As avaliações dos alunos aparecerão aqui." />
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
        </div>
      </div>

      {/* Module Form Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h3>
            <div>
              <label className="label">Título do Módulo</label>
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="input-field"
                placeholder="Ex: Introdução ao Curso"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModuleForm(false)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={handleSaveModule} disabled={moduleSaving} className="btn-primary text-sm">
                {moduleSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
