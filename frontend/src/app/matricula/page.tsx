'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft, FiArrowRight, FiUser, FiMail, FiPhone,
  FiCreditCard, FiCheck, FiFileText, FiCalendar,
  FiHeart, FiSend, FiBook, FiDollarSign, FiTrendingUp,
} from 'react-icons/fi';
import { FaGraduationCap, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  slug: string;
  price: number;
  original_price: number;
  workload: number;
  image: string;
  teacher_name: string;
  category_name: string;
}

interface MatriculaForm {
  name: string; email: string; phone: string; cpf: string;
  birth_date: string; gender: string; course_id: string;
  payment_method: string; address: string; city: string;
  state: string; zip_code: string;
}

const steps = ['Dados Pessoais', 'Pagamento', 'Confirmação'];
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function MatriculaEnrollment({ preselectedCourseId, onBack }: { preselectedCourseId: string; onBack: () => void }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(!!preselectedCourseId);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const [form, setForm] = useState<MatriculaForm>({
    name: '', email: '', phone: '', cpf: '', birth_date: '',
    gender: '', course_id: preselectedCourseId, payment_method: 'boleto',
    address: '', city: '', state: '', zip_code: '',
  });

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(Array.isArray(data) ? data : data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!preselectedCourseId) return;
    api.get(`/courses/${preselectedCourseId}`).then(({ data }) => {
      const c = data.data || data;
      setSelectedCourse(c);
      setForm(prev => ({ ...prev, course_id: String(c.id) }));
    }).catch(() => toast.error('Curso não encontrado')).finally(() => setLoadingCourse(false));
  }, [preselectedCourseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const formatCPF = (v: string) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const formatPhone = (v: string) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  const formatCEP = (v: string) => v.replace(/\D/g, '').substring(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');

  const handleSelectCourse = (c: Course) => {
    setSelectedCourse(c);
    setForm(prev => ({ ...prev, course_id: String(c.id) }));
  };

  const nextStep = () => currentStep < 2 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = { ...form, course_id: Number(form.course_id) };
      const { data } = await api.post('/enrollments', payload);
      setPaymentInfo(data);
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao realizar matrícula');
    } finally { setLoading(false); }
  };

  if (loadingCourse) return <div className="text-center py-12 text-gray-500">Carregando...</div>;

  return (
    <div>
      {/* Steps indicator */}
      {currentStep < 2 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentStep ? <FiCheck /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === currentStep ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className={`w-12 h-0.5 ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 0 - Personal Data */}
      {currentStep === 0 && (
        <div className="space-y-6">
          {/* Course Selection */}
          {!selectedCourse && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Escolha seu Curso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map(c => (
                  <button key={c.id} onClick={() => handleSelectCourse(c)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all">
                    <h4 className="font-semibold text-gray-900">{c.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-primary-600 font-bold">
                        {c.price === 0 ? 'Grátis' : `R$ ${Number(c.price).toFixed(2)}`}
                      </span>
                      {c.workload > 0 && <span className="text-xs text-gray-400">{c.workload}h</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedCourse && (
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div>
                <p className="text-xs text-gray-500">Curso selecionado</p>
                <p className="font-semibold text-gray-900">{selectedCourse.title}</p>
                <p className="text-primary-600 font-bold text-sm">R$ {Number(selectedCourse.price).toFixed(2)}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-sm text-gray-500 hover:text-red-500">Trocar</button>
            </div>
          )}

          {/* Personal Data Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" name="phone" value={form.phone} onChange={e => setForm({...form, phone: formatPhone(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input type="text" name="cpf" value={form.cpf} onChange={e => setForm({...form, cpf: formatCPF(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <button onClick={nextStep} disabled={!form.name || !selectedCourse}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-all">
            Continuar para Pagamento
          </button>
        </div>
      )}

      {/* Step 1 - Payment */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input type="text" name="address" value={form.address} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="state" value={form.state} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none">
                <option value="">Selecione</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input type="text" name="zip_code" value={form.zip_code} onChange={e => setForm({...form, zip_code: formatCEP(e.target.value)})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none">
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'boleto', label: 'Boleto', icon: FiFileText },
                  { value: 'pix', label: 'PIX', icon: FiCreditCard },
                  { value: 'credit_card', label: 'Cartão', icon: FiCreditCard },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm({...form, payment_method: opt.value})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${form.payment_method === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <opt.icon className={`text-2xl mx-auto mb-1 ${form.payment_method === opt.value ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${form.payment_method === opt.value ? 'text-primary-600' : 'text-gray-600'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={prevStep} className="w-1/3 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">
              Voltar
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-all">
              {loading ? 'Processando...' : 'Confirmar Matrícula'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 - Confirmation */}
      {currentStep === 2 && paymentInfo && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-3xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Matrícula Realizada!</h2>
          <p className="text-gray-500 mb-6">Enviamos as instruções para seu e-mail.</p>
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-2 mb-6">
            {paymentInfo.orderNumber && (
              <div className="flex justify-between"><span className="text-gray-500">Pedido:</span><span className="font-semibold">#{paymentInfo.orderNumber}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Curso:</span><span className="font-semibold">{selectedCourse?.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Valor:</span><span className="font-semibold text-primary-600">R$ {Number(selectedCourse?.price).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pagamento:</span><span className="font-semibold">{form.payment_method === 'pix' ? 'PIX' : form.payment_method === 'boleto' ? 'Boleto' : 'Cartão'}</span></div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600">
            <FiArrowLeft /> Voltar ao início
          </Link>
        </div>
      )}
    </div>
  );
}

function LeadForm() {
  const [form, setForm] = useState({ name: '', whatsapp: '', course_interest: '', source: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref') || 'social';
    setForm(prev => ({ ...prev, source: ref }));
    api.get('/courses').then(({ data }) => setCourses(Array.isArray(data) ? data : data.data || [])).catch(() => {});
  }, [searchParams]);

  const formatPhone = (v: string) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Digite seu nome');
    setSending(true);
    try {
      await api.post('/crm/public-leads', {
        name: form.name,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        phone: form.whatsapp.replace(/\D/g, ''),
        course_interest: form.course_interest,
        source: form.source || 'social',
      });
      setSent(true);
      toast.success('Recebemos seu interesse! Entraremos em contato.');
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiHeart className="text-4xl text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Obrigado pelo Interesse!</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Recebemos seus dados. Nossa equipe entrará em contato em breve pelo WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Digite seu nome completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatPhone(e.target.value)})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="(86) 99999-9999" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Curso de interesse</label>
        <select value={form.course_interest} onChange={e => setForm({...form, course_interest: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Selecione um curso</option>
          {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
        </select>
      </div>
      <button type="submit" disabled={sending || !form.name.trim()}
        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
        {sending ? 'Enviando...' : <><FiSend /> Quero saber mais</>}
      </button>
      <p className="text-xs text-center text-gray-400">Seus dados estão protegidos. Não compartilhamos com terceiros.</p>
    </form>
  );
}

function MatriculaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedCourseId = searchParams.get('curso') || '';

  const tabFromUrl = searchParams.get('tab') || '';
  const isLeadTab = tabFromUrl === 'interesse' && !preselectedCourseId;

  const [activeTab, setActiveTab] = useState<'enroll' | 'lead'>(isLeadTab ? 'lead' : 'enroll');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref === 'instagram' || ref === 'facebook' || ref === 'social') {
      setActiveTab('lead');
    }
    if (preselectedCourseId) {
      setActiveTab('enroll');
    }
  }, [searchParams, preselectedCourseId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <FiBook className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900">Faculdade Diferencial</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            Voltar ao site
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          {/* Student faces row */}
          <div className="flex items-center justify-center gap-1 mb-5">
            <div className="flex -space-x-3">
              {['#f97316', '#1a56db', '#10b981', '#8b5cf6', '#ec4899'].map((color, i) => (
                <div key={i} style={{ backgroundColor: color }}
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                  <FaGraduationCap className="text-sm" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-2xl font-bold text-gray-900">+500</span>
              <span className="text-sm text-gray-500">alunos matriculados</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Invista no seu <span className="text-primary-600">Futuro</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto mb-6">
            Cursos de graduação e pós-graduação com qualidade, flexibilidade e certificação reconhecida pelo MEC.
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><FaChalkboardTeacher className="text-primary-400" /> MEC Reconhecido</span>
            <span className="flex items-center gap-1.5"><FiTrendingUp className="text-green-400" /> 95% empregabilidade</span>
            <span className="flex items-center gap-1.5"><FaUserGraduate className="text-secondary-400" /> 15 anos de história</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-8 max-w-md mx-auto">
          <button onClick={() => setActiveTab('enroll')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'enroll' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <FiDollarSign /> Matrícula
          </button>
          <button onClick={() => setActiveTab('lead')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'lead' ? 'bg-secondary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <FiHeart /> Tenho Interesse
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Lead side - Testimonial */}
          {activeTab === 'lead' && (
            <div className="md:col-span-2 order-2 md:order-1">
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-2xl p-6 border border-secondary-100 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    {['#f97316', '#1a56db', '#10b981'].map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }}
                        className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                        <FaGraduationCap className="text-xs" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">+500 alunos</p>
                    <p className="text-xs text-gray-500">já transformaram suas vidas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-4 border border-secondary-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white text-xs font-bold">MA</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Maria A.</p>
                        <p className="text-[10px] text-gray-400">Administração - 2025</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">"Melhor decisão que tomei! Consegui meu emprego antes mesmo de formar."</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 border border-secondary-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">JP</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">João P.</p>
                        <p className="text-[10px] text-gray-400">Pedagogia - 2024</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">"Flexibilidade de horário fez toda diferença. Conciliei trabalho e faculdade."</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className={`${activeTab === 'lead' ? 'md:col-span-3 order-1 md:order-2' : 'md:col-span-5'}`}>
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              {activeTab === 'enroll' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Matrícula</h2>
                  <MatriculaEnrollment preselectedCourseId={preselectedCourseId} onBack={() => setActiveTab('lead')} />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Quero Saber Mais</h2>
                  <p className="text-sm text-gray-500 mb-6">Deixe seus dados e entraremos em contato!</p>
                  <LeadForm />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatriculaPageWrapper() {
  return <Suspense fallback={<div className="text-center py-12 text-gray-500">Carregando...</div>}>
    <MatriculaPage />
  </Suspense>;
}