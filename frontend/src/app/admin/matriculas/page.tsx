'use client';

import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiCheck,
  FiX,
  FiCreditCard,
  FiFileText,
  FiExternalLink,
  FiEye,
  FiDollarSign,
  FiCalendar,
  FiUserPlus,
} from 'react-icons/fi';

interface Enrollment {
  id: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  certificate_issued: number;
  final_grade: number | null;
  user_id: number;
  user_name: string;
  user_email: string;
  course_id: number;
  course_title: string;
  order_id: number | null;
  order_number: string | null;
  total_amount: number | null;
  payment_method: string | null;
  order_status: string | null;
  paid_at: string | null;
}

interface Payment {
  id: number;
  installment_number: number;
  installment_total: number;
  amount: number;
  status: string;
  paid_at: string | null;
  boleto_url: string | null;
  boleto_barcode: string | null;
}

type StatusFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  active: { label: 'Ativa', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  completed: { label: 'Concluída', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700 ring-red-600/20' },
};

const paymentMethodLabels: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  free: 'Gratuito',
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  paid: { label: 'Pago', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  confirmed: { label: 'Confirmado', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  expired: { label: 'Expirado', className: 'bg-red-50 text-red-700 ring-red-600/20' },
};

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminMatriculasPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [boletoModal, setBoletoModal] = useState<{
    open: boolean;
    data: {
      boleto_url: string;
      boleto_barcode: string;
      due_date: string;
      amount: number;
    } | null;
  }>({ open: false, data: null });

  const [installmentsModal, setInstallmentsModal] = useState<{
    open: boolean;
    enrollmentId: number | null;
    installmentCount: number;
    totalAmount: number;
  }>({ open: false, enrollmentId: null, installmentCount: 2, totalAmount: 0 });

  const [paymentsModal, setPaymentsModal] = useState<{
    open: boolean;
    enrollmentId: number | null;
    payments: Payment[];
    loading: boolean;
  }>({ open: false, enrollmentId: null, payments: [], loading: false });

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollMode, setEnrollMode] = useState<'search' | 'new'>('search');
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [courseResults, setCourseResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '', email: '', password: '', phone: '',
    address: '', city: '', state: '', zip_code: '',
  });

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/enrollments/admin/all', { params });
      setEnrollments(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);

      if (statusFilter === 'all') {
        setPendingCount(data.pagination?.pending || 0);
        setActiveCount(data.pagination?.active || 0);
        setCompletedCount(data.pagination?.completed || 0);
      }
    } catch {
      toast.error('Erro ao carregar matrículas');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStatsCounts = useCallback(async () => {
    try {
      const [pendRes, actRes, compRes] = await Promise.all([
        api.get('/enrollments/admin/all', { params: { status: 'pending', limit: 1 } }),
        api.get('/enrollments/admin/all', { params: { status: 'active', limit: 1 } }),
        api.get('/enrollments/admin/all', { params: { status: 'completed', limit: 1 } }),
      ]);
      setPendingCount(pendRes.data.pagination?.total || 0);
      setActiveCount(actRes.data.pagination?.total || 0);
      setCompletedCount(compRes.data.pagination?.total || 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    if (statusFilter === 'all') {
      fetchStatsCounts();
    }
  }, [statusFilter, fetchStatsCounts]);

  const setAction = (key: string, value: boolean) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateBoleto = async (enrollmentId: number) => {
    const key = `boleto-${enrollmentId}`;
    setAction(key, true);
    try {
      const { data } = await api.post(`/enrollments/${enrollmentId}/generate-boleto`);
      setBoletoModal({
        open: true,
        data: {
          boleto_url: data.boleto_url,
          boleto_barcode: data.boleto_barcode,
          due_date: data.due_date,
          amount: data.amount,
        },
      });
      toast.success('Boleto gerado com sucesso');
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao gerar boleto');
    } finally {
      setAction(key, false);
    }
  };

  const handleGenerateInstallments = async () => {
    if (!installmentsModal.enrollmentId) return;
    const key = `installments-${installmentsModal.enrollmentId}`;
    setAction(key, true);
    try {
      await api.post(`/enrollments/${installmentsModal.enrollmentId}/generate-installments`, {
        installments: installmentsModal.installmentCount,
      });
      toast.success(`${installmentsModal.installmentCount} parcelas geradas com sucesso`);
      setInstallmentsModal({ open: false, enrollmentId: null, installmentCount: 2, totalAmount: 0 });
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao gerar parcelas');
    } finally {
      setAction(key, false);
    }
  };

  const handleConfirmPayment = async (enrollmentId: number) => {
    const key = `confirm-${enrollmentId}`;
    setAction(key, true);
    try {
      await api.put(`/enrollments/${enrollmentId}/confirm-payment`);
      toast.success('Pagamento confirmado! Acesso liberado.');
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao confirmar pagamento');
    } finally {
      setAction(key, false);
    }
  };

  const handleViewPayments = async (enrollmentId: number) => {
    setPaymentsModal({ open: true, enrollmentId, payments: [], loading: true });
    try {
      const { data } = await api.get(`/enrollments/${enrollmentId}/payments`);
      setPaymentsModal({ open: true, enrollmentId, payments: data || [], loading: false });
    } catch {
      toast.error('Erro ao carregar pagamentos');
      setPaymentsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmSinglePayment = async (paymentId: number) => {
    const key = `payment-confirm-${paymentId}`;
    setAction(key, true);
    try {
      const { data } = await api.put(`/enrollments/payments/${paymentId}/confirm`);
      toast.success(data.message || 'Pagamento confirmado');
      if (paymentsModal.enrollmentId) {
        await handleViewPayments(paymentsModal.enrollmentId);
      }
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao confirmar pagamento');
    } finally {
      setAction(key, false);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) { setStudentResults([]); return; }
    try {
      const { data } = await api.get('/admin/users', { params: { search: query, role: 'student', limit: 10 } });
      setStudentResults(data.data || []);
    } catch { setStudentResults([]); }
  };

  const searchCourses = async (query: string) => {
    if (query.length < 2) { setCourseResults([]); return; }
    try {
      const { data } = await api.get('/courses', { params: { search: query, limit: 10 } });
      setCourseResults(data.data || []);
    } catch { setCourseResults([]); }
  };

  const resetEnrollModal = () => {
    setEnrollModal(false);
    setEnrollMode('search');
    setSelectedStudent(null);
    setSelectedCourse(null);
    setStudentSearch('');
    setCourseSearch('');
    setStudentResults([]);
    setCourseResults([]);
    setNewStudentForm({ name: '', email: '', password: '', phone: '', address: '', city: '', state: '', zip_code: '' });
  };

  const handleEnroll = async () => {
    if (!selectedCourse) {
      toast.error('Selecione um curso.');
      return;
    }

    let studentId: number;

    if (enrollMode === 'new') {
      if (!newStudentForm.name || !newStudentForm.email || !newStudentForm.password) {
        toast.error('Nome, e-mail e senha são obrigatórios.');
        return;
      }
      setEnrolling(true);
      try {
        const { data } = await api.post('/admin/users', {
          name: newStudentForm.name,
          email: newStudentForm.email,
          password: newStudentForm.password,
          phone: newStudentForm.phone || undefined,
          role: 'student',
        });
        studentId = data.user.id;
        toast.success('Aluno criado com sucesso!');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Erro ao criar aluno');
        setEnrolling(false);
        return;
      }
    } else {
      if (!selectedStudent) {
        toast.error('Selecione um aluno.');
        return;
      }
      studentId = selectedStudent.id;
    }

    try {
      const { data } = await api.post('/admin/enroll', {
        user_id: studentId,
        course_id: selectedCourse.id,
      });
      toast.success(data.message || 'Aluno matriculado com sucesso!');
      resetEnrollModal();
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao matricular aluno');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie todas as matrículas da plataforma</p>
          </div>
          <button
            onClick={() => setEnrollModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <FiUserPlus /> Nova Matrícula
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
              <FiDollarSign style={{ color: '#1a56db' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Matrículas</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <FiCalendar className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <FiCheck className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ativas</p>
              <p className="text-xl font-bold text-green-600">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FiCheck className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Concluídas</p>
              <p className="text-xl font-bold text-blue-600">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por aluno, e-mail ou curso..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="active">Ativas</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12"><Loading text="Carregando matrículas..." /></div>
        ) : enrollments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">Nenhuma matrícula encontrada</p>
            <p className="text-sm mt-1">
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros.'
                : 'As matrículas aparecerão aqui quando forem realizadas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Aluno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Curso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Pagamento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {enrollments.map((enrollment) => {
                  const st = statusConfig[enrollment.status] || statusConfig.pending;
                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                            style={{ backgroundColor: '#1a56db' }}
                          >
                            {enrollment.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{enrollment.user_name}</p>
                            <p className="text-xs text-gray-500">{enrollment.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium truncate max-w-[200px]">
                          {enrollment.course_title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            <FiCreditCard className="w-3 h-3" />
                            {paymentMethodLabels[enrollment.payment_method || ''] || '—'}
                          </span>
                          {enrollment.order_number && (
                            <p className="text-xs text-gray-400 mt-0.5">{enrollment.order_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(enrollment.total_amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600 text-xs">{formatDate(enrollment.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {enrollment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleGenerateBoleto(enrollment.id)}
                                disabled={actionLoading[`boleto-${enrollment.id}`]}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: '#f97316' }}
                                title="Gerar Boleto"
                              >
                                <FiFileText className="w-3 h-3" />
                                Gerar Boleto
                              </button>
                              <button
                                onClick={() =>
                                  setInstallmentsModal({
                                    open: true,
                                    enrollmentId: enrollment.id,
                                    installmentCount: 2,
                                    totalAmount: enrollment.total_amount || 0,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90"
                                style={{ backgroundColor: '#1a56db' }}
                                title="Gerar Parcelas"
                              >
                                <FiCreditCard className="w-3 h-3" />
                                Gerar Parcelas
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(enrollment.id)}
                                disabled={actionLoading[`confirm-${enrollment.id}`]}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                                title="Confirmar Pagamento"
                              >
                                {actionLoading[`confirm-${enrollment.id}`] ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiCheck className="w-3 h-3" />
                                )}
                                Confirmar
                              </button>
                            </>
                          )}
                          {(enrollment.status === 'active' || enrollment.status === 'completed') && (
                            <button
                              onClick={() => handleViewPayments(enrollment.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90"
                              style={{ backgroundColor: '#1a56db' }}
                              title="Ver Pagamentos"
                            >
                              <FiEye className="w-3 h-3" />
                              Ver Pagamentos
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {boletoModal.open && boletoModal.data && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setBoletoModal({ open: false, data: null })}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Boleto Gerado</h3>
              <button
                onClick={() => setBoletoModal({ open: false, data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Valor</span>
                <span className="font-bold text-gray-900">{formatCurrency(boletoModal.data.amount)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Vencimento</span>
                <span className="font-medium text-gray-900">{formatDate(boletoModal.data.due_date)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Código de Barras</span>
                <span className="font-mono text-xs text-gray-700 break-all text-right max-w-[250px]">
                  {boletoModal.data.boleto_barcode}
                </span>
              </div>
            </div>
            <a
              href={boletoModal.data.boleto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white font-medium hover:opacity-90"
              style={{ backgroundColor: '#f97316' }}
            >
              <FiExternalLink className="w-4 h-4" />
              Abrir Boleto em Nova Aba
            </a>
          </div>
        </div>
      )}

      {installmentsModal.open && installmentsModal.enrollmentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() =>
            setInstallmentsModal({ open: false, enrollmentId: null, installmentCount: 2, totalAmount: 0 })
          }
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Gerar Parcelas</h3>
              <button
                onClick={() =>
                  setInstallmentsModal({ open: false, enrollmentId: null, installmentCount: 2, totalAmount: 0 })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Parcelas
                </label>
                <select
                  value={installmentsModal.installmentCount}
                  onChange={(e) =>
                    setInstallmentsModal((prev) => ({
                      ...prev,
                      installmentCount: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(installmentsModal.totalAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Valor por parcela:{' '}
                  <span className="font-bold" style={{ color: '#1a56db' }}>
                    {formatCurrency(installmentsModal.totalAmount / installmentsModal.installmentCount)}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateInstallments}
              disabled={actionLoading[`installments-${installmentsModal.enrollmentId}`]}
              className="w-full py-2.5 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1a56db' }}
            >
              {actionLoading[`installments-${installmentsModal.enrollmentId}`] ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </span>
              ) : (
                'Gerar Parcelas'
              )}
            </button>
          </div>
        </div>
      )}

      {paymentsModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPaymentsModal({ open: false, enrollmentId: null, payments: [], loading: false })}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pagamentos</h3>
              <button
                onClick={() =>
                  setPaymentsModal({ open: false, enrollmentId: null, payments: [], loading: false })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {paymentsModal.loading ? (
              <div className="py-8">
                <Loading text="Carregando pagamentos..." />
              </div>
            ) : paymentsModal.payments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum pagamento encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Parcela</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Valor</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Pago em</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paymentsModal.payments.map((payment) => {
                      const pst = paymentStatusConfig[payment.status] || paymentStatusConfig.pending;
                      return (
                        <tr key={payment.id}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-900">
                              {payment.installment_number}/{payment.installment_total}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-gray-900">{formatCurrency(payment.amount)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${pst.className}`}
                            >
                              {pst.label}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-gray-600 text-xs">{formatDate(payment.paid_at)}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {payment.status === 'pending' && (
                              <button
                                onClick={() => handleConfirmSinglePayment(payment.id)}
                                disabled={actionLoading[`payment-confirm-${payment.id}`]}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                              >
                                {actionLoading[`payment-confirm-${payment.id}`] ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiCheck className="w-3 h-3" />
                                )}
                                Dar Baixa
                              </button>
                            )}
                            {payment.status !== 'pending' && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {enrollModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={resetEnrollModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Nova Matrícula</h3>
              <button onClick={resetEnrollModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Toggle Aluno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aluno</label>
                <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
                  <button
                    onClick={() => setEnrollMode('search')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      enrollMode === 'search' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Buscar Aluno
                  </button>
                  <button
                    onClick={() => setEnrollMode('new')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      enrollMode === 'new' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cadastrar Novo
                  </button>
                </div>

                {enrollMode === 'search' ? (
                  selectedStudent ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                        {selectedStudent.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{selectedStudent.name}</p>
                        <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                      </div>
                      <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); setStudentResults([]); }} className="text-gray-400 hover:text-red-500">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                        placeholder="Buscar aluno por nome ou e-mail..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                      />
                      {studentResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {studentResults.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => { setSelectedStudent(s); setStudentSearch(''); setStudentResults([]); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                {s.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
                        <input
                          type="text"
                          value={newStudentForm.name}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">E-mail *</label>
                        <input
                          type="email"
                          value={newStudentForm.email}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="aluno@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Senha *</label>
                        <input
                          type="password"
                          value={newStudentForm.password}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                        <input
                          type="tel"
                          value={newStudentForm.phone}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Endereço</label>
                      <input
                        type="text"
                        value={newStudentForm.address}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label>
                        <input
                          type="text"
                          value={newStudentForm.city}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, city: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">UF</label>
                        <input
                          type="text"
                          value={newStudentForm.state}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, state: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="PI"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">CEP</label>
                        <input
                          type="text"
                          value={newStudentForm.zip_code}
                          onChange={(e) => setNewStudentForm({ ...newStudentForm, zip_code: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                {selectedCourse ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                      <FiFileText className="text-secondary-600 w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{selectedCourse.title}</p>
                      <p className="text-xs text-gray-500">
                        {Number(selectedCourse.price) === 0 ? 'Gratuito' : `R$ ${Number(selectedCourse.price).toFixed(2)}`}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedCourse(null); setCourseSearch(''); setCourseResults([]); }} className="text-gray-400 hover:text-red-500">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => { setCourseSearch(e.target.value); searchCourses(e.target.value); }}
                      placeholder="Buscar curso por título..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#1a56db' } as React.CSSProperties}
                    />
                    {courseResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {courseResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCourse(c); setCourseSearch(''); setCourseResults([]); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                          >
                            <p className="text-sm font-medium text-gray-900">{c.title}</p>
                            <p className="text-xs text-gray-500">
                              {Number(c.price) === 0 ? 'Gratuito' : `R$ ${Number(c.price).toFixed(2)}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={resetEnrollModal}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling || !selectedCourse || (enrollMode === 'search' && !selectedStudent) || (enrollMode === 'new' && (!newStudentForm.name || !newStudentForm.email || !newStudentForm.password))}
                className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Matriculando...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="w-4 h-4" />
                    Matricular
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
