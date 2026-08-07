'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiSend, FiChevronDown, FiChevronUp, FiUsers, FiBookOpen, FiUser, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Turma {
  id: number;
  name: string;
  course_title?: string;
  students_count?: number;
}

interface Recipient {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

type Audience = 'turma' | 'students' | 'teacher' | 'teachers';

export default function AdminComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>('turma');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [teachers, setTeachers] = useState<Recipient[]>([]);
  const [students, setStudents] = useState<Recipient[]>([]);
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [turmaRes, recipRes] = await Promise.all([
        api.get('/turmas'),
        api.get('/messages/recipients'),
      ]);
      setTurmas(Array.isArray(turmaRes.data) ? turmaRes.data : turmaRes.data?.data || []);
      setTeachers(recipRes.data.teachers || []);
      setStudents(recipRes.data.students || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectedTurma = turmas.find((t) => t.id === turmaId);
  const selectedTeacher = teachers.find((t) => t.id === teacherId);

  const targetSummary = () => {
    if (audience === 'turma') {
      return selectedTurma
        ? `Turma "${selectedTurma.name}"${selectedTurma.course_title ? ` — ${selectedTurma.course_title}` : ''} (${selectedTurma.students_count ?? 0} alunos)`
        : 'Selecione uma turma abaixo';
    }
    if (audience === 'students') {
      return selectedStudents.size === 0
        ? 'Selecione os estudantes abaixo'
        : `${selectedStudents.size} estudante(s) selecionado(s)`;
    }
    if (audience === 'teacher') {
      return selectedTeacher ? `Professor(a): ${selectedTeacher.name}` : 'Selecione um professor abaixo';
    }
    return `${teachers.length} professor(es) receberão`;
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error('Digite a mensagem');
    if (audience === 'turma' && !turmaId) return toast.error('Selecione uma turma');
    if (audience === 'teacher' && !teacherId) return toast.error('Selecione um professor');
    if (audience === 'students' && selectedStudents.size === 0) return toast.error('Selecione pelo menos um estudante');

    try {
      setSending(true);
      const payload: any = { audience, message: message.trim() };
      if (subject.trim()) payload.subject = subject.trim();
      if (audience === 'turma') payload.turma_id = Number(turmaId);
      if (audience === 'teacher') payload.teacher_id = Number(teacherId);
      if (audience === 'students') payload.student_ids = [...selectedStudents];

      const { data } = await api.post('/messages/broadcast', payload);
      toast.success(`Mensagem enviada para ${data.recipients_count} destinatário(s)`);
      setMessage('');
      setSubject('');
      setSelectedStudents(new Set());
      setOpen(false);
      if (data.conversation?.id) {
        router.push(`/admin/mensagens/${data.conversation.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const resetForAudience = (a: Audience) => {
    setAudience(a);
    setTurmaId('');
    setTeacherId('');
    setSelectedStudents(new Set());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <FiSend className="text-primary-500" />
          {open ? 'Cancelar nova mensagem' : 'Nova mensagem'}
        </span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {open && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ['turma', 'Para uma turma', FiBookOpen],
              ['students', 'Para estudantes', FiUsers],
              ['teacher', 'Para um professor', FiUser],
              ['teachers', 'Todos os professores', FiUsers],
            ] as [Audience, string, React.ElementType][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => resetForAudience(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${audience === key ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {audience === 'turma' && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Turma</span>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione a turma...</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.course_title || ''} ({t.students_count ?? 0} alunos)
                    </option>
                  ))}
                </select>
              </label>
            )}

            {audience === 'teacher' && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Professor(a)</span>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione o professor...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
            )}

            {audience === 'students' && (
              <div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Estudantes</span>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar estudante..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-xs text-gray-400">Nenhum estudante encontrado</p>
                  ) : (
                    filteredStudents.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200">{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <label className="block">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Assunto (opcional)</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Aviso sobre a prova final"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{targetSummary()}</p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Digite a mensagem que será enviada..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <FiSend />
              {sending ? 'Enviando...' : 'Enviar mensagem'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiX />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
