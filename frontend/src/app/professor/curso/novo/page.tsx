'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiImage,
  FiSave,
  FiSend,
} from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
}

interface Category {
  id: number;
  name: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<CourseFormData>({
    title: '',
    subtitle: '',
    description: '',
    category_id: '',
    price: '',
    original_price: '',
    workload: '',
    requirements: '',
    target_audience: '',
    what_you_learn: '',
    video_url: '',
    has_certificate: true,
    is_free: false,
    featured: false,
  });

  React.useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCategories(data.categories || data.data || data || []);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value };
      if (name === 'is_free' && (e.target as HTMLInputElement).checked) {
        updated.price = '0';
      }
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

  const buildFormData = () => {
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
    if (imageFile) fd.append('image', imageFile);
    return fd;
  };

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim()) {
      toast.error('O título é obrigatório.');
      return;
    }
    if (!form.description.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }

    try {
      setSaving(true);
      const fd = buildFormData();
      if (publish) fd.append('status', 'published');
      else fd.append('status', 'draft');

      await api.post('/courses', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(publish ? 'Curso publicado com sucesso!' : 'Rascunho salvo com sucesso!');
      router.push('/professor/cursos');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar curso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/professor/cursos" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiArrowLeft className="text-xl text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Novo Curso</h2>
          <p className="text-gray-500 text-sm">Preencha as informações para criar um novo curso</p>
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="label">Imagem do Curso</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="w-full max-w-md h-56 object-cover rounded-xl" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-md h-56 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
          >
            <FiImage className="text-3xl text-gray-400" />
            <span className="text-sm text-gray-500">Clique para selecionar uma imagem</span>
            <span className="text-xs text-gray-400">JPG, PNG ou WebP (recomendado: 1280x720)</span>
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Informações Básicas</h3>

        <div>
          <label className="label">Título do Curso *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="input-field"
            placeholder="Ex: Curso Completo de Gestão de Projetos"
            maxLength={200}
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
            placeholder="Uma breve frase descritiva"
            maxLength={300}
          />
        </div>

        <div>
          <label className="label">Descrição *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className="input-field resize-none"
            placeholder="Descreva o curso em detalhes..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Categoria</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Carga Horária (horas)</label>
            <input
              type="number"
              name="workload"
              value={form.workload}
              onChange={handleChange}
              className="input-field"
              placeholder="Ex: 40"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Preço</h3>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_free"
              checked={form.is_free}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
          </label>
          <span className="text-sm font-medium text-gray-700">Curso Gratuito</span>
        </div>

        {!form.is_free && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Preço (R$)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                min="0"
                step="0.01"
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
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}
      </div>

      {/* Video & Media */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Vídeo & Mídia</h3>

        <div>
          <label className="label">URL do Vídeo de Apresentação</label>
          <input
            type="url"
            name="video_url"
            value={form.video_url}
            onChange={handleChange}
            className="input-field"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-gray-400 mt-1">Link do vídeo de apresentação do curso (YouTube, Vimeo)</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Detalhes do Curso</h3>

        <div>
          <label className="label">Pré-requisitos</label>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows={3}
            className="input-field resize-none"
            placeholder="Liste os pré-requisitos para este curso..."
          />
        </div>

        <div>
          <label className="label">Público-Alvo</label>
          <textarea
            name="target_audience"
            value={form.target_audience}
            onChange={handleChange}
            rows={3}
            className="input-field resize-none"
            placeholder="Quem deve fazer este curso?"
          />
        </div>

        <div>
          <label className="label">O que você vai aprender</label>
          <textarea
            name="what_you_learn"
            value={form.what_you_learn}
            onChange={handleChange}
            rows={4}
            className="input-field resize-none"
            placeholder="Liste os principais aprendizados do curso..."
          />
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Opções</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="has_certificate"
                checked={form.has_certificate}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
            </label>
            <span className="text-sm font-medium text-gray-700">Emitir certificado de conclusão</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
            </label>
            <span className="text-sm font-medium text-gray-700">Curso em destaque</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FiSave /> Salvar Rascunho
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <FiSend /> Publicar Curso
        </button>
      </div>
    </div>
  );
}
