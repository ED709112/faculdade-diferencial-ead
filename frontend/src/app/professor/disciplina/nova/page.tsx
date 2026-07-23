'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewDisciplinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    workload: '',
    titulacao: '',
    ementa: '',
    objetivo: '',
    conteudo_programatico: '',
    metodologia: '',
    metodologia_ensino: '',
    avaliacao: '',
    recursos_didaticos: '',
    referencias: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome da disciplina é obrigatório.'); return; }
    try {
      setLoading(true);
      const { data } = await api.post('/teacher/disciplines', {
        ...form,
        workload: form.workload ? parseInt(form.workload) : 0,
      });
      toast.success('Disciplina criada com sucesso!');
      router.push(`/professor/disciplinas/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar disciplina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/professor/disciplinas" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <FiArrowLeft className="text-lg text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Disciplina</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha a ementa completa da disciplina</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carga Horária (h)</label>
              <input name="workload" type="number" min="0" value={form.workload} onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titulação</label>
              <input name="titulacao" value={form.titulacao} onChange={handleChange} placeholder="Ex: Especialização, Mestrado, Doutorado"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ementa</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMENTA</label>
            <textarea name="ementa" rows={4} value={form.ementa} onChange={handleChange}
              placeholder="Descrição resumida do conteúdo programático da disciplina..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OBJETIVO</label>
            <textarea name="objetivo" rows={4} value={form.objetivo} onChange={handleChange}
              placeholder="Objetivos gerais e específicos da disciplina..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CONTEÚDO PROGRAMÁTICO</label>
            <textarea name="conteudo_programatico" rows={6} value={form.conteudo_programatico} onChange={handleChange}
              placeholder="Conteúdo programático detalhado da disciplina..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">METODOLOGIA</label>
              <textarea name="metodologia" rows={4} value={form.metodologia} onChange={handleChange}
                placeholder="Metodologia de ensino-aprendizagem..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">METODOLOGIA DO ENSINO</label>
              <textarea name="metodologia_ensino" rows={4} value={form.metodologia_ensino} onChange={handleChange}
                placeholder="Estratégias e métodos de ensino utilizados..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AVALIAÇÃO</label>
            <textarea name="avaliacao" rows={4} value={form.avaliacao} onChange={handleChange}
              placeholder="Critérios e formas de avaliação..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RECURSOS DIDÁTICOS</label>
            <textarea name="recursos_didaticos" rows={3} value={form.recursos_didaticos} onChange={handleChange}
              placeholder="Recursos utilizados nas aulas..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">REFERÊNCIAS</label>
            <textarea name="referencias" rows={4} value={form.referencias} onChange={handleChange}
              placeholder="Bibliografia e referências bibliográficas..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/professor/disciplinas"
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            <FiSave /> {loading ? 'Salvando...' : 'Criar Disciplina'}
          </button>
        </div>
      </form>
    </div>
  );
}
