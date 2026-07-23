'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiBook, FiClock, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Discipline {
  id: number;
  name: string;
  workload: number;
  titulacao: string;
  status: string;
  materials_count: number;
  created_at: string;
}

export default function DisciplinesListPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/teacher/disciplines');
      setDisciplines(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Excluir a disciplina "${name}"? Todos os materiais também serão excluídos.`)) return;
    try {
      await api.delete(`/teacher/disciplines/${id}`);
      toast.success('Disciplina excluída.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  if (loading) return <Loading text="Carregando disciplinas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Disciplinas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie suas disciplinas e materiais didáticos</p>
        </div>
        <Link
          href="/professor/disciplina/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors"
        >
          <FiPlus /> Nova Disciplina
        </Link>
      </div>

      {disciplines.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma disciplina cadastrada.</p>
          <Link
          href="/professor/disciplina/nova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-xl text-sm font-medium hover:bg-secondary-600 transition-colors"
          >
            <FiPlus /> Cadastrar Primeira Disciplina
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplines.map(d => (
            <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <FiBook className="text-primary-500" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {d.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{d.name}</h3>
              <div className="space-y-1 mb-4">
                {d.workload > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <FiClock className="text-xs" /> {d.workload}h
                  </p>
                )}
                {d.titulacao && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.titulacao}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FiFolder className="text-xs" /> {d.materials_count} material(is)
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/professor/disciplinas/${d.id}`}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
                >
                  Materiais
                </Link>
                <Link
                  href={`/professor/disciplinas/${d.id}/editar`}
                  className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <FiEdit2 />
                </Link>
                <button
                  onClick={() => handleDelete(d.id, d.name)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
