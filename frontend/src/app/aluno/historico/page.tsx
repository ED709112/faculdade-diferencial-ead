'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBookOpen, FiCheckCircle, FiXCircle, FiClock, FiUser,
  FiAward, FiFileText, FiMapPin, FiDownload,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';

interface BimesterEntry {
  bimester: number;
  grade1: number | null;
  grade2: number | null;
  absences: number;
}

interface Discipline {
  discipline_id: number;
  name: string;
  workload: number | null;
  average: number | null;
  total_absences: number;
  frequency: number | null;
  situation: string;
  bimester_entries: BimesterEntry[];
}

interface TurmaInfo {
  id: number;
  name: string;
  period: string | null;
  shift: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface CourseTranscript {
  enrollment_id: number;
  course_id: number;
  title: string;
  workload: number;
  enrollment_status: string;
  final_grade: number | null;
  progress_percentage: number;
  completed_at: string | null;
  certificate_issued: number;
  certificate_issued_at: string | null;
  turma: TurmaInfo | null;
  polo: string | null;
  average: number | null;
  situation: string;
  disciplines: Discipline[];
}

const SHIFT_LABELS: Record<string, string> = {
  ead: 'EAD',
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  noturno: 'Noturno',
};

function situationBadge(situation: string) {
  const lower = situation.toLowerCase();
  const isApproved = lower.includes('aprov') || lower.includes('conclu');
  const isFailed = lower.includes('reprov');
  const classes = isApproved
    ? 'bg-green-50 text-green-700'
    : isFailed
      ? 'bg-red-50 text-red-700'
      : 'bg-yellow-50 text-yellow-700';
  const Icon = isApproved ? FiCheckCircle : isFailed ? FiXCircle : FiClock;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      <Icon className="text-[10px]" /> {situation}
    </span>
  );
}

export default function AlunoHistoricoPage() {
  const [data, setData] = useState<{ student: any; courses: CourseTranscript[]; unlinked_disciplines: Discipline[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/historico');
      setData(data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/historico/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `historico-escolar-${data?.student?.name?.toLowerCase().replace(/\s+/g, '-') || 'aluno'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loading text="Gerando histórico escolar..." />;

  if (!data) {
    return (
      <EmptyState
        icon={<FiFileText />}
        title="Não foi possível carregar o histórico"
        description="Tente novamente em instantes."
      />
    );
  }

  const totalCourses = data.courses.length;
  const totalDisciplines = data.courses.reduce((s, c) => s + c.disciplines.length, 0)
    + data.unlinked_disciplines.length;
  const approvedDisciplines = data.courses.reduce(
    (s, c) => s + c.disciplines.filter(d => d.situation === 'Aprovado').length, 0
  ) + data.unlinked_disciplines.filter(d => d.situation === 'Aprovado').length;
  const overallAverage = (() => {
    const avgs = data.courses.map(c => c.average).filter(a => a !== null);
    if (!avgs.length) return null;
    return (avgs.reduce((s, a) => s + (a as number), 0) / avgs.length).toFixed(2).replace('.', ',');
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico Escolar</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.student.name} · {data.student.email}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FiDownload className="text-[14px]" />
          {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Cursos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCourses}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Disciplinas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalDisciplines}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Aprovadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedDisciplines}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Média Geral</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overallAverage || '—'}</p>
        </div>
      </div>

      {data.courses.length === 0 && data.unlinked_disciplines.length === 0 ? (
        <EmptyState
          icon={<FiFileText />}
          title="Nenhum histórico disponível"
          description="Matricule-se em um curso para gerar seu histórico escolar."
        />
      ) : (
        <>
          {data.courses.map((course) => (
            <div key={course.enrollment_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FiBookOpen className="text-primary-500" /> {course.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {course.workload ? <span>Carga horária: {course.workload}h</span> : null}
                    {course.polo && <span className="flex items-center gap-1"><FiMapPin className="text-[10px]" /> {course.polo}</span>}
                    {course.turma && (
                      <span className="flex items-center gap-1">
                        Turma: {course.turma.name}
                        {course.turma.period ? ` · ${course.turma.period}` : ''}
                        {course.turma.shift ? ` · ${SHIFT_LABELS[course.turma.shift] || course.turma.shift}` : ''}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Média do curso</p>
                    <p className="text-lg font-bold text-gray-900">
                      {course.average !== null ? course.average.toFixed(2).replace('.', ',') : '—'}
                    </p>
                  </div>
                  {situationBadge(course.situation)}
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
                <span>Status da matrícula: <strong>{course.enrollment_status}</strong></span>
                {course.final_grade !== null && <span>Nota final: <strong>{course.final_grade}</strong></span>}
                <span>Progresso: <strong>{course.progress_percentage}%</strong></span>
                {course.certificate_issued === 1 && (
                  <span className="flex items-center gap-1 text-green-700">
                    <FiAward className="text-[10px]" /> Certificado emitido
                    {course.certificate_issued_at ? ` em ${new Date(course.certificate_issued_at).toLocaleDateString('pt-BR')}` : ''}
                  </span>
                )}
              </div>

              {course.disciplines.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-500">
                  Nenhuma nota lançada para as disciplinas deste curso.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Disciplina</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-500">Carga Horária</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-500">Frequência</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-500">Faltas</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-500">Média</th>
                        <th className="text-center px-5 py-3 font-medium text-gray-500">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {course.disciplines.map(d => (
                        <tr key={d.discipline_id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{d.name}</p>
                            {d.bimester_entries.length > 0 && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {d.bimester_entries.map(e => `B${e.bimester}: ${e.grade1 ?? '—'}/${e.grade2 ?? '—'}`).join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center text-gray-700">
                            {d.workload ? `${d.workload}h` : '—'}
                          </td>
                          <td className="px-5 py-3 text-center text-gray-700">
                            {d.frequency !== null ? `${d.frequency}%` : '—'}
                          </td>
                          <td className="px-5 py-3 text-center text-gray-700">{d.total_absences}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-semibold text-gray-900">
                              {d.average !== null ? d.average.toFixed(2).replace('.', ',') : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">{situationBadge(d.situation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {data.unlinked_disciplines.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FiUser className="text-primary-500" /> Outras disciplinas
                </h2>
                <p className="text-xs text-gray-500 mt-1">Notas lançadas sem vínculo direto com um curso.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Disciplina</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Carga Horária</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Frequência</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Faltas</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Média</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.unlinked_disciplines.map(d => (
                      <tr key={d.discipline_id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                        <td className="px-5 py-3 text-center text-gray-700">{d.workload ? `${d.workload}h` : '—'}</td>
                        <td className="px-5 py-3 text-center text-gray-700">{d.frequency !== null ? `${d.frequency}%` : '—'}</td>
                        <td className="px-5 py-3 text-center text-gray-700">{d.total_absences}</td>
                        <td className="px-5 py-3 text-center font-semibold text-gray-900">
                          {d.average !== null ? d.average.toFixed(2).replace('.', ',') : '—'}
                        </td>
                        <td className="px-5 py-3 text-center">{situationBadge(d.situation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
