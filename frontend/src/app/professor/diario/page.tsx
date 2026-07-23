'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSave, FiBook, FiUser, FiEdit3, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Discipline {
  id: number;
  name: string;
}

interface StudentEntry {
  id: number;
  name: string;
  email: string;
  grades: {
    id: number;
    bimester: number;
    grade1: number | null;
    grade2: number | null;
    absences: number;
    observations: string | null;
  }[];
  submissions: {
    total_submissions: number;
    graded_count: number;
    avg_grade: number | null;
  };
}

export default function ProfessorDiarioPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number>(0);
  const [bimester, setBimester] = useState(1);
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    grade1: '', grade2: '', absences: '', observations: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDisciplines = useCallback(async () => {
    try {
      const { data } = await api.get('/teacher/disciplines');
      const list = Array.isArray(data) ? data : [];
      setDisciplines(list);
      if (list.length > 0 && !selectedDiscipline) {
        setSelectedDiscipline(list[0].id);
      }
    } catch {}
  }, []);

  const fetchGradebook = useCallback(async () => {
    if (!selectedDiscipline) return;
    try {
      setLoading(true);
      const { data } = await api.get('/submissions/gradebook', {
        params: { discipline_id: selectedDiscipline, bimester },
      });
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedDiscipline, bimester]);

  useEffect(() => { fetchDisciplines(); }, [fetchDisciplines]);
  useEffect(() => { fetchGradebook(); }, [fetchGradebook]);

  const startEdit = (student: StudentEntry) => {
    const gradeEntry = student.grades.find(g => g.bimester === bimester);
    setEditingStudent(student.id);
    setEditValues({
      grade1: gradeEntry?.grade1?.toString() || '',
      grade2: gradeEntry?.grade2?.toString() || '',
      absences: gradeEntry?.absences?.toString() || '0',
      observations: gradeEntry?.observations || '',
    });
  };

  const saveGrade = async (studentId: number) => {
    try {
      setSaving(true);
      await api.post('/submissions/gradebook', {
        discipline_id: selectedDiscipline,
        student_id: studentId,
        bimester,
        grade1: editValues.grade1 ? parseFloat(editValues.grade1) : null,
        grade2: editValues.grade2 ? parseFloat(editValues.grade2) : null,
        absences: parseInt(editValues.absences) || 0,
        observations: editValues.observations || null,
      });
      setMessage({ type: 'success', text: 'Nota salva com sucesso!' });
      setEditingStudent(null);
      fetchGradebook();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao salvar.' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const calcAverage = (g: StudentEntry['grades'][0]) => {
    const n1 = Number(g.grade1);
    const n2 = Number(g.grade2);
    if (isNaN(n1) && isNaN(n2)) return null;
    return ((isNaN(n1) ? 0 : n1) + (isNaN(n2) ? 0 : n2)) / 2;
  };

  const bimestres = [1, 2, 3, 4];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diário de Notas e Faltas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Registre 2 notas por bimestre — média = (1ª Nota + 2ª Nota) / 2
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Disciplina</label>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value={0}>Selecione...</option>
            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bimestre</label>
          <div className="flex gap-1">
            {bimestres.map(b => (
              <button
                key={b}
                onClick={() => setBimester(b)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  bimester === b
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {b}º
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedDiscipline ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiBook className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Selecione uma disciplina para ver o diário.</p>
        </div>
      ) : loading ? (
        <Loading text="Carregando diário..." />
      ) : students.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiUser className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum aluno matriculado nesta disciplina.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">Aluno</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-24">1ª Nota</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-24">2ª Nota</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-20">Média</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-16">Faltas</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-24">Atividades</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-900 dark:text-white w-20">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.map((student) => {
                  const gradeEntry = student.grades.find(g => g.bimester === bimester);
                  const avg = gradeEntry ? calcAverage(gradeEntry) : null;
                  const isEditing = editingStudent === student.id;

                  return (
                    <tr key={student.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isEditing ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                      </td>
                      {['grade1', 'grade2'].map((field) => (
                        <td key={field} className="text-center px-3 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={(editValues as any)[field]}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {(gradeEntry as any)?.[field] ?? '—'}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="text-center px-3 py-3">
                        <span className={`font-bold ${avg !== null && avg >= 7 ? 'text-green-600 dark:text-green-400' : avg !== null && avg < 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {avg !== null ? avg.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.absences}
                            onChange={(e) => setEditValues(prev => ({ ...prev, absences: e.target.value }))}
                            className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center"
                          />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">
                            {gradeEntry?.absences || 0}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-3 py-3">
                        <div className="text-xs">
                          <span className="text-gray-700 dark:text-gray-300">
                            {student.submissions.graded_count}/{student.submissions.total_submissions}
                          </span>
                          {student.submissions.avg_grade !== null && (
                            <span className="block text-gray-400 dark:text-gray-500">
                              média: {Number(student.submissions.avg_grade).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center px-3 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={() => saveGrade(student.id)} disabled={saving}
                              className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Salvar">
                              <FiSave className="text-sm" />
                            </button>
                            <button onClick={() => setEditingStudent(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancelar">
                              <FiAlertCircle className="text-sm" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(student)}
                            className="p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Editar">
                            <FiEdit3 className="text-sm" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
