'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUsers, FiCheck, FiXCircle,
  FiCalendar, FiMapPin, FiBookOpen, FiUser, FiClock, FiUserPlus,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const SHIFT_LIST = [
  { value: 'ead', label: 'EAD' },
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'noturno', label: 'Noturno' },
];

const STATUS_LIST = [
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
  { value: 'closed', label: 'Encerrada' },
];

interface Turma {
  id: number;
  name: string;
  course_id: number;
  polo_id: number | null;
  teacher_id: number | null;
  period: string | null;
  shift: string;
  start_date: string | null;
  end_date: string | null;
  max_students: number | null;
  status: string;
  course_title: string;
  polo_name: string | null;
  polo_city: string | null;
  teacher_name: string | null;
  students_count: number;
}

interface CourseOption { id: number; title: string; }
interface PoloOption { id: number; name: string; city: string; }
interface TeacherOption { id: number; name: string; }
interface StudentInTurma {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  enrollment_status: string;
  progress_percentage: number;
}
interface AvailableStudent {
  id: number;
  name: string;
  email: string;
  enrollment_id: number | null;
  enrollment_status: string | null;
}

const emptyForm = {
  name: '', course_id: '', polo_id: '', teacher_id: '', period: '',
  shift: 'ead', start_date: '', end_date: '', max_students: '',
  status: 'active',
};

export default function AdminTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [polos, setPolos] = useState<PoloOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Turma | null>(null);
  const [detailStudents, setDetailStudents] = useState<StudentInTurma[]>([]);
  const [available, setAvailable] = useState<AvailableStudent[]>([]);
  const [selectedAdd, setSelectedAdd] = useState('');
  const [adding, setAdding] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [turmaRes, courseRes, poloRes, teacherRes] = await Promise.all([
        api.get('/turmas'),
        api.get('/courses'),
        api.get('/polos'),
        api.get('/admin/users', { params: { role: 'teacher', limit: 100 } }),
      ]);
      setTurmas(Array.isArray(turmaRes.data) ? turmaRes.data : turmaRes.data.data || []);
      const courseList = Array.isArray(courseRes.data) ? courseRes.data : courseRes.data.data || [];
      setCourses(courseList.map((c: any) => ({ id: c.id, title: c.title })));
      const poloList = Array.isArray(poloRes.data) ? poloRes.data : poloRes.data.data || [];
      setPolos(poloList.map((p: any) => ({ id: p.id, name: p.name, city: p.city })));
      const teacherList = Array.isArray(teacherRes.data) ? teacherRes.data : teacherRes.data.data || [];
      setTeachers(teacherList.map((t: any) => ({ id: t.id, name: t.name })));
    } catch {
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: Turma) => {
    setEditingId(t.id);
    setForm({
      name: t.name || '',
      course_id: String(t.course_id || ''),
      polo_id: t.polo_id ? String(t.polo_id) : '',
      teacher_id: t.teacher_id ? String(t.teacher_id) : '',
      period: t.period || '',
      shift: t.shift || 'ead',
      start_date: t.start_date || '',
      end_date: t.end_date || '',
      max_students: t.max_students ? String(t.max_students) : '',
      status: t.status || 'active',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome da turma é obrigatório'); return; }
    if (!form.course_id) { toast.error('Selecione o curso'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        course_id: Number(form.course_id),
        polo_id: form.polo_id ? Number(form.polo_id) : null,
        teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
        period: form.period || null,
        shift: form.shift,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        max_students: form.max_students ? Number(form.max_students) : null,
        status: form.status,
      };

      if (editingId) {
        await api.put(`/turmas/${editingId}`, payload);
        toast.success('Turma atualizada!');
      } else {
        await api.post('/turmas', payload);
        toast.success('Turma criada!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar turma');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta turma? Os alunos vinculados permanecem matriculados no curso.')) return;
    try {
      await api.delete(`/turmas/${id}`);
      setTurmas(turmas.filter(t => t.id !== id));
      toast.success('Turma excluída!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir turma');
    }
  };

  const openDetail = async (t: Turma) => {
    setDetail(t);
    setDetailLoading(true);
    setSelectedAdd('');
    try {
      const [studentsRes, availableRes] = await Promise.all([
        api.get(`/turmas/${t.id}/students`),
        api.get(`/turmas/${t.id}/available-students`),
      ]);
      const studentsData = studentsRes.data.students || [];
      setDetailStudents(studentsData);
      setAvailable(Array.isArray(availableRes.data) ? availableRes.data : []);
    } catch {
      toast.error('Erro ao carregar alunos da turma');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async (turmaId: number) => {
    try {
      const [studentsRes, availableRes] = await Promise.all([
        api.get(`/turmas/${turmaId}/students`),
        api.get(`/turmas/${turmaId}/available-students`),
      ]);
      setDetailStudents(studentsRes.data.students || []);
      setAvailable(Array.isArray(availableRes.data) ? availableRes.data : []);
    } catch {
      toast.error('Erro ao atualizar alunos');
    }
  };

  const handleAddStudent = async () => {
    if (!detail) return;
    if (!selectedAdd) { toast.error('Selecione um aluno'); return; }
    setAdding(true);
    try {
      await api.post(`/turmas/${detail.id}/students`, { user_id: Number(selectedAdd) });
      toast.success('Aluno adicionado à turma!');
      setSelectedAdd('');
      refreshDetail(detail.id);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar aluno');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    if (!detail) return;
    if (!confirm('Remover aluno desta turma? A matrícula no curso é mantida.')) return;
    try {
      await api.delete(`/turmas/${detail.id}/students/${userId}`);
      toast.success('Aluno removido da turma');
      refreshDetail(detail.id);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover aluno');
    }
  };

  const shiftLabel = (s: string) => SHIFT_LIST.find(x => x.value === s)?.label || s;
  const statusLabel = (s: string) => STATUS_LIST.find(x => x.value === s)?.label || s;

  const filtered = turmas.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.course_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.polo_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Carregando turmas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie as turmas por curso, polo, período e turno</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Nova Turma
        </button>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <FiSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por turma, curso, polo ou professor..."
          className="flex-1 outline-none text-sm"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar Turma' : 'Nova Turma'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: 1º Período - Enfermagem - 2026.1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Curso *</label>
                <select
                  value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="">Selecione o curso</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Polo</label>
                <select
                  value={form.polo_id}
                  onChange={e => setForm({ ...form, polo_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="">Nenhum</option>
                  {polos.map(p => <option key={p.id} value={p.id}>{p.name} {p.city ? `- ${p.city}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Professor</label>
                <select
                  value={form.teacher_id}
                  onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="">Nenhum</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Período</label>
                <input
                  type="text"
                  value={form.period}
                  onChange={e => setForm({ ...form, period: e.target.value })}
                  placeholder="Ex: 2026.1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                <select
                  value={form.shift}
                  onChange={e => setForm({ ...form, shift: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  {SHIFT_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Término</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vagas</label>
                <input
                  type="number"
                  min="0"
                  value={form.max_students}
                  onChange={e => setForm({ ...form, max_students: e.target.value })}
                  placeholder="Ex: 40"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiUsers />}
          title="Nenhuma turma cadastrada"
          description="Crie turmas para organizar os alunos por curso, polo e período."
          action={{ label: 'Criar Primeira Turma', href: '#', onClick: openNew }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Turma</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Curso</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Polo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Período/Turno</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Professor</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Alunos</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <FiCalendar className="text-[10px]" />
                      {t.start_date || '—'} até {t.end_date || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      <FiBookOpen className="text-[10px] text-gray-400" /> {t.course_title}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      <FiMapPin className="text-[10px] text-gray-400" />
                      {t.polo_name ? `${t.polo_name}${t.polo_city ? ` (${t.polo_city})` : ''}` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      <FiClock className="text-[10px] text-gray-400" />
                      {t.period || '—'} · {shiftLabel(t.shift)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      <FiUser className="text-[10px] text-gray-400" /> {t.teacher_name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => openDetail(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100"
                    >
                      <FiUsers className="text-[10px]" />
                      {t.students_count}{t.max_students ? ` / ${t.max_students}` : ''}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      t.status === 'active' ? 'bg-green-50 text-green-700'
                      : t.status === 'closed' ? 'bg-gray-100 text-gray-500'
                      : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {t.status === 'active' ? <><FiCheck className="text-[10px]" /> {statusLabel(t.status)}</>
                        : <><FiXCircle className="text-[10px]" /> {statusLabel(t.status)}</>}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openDetail(t)}
                        className="p-2 rounded-lg hover:bg-primary-50 text-primary-600"
                        title="Ver alunos"
                      >
                        <FiUsers className="text-sm" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                        title="Editar"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Excluir"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detail.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {detail.course_title}
                  {detail.polo_name ? ` · ${detail.polo_name}` : ''}
                  {detail.period ? ` · ${detail.period}` : ''} · {shiftLabel(detail.shift)}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Alunos matriculados</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {detailStudents.length}{detail.max_students ? ` / ${detail.max_students}` : ''}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Professor</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{detail.teacher_name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Vigência</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {detail.start_date || '—'} até {detail.end_date || '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2">
              <select
                value={selectedAdd}
                onChange={e => setSelectedAdd(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
              >
                <option value="">Selecionar aluno para adicionar...</option>
                {available.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.enrollment_id ? '(já matriculado no curso)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddStudent}
                disabled={adding || !selectedAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                <FiUserPlus /> {adding ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>

            {detailLoading ? (
              <Loading text="Carregando alunos..." />
            ) : detailStudents.length === 0 ? (
              <EmptyState
                icon={<FiUsers />}
                title="Nenhum aluno na turma"
                description="Adicione alunos matriculados no curso a esta turma."
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Aluno</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Progresso</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detailStudents.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center overflow-hidden shrink-0">
                              {s.avatar ? <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" /> : <FiUser className="text-secondary-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs text-gray-400 truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-gray-700">{s.progress_percentage || 0}%</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            s.enrollment_status === 'active' ? 'bg-green-50 text-green-700'
                            : s.enrollment_status === 'completed' ? 'bg-primary-50 text-primary-600'
                            : 'bg-gray-100 text-gray-500'
                          }`}>
                            {s.enrollment_status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleRemoveStudent(s.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Remover da turma"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
