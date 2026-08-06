'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiBook, FiClock, FiFolder, FiBookOpen, FiUser } from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';

interface MyDiscipline {
  id: number;
  title: string;
  description: string;
  period: number | null;
  workload: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  lessons_count: number;
  teacher_name: string;
}

export default function DisciplinesListPage() {
  const [disciplines, setDisciplines] = useState<MyDiscipline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/modules/teacher/mine');
      setDisciplines(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Loading text="Carregando disciplinas..." />;

  const grouped = disciplines.reduce<Record<string, MyDiscipline[]>>((acc, d) => {
    const key = d.course_title || 'Outros';
    (acc[key] = acc[key] || []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Disciplinas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Disciplinas em que você foi lotado pelo administrador. Gerencie as aulas e apostilas de cada uma.
        </p>
      </div>

      {disciplines.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">Você ainda não foi lotado em nenhuma disciplina.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Assim que o administrador atribuir uma disciplina, ela aparecerá aqui.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([courseTitle, list]) => (
          <div key={courseTitle}>
            <div className="flex items-center gap-2 mb-4">
              <FiBookOpen className="text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{courseTitle}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{list.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(d => (
                <Link
                  key={d.id}
                  href={`/professor/disciplinas/${d.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                      <FiBook className="text-primary-500" />
                    </div>
                    {d.period != null && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {d.period}º Período
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary-500 transition-colors">
                    {d.title}
                  </h3>
                  <div className="space-y-1 mb-4">
                    {d.workload > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiClock className="text-xs" /> {d.workload}h
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiUser className="text-xs" /> {d.teacher_name || 'Sem professor'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiFolder className="text-xs" /> {d.lessons_count} aula(s)
                    </p>
                  </div>
                  <div className="text-xs font-medium text-primary-500">
                    Gerenciar aulas e apostilas →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
