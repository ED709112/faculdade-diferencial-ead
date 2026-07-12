'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiSave,
  FiSend,
  FiImage,
  FiX,
  FiUpload,
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
  email: string;
}

interface CourseFormData {
  title: string;
  subtitle: string;
  description: string;
  content_program: string;
  category_id: string;
  teacher_id: string;
  price: string;
  original_price: string;
  workload: string;
  workload_certificate: string;
  requirements: string;
  target_audience: string;
  what_you_learn: string;
  video_presentation: string;
  has_certificate: boolean;
  is_free: boolean;
  featured: boolean;
  status: 'draft' | 'published';
  max_installments: string;
}

export default function NovoCursoAdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [form, setForm] = useState<CourseFormData>({
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
    max_installments: '1',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, teacherRes] = await Promise.all([
          api.get('/categories'),
          api.get('/admin/users', { params: { role: 'teacher', limit: 100 } }),
        ]);
        setCategories(catRes.data.data || catRes.data.categories || catRes.data || []);
        setTeachers(teacherRes.data.data || teacherRes.data.users || teacherRes.data || []);
      } catch {
        toast.error('Erro ao carregar dados');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (!form.teacher_id) {
      toast.error('Selecione um professor');
      return;
    }

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
        status,
      };

      const { data } = await api.post('/courses', payload);

      if (imageFile && data.id) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          await api.post(`/uploads/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { entity_type: 'course', entity_id: data.id },
          });
        } catch {
          // Image upload failed, but course was created
        }
      }

      toast.success(status === 'published' ? 'Curso publicado com sucesso!' : 'Curso salvo como rascunho!');
      router.push('/admin/cursos');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao criar curso';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/cursos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Novo Curso</h1>
          <p className="text-sm text-gray-500">Preencha os dados do curso</p>
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <label className="label">Imagem do Curso</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        {imagePreview ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
              <FiX />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
          >
            <FiUpload className="text-3xl" />
            <span className="text-sm">Clique para enviar uma imagem</span>
            <span className="text-xs text-gray-400">PNG, JPG até 5MB</span>
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>

        <div>
          <label className="label">Título do Curso *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="input-field"
            placeholder="Ex: Administração de Empresas"
          />
        </div>

        <div>
          <label className="label">Subtítulo</label>
          <input
            type="text"
            name="subtitle"
            value={form.subtitle}
            onChange={handleChange}
            className="input-field"
            placeholder="Breve descrição do curso"
          />
        </div>

        <div>
          <label className="label">Descrição Completa</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="input-field"
            placeholder="Descreva o curso em detalhes..."
          />
        </div>

        <div>
          <label className="label">Conteúdo Programático</label>
          <textarea
            name="content_program"
            value={form.content_program}
            onChange={handleChange}
            rows={6}
            className="input-field"
            placeholder="Lista do conteúdo programático do curso..."
          />
        </div>
      </div>

      {/* Teacher & Category */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Professor e Categoria</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Professor *</label>
            <select name="teacher_id" value={form.teacher_id} onChange={handleChange} className="input-field">
              <option value="">Selecione o professor</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
              <option value="">Selecione a categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Preço e Carga Horária</h2>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_free"
            checked={form.is_free}
            onChange={handleChange}
            className="w-4 h-4 text-primary-500 rounded"
          />
          <label className="text-sm text-gray-700">Curso gratuito</label>
        </div>

        {!form.is_free && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Preço (R$) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="label">Preço Original (R$)</label>
              <input
                type="number"
                name="original_price"
                value={form.original_price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="label">Carga Horária (horas) *</label>
              <input
                type="number"
                name="workload"
                value={form.workload}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        )}

        {form.is_free && (
          <div>
            <label className="label">Carga Horária (horas) *</label>
            <input
              type="number"
              name="workload"
              value={form.workload}
              onChange={handleChange}
              className="input-field max-w-xs"
              placeholder="0"
              min="0"
            />
          </div>
        )}

        <div>
          <label className="label">Carga Horária para Certificado (horas)</label>
          <input
            type="number"
            name="workload_certificate"
            value={form.workload_certificate}
            onChange={handleChange}
            className="input-field max-w-xs"
            placeholder="Mesma da carga horária do curso"
            min="0"
          />
        </div>

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

      {/* Additional Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Informações Adicionais</h2>

        <div>
          <label className="label">Requisitos</label>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="O que o aluno precisa saber antes do curso..."
          />
        </div>

        <div>
          <label className="label">Público-Alvo</label>
          <textarea
            name="target_audience"
            value={form.target_audience}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Para quem é este curso..."
          />
        </div>

        <div>
          <label className="label">O que o aluno vai aprender</label>
          <textarea
            name="what_you_learn"
            value={form.what_you_learn}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Principais aprendizados do curso..."
          />
        </div>

        <div>
          <label className="label">URL do Vídeo de Apresentação</label>
          <input
            type="url"
            name="video_presentation"
            value={form.video_presentation}
            onChange={handleChange}
            className="input-field"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Opções</h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="has_certificate" checked={form.has_certificate} onChange={handleChange} className="w-4 h-4 text-primary-500 rounded" />
            <span className="text-sm text-gray-700">Emitir certificado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="w-4 h-4 text-primary-500 rounded" />
            <span className="text-sm text-gray-700">Curso em destaque</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
        <Link
          href="/admin/cursos"
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-center"
        >
          Cancelar
        </Link>
        <button
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <FiSave /> Salvar Rascunho
        </button>
        <button
          onClick={() => handleSubmit('published')}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <FiSend /> Publicar Curso
        </button>
      </div>
    </div>
  );
}
