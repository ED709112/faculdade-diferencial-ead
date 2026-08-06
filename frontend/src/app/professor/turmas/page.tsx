'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiLayers, FiMapPin, FiUsers, FiChevronDown, FiChevronRight,
  FiCalendar, FiBookOpen, FiClock, FiUser,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';

interface Turma {
  id: number;
  name: string;
  course_id: number;
  course_title: string;
  course_slug: string;
  polo_name: string | null;
  polo_city: string | null;
  period: number | null;
  shift: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number | null;
  status: string;
  students_count: number;
}

interface TurmaStudent {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_active: number;
  enrollment_id: number;
  enrollment_status: string;
  progress_percentage: number;
}

const SHIFT_LABELS: Record<string, string> = {
  ead: 'EAD',
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  noturno: 'Noturno',
};

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  active: { label: 'Ativa', classes: 'bg-green-50 text-green-700' },
  pending: { label: 'Pendente', classes: 'bg-yellow-50 text-yellow-700' },
  finished: { label: 'Concluída', classes: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelada', classes: 'bg-red-50 text-red-700' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function ProfessorTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [studentsByTurma, setStudentsByTurma] = useState<Record<number, TurmaStudent[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/turmas/mine');
      setTurmas(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTurma = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (studentsByTurma[id]) return;
    try {
      setLoadingStudents(id);
      const { data } = await api.get(`/turmas/mine/${id}/students`);
      setStudentsByTurma(prev => ({ ...prev, [id]: data.students || [] }));
    } catch {
      setStudentsByTurma(prev => ({ ...prev, [id]: [] }));
    } finally {
      setLoadingStudents(null);
    }
  };

  if (loading) return <Loading text="Carregando turmas..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Turmas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Turmas em que você foi atribuído como professor. Clique para ver os alunos.
        </p>
      </div>

      {turmas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiLayers className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">Você ainda não foi atribuído a nenhuma turma.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Assim que o administrador criar uma turma com você como professor, ela aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map(turma => {
            const statusInfo = STATUS_LABELS[turma.status] || STATUS_LABELS.active;
            const isExpanded = expandedId === turma.id;
            const students = studentsByTurma[turma.id] || [];
            return (
              <div key={turma.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleTurma(turma.id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                        <FiBookOpen className="text-primary-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-gray-900 dark:text-white">{turma.name}</h2>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.classes}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1"><FiBookOpen className="text-[10px]" /> {turma.course_title}</span>
                          {turma.polo_name && (
                            <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {turma.polo_name}{turma.polo_city ? ` · ${turma.polo_city}` : ''}</span>
                          )}
                          <span className="flex items-center gap-1"><FiUsers className="text-[10px]" /> {turma.students_count} aluno(s){turma.max_students ? ` de ${turma.max_students}` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 text-right">
                        {turma.period != null && (
                          <p className="flex items-center gap-1 justify-end"><FiClock className="text-[10px]" /> {turma.period}º período</p>
                        )}
                        {turma.shift && (
                          <p className="flex items-center gap-1 justify-end"><FiClock className="text-[10px]" /> {SHIFT_LABELS[turma.shift] || turma.shift}</p>
                        )}
                        {(turma.start_date || turma.end_date) && (
                          <p className="flex items-center gap-1 justify-end"><FiCalendar className="text-[10px]" /> {formatDate(turma.start_date)} → {formatDate(turma.end_date)}</p>
                        )}
                      </div>
                      {isExpanded ? <FiChevronDown className="text-gray-400" /> : <FiChevronRight className="text-gray-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4">
                    {loadingStudents === turma.id ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Carregando alunos...</p>
                    ) : students.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                        Nenhum aluno matriculado nesta turma ainda.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aluno</th>
                              <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                              <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Progresso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {students.map(s => (
                              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center overflow-hidden shrink-0">
                                      {s.avatar ? (
                                        <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <FiUser className="text-secondary-500" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {s.is_active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                                  {s.progress_percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
