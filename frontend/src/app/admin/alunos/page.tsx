'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiX,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiUsers,
  FiPlus,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  enrollments_count: number;
  created_at: string;
  enrollments?: { id: number; course_title: string; status: string; enrolled_at: string }[];
}

interface CourseOption {
  id: number;
  title: string;
  price: number;
  is_free: boolean;
  status: string;
  teacher_name?: string;
  category_name?: string;
}

interface NewStudentForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export default function AdminAlunosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { role: 'student', page, limit: 10 };
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active' ? '1' : '0';
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      const users = (data.data || data.users || []).map((u: any) => ({
        ...u,
        status: u.is_active ? 'active' : 'inactive',
      }));
      setStudents(users);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || 0) / 10));
    } catch {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleViewDetails = async (student: Student) => {
    setDetailLoading(true);
    setShowModal(true);
    try {
      const { data } = await api.get(`/admin/users/${student.id}`);
      setSelectedStudent({ ...student, ...data, status: data.is_active ? 'active' : 'inactive' });
    } catch {
      setSelectedStudent(student);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const label = newStatus === 'active' ? 'ativar' : 'desativar';
    if (!confirm(`Tem certeza que deseja ${label} este aluno?`)) return;
    try {
      await api.patch(`/admin/users/${id}`, { is_active: newStatus === 'active' });
      toast.success(`Aluno ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      fetchStudents();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const openEnrollModal = async (student: Student) => {
    setEnrollStudent(student);
    setSelectedCourseId(null);
    setCourseSearch('');
    setShowEnrollModal(true);
    try {
      const { data } = await api.get('/courses', { params: { status: 'published', limit: 100 } });
      setCourses(data.data || data.courses || data || []);
    } catch {
      setCourses([]);
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollStudent || !selectedCourseId) {
      toast.error('Selecione um curso.');
      return;
    }
    setEnrolling(true);
    try {
      const { data } = await api.post('/admin/enroll', {
        user_id: enrollStudent.id,
        course_id: selectedCourseId,
      });
      toast.success(data.message);
      setShowEnrollModal(false);
      setEnrollStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao matricular aluno.');
    } finally {
      setEnrolling(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.password.trim()) {
      toast.error('Preencha nome, e-mail e senha.');
      return;
    }
    if (newStudent.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', {
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        password: newStudent.password,
        phone: newStudent.phone.trim() || undefined,
        role: 'student',
      });
      toast.success('Aluno criado com sucesso!');
      setShowCreateModal(false);
      setNewStudent({ name: '', email: '', password: '', phone: '' });
      fetchStudents();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao criar aluno.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize e gerencie todos os alunos da plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <FiPlus className="text-base" />
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading fullScreen={false} text="Carregando alunos..." />
      ) : students.length === 0 ? (
        <EmptyState icon={<FiUsers />} title="Nenhum aluno encontrado" description="Ajuste os filtros ou cadastre um novo aluno." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Matrículas</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Cadastro</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{student.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
                          {student.avatar ? (
                            <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-primary-600">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{student.phone || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <FiBook className="text-xs text-gray-400" /> {student.enrollments_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEnrollModal(student)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 transition-colors text-primary-500"
                          title="Matricular em curso"
                        >
                          <FiBook className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          title="Ver detalhes"
                        >
                          <FiEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.status === 'active'
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                              : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'
                          }`}
                          title={student.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          {student.status === 'active' ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Novo Aluno</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100" disabled={creating}>
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Nome do aluno"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="aluno@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <div className="relative">
                  <FiBook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">O aluno usará este e-mail e senha para acessar a plataforma.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner !w-4 !h-4 !border-2" />
                      Criando...
                    </span>
                  ) : (
                    'Criar Aluno'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && enrollStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !enrolling && setShowEnrollModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Matricular Aluno</h2>
                <p className="text-sm text-gray-500">{enrollStudent.name}</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100" disabled={enrolling}>
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar curso</label>
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => { setCourseSearch(e.target.value); setSelectedCourseId(null); }}
                    placeholder="Digite o nome do curso..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {filteredCourses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">Nenhum curso encontrado</div>
                ) : (
                  filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedCourseId === course.id
                          ? 'bg-primary-50 border-l-4 border-primary-500'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {course.is_free || course.price === 0
                          ? 'Gratuito'
                          : `R$ ${Number(course.price).toFixed(2)}`}
                        {course.teacher_name ? ` · ${course.teacher_name}` : ''}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  disabled={enrolling}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnrollStudent}
                  disabled={enrolling || !selectedCourseId}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner !w-4 !h-4 !border-2" />
                      Matriculando...
                    </span>
                  ) : (
                    'Matricular'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Aluno</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8"><Loading fullScreen={false} text="Carregando..." /></div>
            ) : selectedStudent ? (
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden">
                    {selectedStudent.avatar ? (
                      <img src={selectedStudent.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-primary-600">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiPhone className="text-gray-400" /> {selectedStudent.phone || 'Não informado'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="text-gray-400" /> {formatDate(selectedStudent.created_at)}
                  </div>
                </div>

                <button
                  onClick={() => { setShowModal(false); openEnrollModal(selectedStudent); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  <FiBook className="text-sm" />
                  Matricular em curso
                </button>

                {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Matrículas</h4>
                    <div className="space-y-2">
                      {selectedStudent.enrollments.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{e.course_title}</p>
                            <p className="text-xs text-gray-500">{formatDate(e.enrolled_at)}</p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              e.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {e.status === 'active' ? 'Ativa' : 'Concluída'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}


