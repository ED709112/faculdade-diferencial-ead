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
  const [showNewLesson, setShowNewLesson] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', content_type: 'video', video_url: '' });

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
        sort_order: modules.length + 1,
      });
      setModules([...modules, { ...data.module || data, lessons: [] }]);
      setNewModuleTitle('');
      setShowNewModule(false);
      toast.success('Módulo criado!');
    } catch {
      toast.error('Erro ao criar módulo');
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Módulo excluído!');
    } catch {
      toast.error('Erro ao excluir módulo');
    }
  };

  const handleAddLesson = async (moduleId: number) => {
    if (!newLesson.title.trim()) return;
    try {
      const mod = modules.find(m => m.id === moduleId);
      const { data } = await api.post('/lessons', {
        module_id: moduleId,
        title: newLesson.title,
        content_type: newLesson.content_type,
        video_url: newLesson.video_url,
        sort_order: (mod?.lessons?.length || 0) + 1,
      });
      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: [...(m.lessons || []), data.lesson || data] }
          : m
      ));
      setNewLesson({ title: '', content_type: 'video', video_url: '' });
      setShowNewLesson(null);
      toast.success('Aula criada!');
    } catch {
      toast.error('Erro ao criar aula');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  const tabs = [
    { key: 'dados', label: 'Dados do Curso' },
    { key: 'modulos', label: 'Módulos & Aulas' },
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

      {/* Tab: Módulos */}
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
                    <p className="text-xs text-gray-500">{mod.lessons?.length || 0} aulas</p>
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
                    title="Excluir módulo"
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
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowNewLesson(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={() => handleAddLesson(mod.id)} className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600">Criar Aula</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New Module */}
          {showNewModule ? (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <input
                placeholder="Título do módulo"
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                className="input-field"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowNewModule(false); setNewModuleTitle(''); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleAddModule} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600">Criar Módulo</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewModule(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 flex items-center justify-center gap-2 transition-colors"
            >
              <FiPlus /> Adicionar Módulo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
