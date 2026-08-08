'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiSend, FiChevronDown, FiChevronUp, FiBookOpen, FiUsers, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Recipient {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  disciplines?: string | null;
}

type Tab = 'teacher' | 'admin';

export default function StudentComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('teacher');
  const [teachers, setTeachers] = useState<Recipient[]>([]);
  const [admins, setAdmins] = useState<Recipient[]>([]);
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [adminId, setAdminId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/recipients');
      setTeachers(data.teachers || []);
      setAdmins(data.admins || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const selectedTeacher = teachers.find((t) => t.id === teacherId);
  const selectedAdmin = admins.find((a) => a.id === adminId);

  const targetSummary = () => {
    if (tab === 'teacher') {
      if (!selectedTeacher) return 'Selecione o professor da disciplina abaixo';
      return selectedTeacher.disciplines
        ? `Professor(a): ${selectedTeacher.name} — ${selectedTeacher.disciplines}`
        : `Professor(a): ${selectedTeacher.name}`;
    }
    if (!selectedAdmin) return 'Selecione um responsável da administração abaixo';
    return `Administração: ${selectedAdmin.name}`;
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error('Digite a mensagem');
    if (tab === 'teacher' && !teacherId) return toast.error('Selecione um professor');
    if (tab === 'admin' && !adminId) return toast.error('Selecione um responsável da administração');

    const targetId = tab === 'teacher' ? Number(teacherId) : Number(adminId);

    try {
      setSending(true);
      const { data } = await api.post('/messages/conversation', {
        participant_ids: [targetId],
        initial_message: message.trim(),
      });
      const conversationId = data.id || data.conversation_id;
      if (conversationId) {
        toast.success('Mensagem enviada!');
        setMessage('');
        setOpen(false);
        router.push(`/aluno/mensagens/${conversationId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const resetForTab = (t: Tab) => {
    setTab(t);
    setTeacherId('');
    setAdminId('');
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
              ['teacher', 'Professor da disciplina', FiBookOpen],
              ['admin', 'Administração', FiUsers],
            ] as [Tab, string, React.ElementType][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => resetForTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${tab === key ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          {tab === 'teacher' ? (
            <label className="block mb-4">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Professor(a)</span>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione o professor...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.disciplines ? ` — ${t.disciplines}` : ''}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Nenhum professor vinculado às suas disciplinas.</p>
              )}
            </label>
          ) : (
            <label className="block mb-4">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">Responsável</span>
              <select
                value={adminId}
                onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione o responsável...</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {admins.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Nenhum responsável disponível no momento.</p>
              )}
            </label>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{targetSummary()}</p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Digite sua mensagem..."
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
