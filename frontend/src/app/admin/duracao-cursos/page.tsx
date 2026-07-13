'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
} from 'react-icons/fi';

interface Course { id: number; title: string; }
interface Module { id: number; title: string; }
interface Enrollment { id: number; user_id: number; student_name: string; student_email: string; }
interface Duration {
  id: number;
  course_id: number;
  course_title: string;
  module_id: number | null;
  module_title: string | null;
  enrollment_id: number | null;
  student_name: string | null;
  title: string;
  start_date: string;
  end_date: string;
  duration_days: number | null;
  status: string;
  alert_sent_24h: number;
  alert_sent: number;
}

export default function AdminDuracaoCursosPage() {
  const [durations, setDurations] = useState<Duration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    course_id: '',
    module_id: '',
    enrollment_id: '',
    title: '',
    start_date: '',
    end_date: '',
    duration_days: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.course_id) {
      api.get(`/modules/course/${form.course_id}`).then(res => {
        setModules(res.data.modules || res.data.data || res.data || []);
      }).catch(() => setModules([]));
      api.get(`/admin/enrollments?course_id=${form.course_id}`).then(res => {
        setEnrollments(res.data.data || res.data || []);
      }).catch(() => setEnrollments([]));
    }
  }, [form.course_id]);

  useEffect(() => {
    if (form.start_date && form.duration_days) {
      const start = new Date(form.start_date);
      start.setDate(start.getDate() + Number(form.duration_days));
      setForm(prev => ({ ...prev, end_date: start.toISOString().slice(0, 16) }));
    }
  }, [form.start_date, form.duration_days]);

  const fetchData = async () => {
    try {
      const [durRes, coursesRes] = await Promise.allSettled([
        api.get('/course-durations'),
        api.get('/courses'),
      ]);
      if (durRes.status === 'fulfilled') setDurations(durRes.value.data || []);
      if (coursesRes.status === 'fulfilled') {
        const data = coursesRes.value.data;
        setCourses(data.data || data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.title || !form.start_date || !form.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      await api.post('/course-durations', {
        course_id: Number(form.course_id),
        module_id: form.module_id ? Number(form.module_id) : null,
        enrollment_id: form.enrollment_id ? Number(form.enrollment_id) : null,
        title: form.title,
        start_date: form.start_date,
        end_date: form.end_date,
        duration_days: form.duration_days ? Number(form.duration_days) : null,
      });
      toast.success('Duração criada com sucesso!');
      setShowModal(false);
      setForm({ course_id: '', module_id: '', enrollment_id: '', title: '', start_date: '', end_date: '', duration_days: '' });
      fetchData();
    } catch {
      toast.error('Erro ao criar duração');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta duração?')) return;
    try {
      await api.delete(`/course-durations/${id}`);
      toast.success('Duração excluída!');
      setDurations(durations.filter(d => d.id !== id));
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const filtered = durations.filter(d => {
    if (filterCourse && d.course_id !== Number(filterCourse)) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusIcon = (s: string) => {
    if (s === 'active') return <FiCheckCircle className="text-green-500" />;
    if (s === 'expired') return <FiXCircle className="text-red-500" />;
    return <FiClock className="text-gray-400" />;
  };

  if (loading) return <Loading text="Carregando durações..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duração dos Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">Configure prazos e alertas para os alunos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus /> Nova Duração
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Todos os cursos</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="expired">Expirado</option>
          <option value="completed">Concluído</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma duração cadastrada" description="Crie uma nova duração para definir prazos de curso." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Título</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Curso</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Módulo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Aluno</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Início</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Término</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Dias</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                    <td className="px-4 py-3 text-gray-600">{d.course_title}</td>
                    <td className="px-4 py-3 text-gray-500">{d.module_title || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.student_name || 'Todos'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(d.start_date)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(d.end_date)}</td>
                    <td className="px-4 py-3 text-gray-500 text-center">{d.duration_days || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {statusIcon(d.status)}
                        <span className={d.status === 'active' ? 'text-green-700' : d.status === 'expired' ? 'text-red-700' : 'text-gray-500'}>
                          {d.status === 'active' ? 'Ativo' : d.status === 'expired' ? 'Expirado' : d.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Excluir">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nova Duração</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <FiXCircle className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Curso *</label>
                <select
                  value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Selecione o curso</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Título da Disciplina/Módulo *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Introdução"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Módulo (opcional)</label>
                  <select
                    value={form.module_id}
                    onChange={e => setForm({ ...form, module_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Nenhum</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Aluno (opcional)</label>
                  <select
                    value={form.enrollment_id}
                    onChange={e => setForm({ ...form, enrollment_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Todos os alunos</option>
                    {enrollments.map(e => <option key={e.id} value={e.id}>{e.student_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Data de Início *</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duração (dias)</label>
                  <input
                    type="number"
                    value={form.duration_days}
                    onChange={e => setForm({ ...form, duration_days: e.target.value })}
                    placeholder="Ex: 30"
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">Data de Término *</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <FiAlertTriangle />
                  O aluno receberá um alerta 24 horas antes do término do prazo.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">Criar Duração</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
