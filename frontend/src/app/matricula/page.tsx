'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiArrowRight,
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiBook,
  FiCheck,
  FiFileText,
  FiCalendar,
} from 'react-icons/fi';
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
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: string;
  course_id: string;
  payment_method: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

const steps = ['Dados Pessoais', 'Escolha do Curso', 'Pagamento', 'Confirmação'];

const states = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export default function MatriculaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [form, setForm] = useState<MatriculaForm>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    gender: '',
    course_id: '',
    payment_method: 'boleto',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses', { params: { status: 'published', limit: 50 } });
        setCourses(data.data || []);
      } catch {
        toast.error('Erro ao carregar cursos');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setForm({ ...form, course_id: course.id.toString() });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, cpf: formatCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, phone: formatPhone(e.target.value) });
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, zip_code: formatCEP(e.target.value) });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!form.name.trim()) { toast.error('Nome é obrigatório'); return false; }
        if (!form.email.trim() || !form.email.includes('@')) { toast.error('E-mail inválido'); return false; }
        if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) { toast.error('Telefone inválido'); return false; }
        if (!form.cpf.trim() || form.cpf.replace(/\D/g, '').length < 11) { toast.error('CPF inválido'); return false; }
        return true;
      case 1:
        if (!form.course_id) { toast.error('Selecione um curso'); return false; }
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/enrollments/enroll-public', {
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
        zip_code: form.zip_code.replace(/\D/g, ''),
      });

      toast.success('Matrícula realizada com sucesso!');
      router.push(`/matricula/comprovante?code=${data.enrollment_code}&payment=${data.payment_code}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar matrícula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-600">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <FiArrowLeft /> Voltar ao site
          </Link>
          <h1 className="text-white font-bold text-lg">Faculdade Diferencial EAD</h1>
        </div>
      </div>

      {/* Steps indicator bar */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    index < currentStep ? 'bg-secondary-500 text-white' :
                    index === currentStep ? 'bg-white text-primary-600 shadow-lg' :
                    'bg-white/20 text-white/70'
                  }`}>
                    {index < currentStep ? <FiCheck /> : index + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    index <= currentStep ? 'text-white' : 'text-white/50'
                  }`}>{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-secondary-400' : 'bg-white/20'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Step 0: Dados Pessoais */}
          {currentStep === 0 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <FiUser className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dados Pessoais</h2>
                  <p className="text-gray-500 text-sm">Preencha seus dados para iniciar a matrícula</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Nome Completo *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">E-mail *</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Telefone *</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handlePhoneChange}
                        className="input-field pl-10"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">CPF *</label>
                    <input
                      type="text"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleCPFChange}
                      className="input-field"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="label">Data de Nascimento</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="birth_date"
                        value={form.birth_date}
                        onChange={handleChange}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Gênero</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Endereço</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div>
                    <label className="label">CEP</label>
                    <input
                      type="text"
                      name="zip_code"
                      value={form.zip_code}
                      onChange={handleCEPChange}
                      className="input-field"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Cidade</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select name="state" value={form.state} onChange={handleChange} className="input-field">
                      <option value="">Selecione</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Escolha do Curso */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-secondary-500 flex items-center justify-center">
                  <FiBook className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Escolha seu Curso</h2>
                  <p className="text-gray-500 text-sm">Selecione o curso que deseja se matricular</p>
                </div>
              </div>

              {loadingCourses ? (
                <div className="flex justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedCourse?.id === course.id
                          ? 'border-secondary-500 bg-secondary-50 shadow-md'
                          : 'border-gray-200 hover:border-secondary-300'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {course.image ? (
                            <img src={course.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiBook className="text-gray-400 text-xl" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{course.title}</h3>
                          <p className="text-xs text-gray-500">{course.teacher_name}</p>
                          <p className="text-xs text-primary-600 font-medium">{course.category_name}</p>
                          <div className="mt-1">
                            {Number(course.price) === 0 ? (
                              <span className="text-green-600 font-bold text-sm">Gratuito</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary-600 text-sm">
                                  R$ {Number(course.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                {course.original_price && Number(course.original_price) > Number(course.price) && (
                                  <span className="text-xs text-gray-400 line-through">
                                    R$ {Number(course.original_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedCourse?.id === course.id && (
                          <div className="text-secondary-500">
                            <FiCheck className="text-xl" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pagamento */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <FiCreditCard className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Forma de Pagamento</h2>
                  <p className="text-gray-500 text-sm">Escolha como deseja pagar</p>
                </div>
              </div>

              {/* Resumo do curso */}
              {selectedCourse && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900">{selectedCourse.title}</h3>
                  <p className="text-sm text-gray-500">{selectedCourse.teacher_name} • {selectedCourse.workload}h</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                      R$ {Number(selectedCourse.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {selectedCourse.original_price && Number(selectedCourse.original_price) > Number(selectedCourse.price) && (
                      <span className="text-sm text-gray-400 line-through">
                        R$ {Number(selectedCourse.original_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Boleto */}
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.payment_method === 'boleto' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                }`}>
                  <input type="radio" name="payment_method" value="boleto" checked={form.payment_method === 'boleto'} onChange={handleChange} className="w-4 h-4 text-primary-500" />
                  <FiFileText className="text-xl text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Boleto Bancário</p>
                    <p className="text-xs text-gray-500">Vencimento em 3 dias úteis</p>
                  </div>
                </label>

                {/* PIX */}
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.payment_method === 'pix' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-200 hover:border-secondary-300'
                }`}>
                  <input type="radio" name="payment_method" value="pix" checked={form.payment_method === 'pix'} onChange={handleChange} className="w-4 h-4 text-secondary-500" />
                  <div className="w-6 h-6 bg-secondary-500 rounded flex items-center justify-center text-white text-xs font-bold">R$</div>
                  <div>
                    <p className="font-semibold text-gray-900">PIX</p>
                    <p className="text-xs text-gray-500">Aprovação instantânea</p>
                  </div>
                </label>

                {/* Cartão */}
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.payment_method === 'credit_card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                }`}>
                  <input type="radio" name="payment_method" value="credit_card" checked={form.payment_method === 'credit_card'} onChange={handleChange} className="w-4 h-4 text-primary-500" />
                  <FiCreditCard className="text-xl text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                    <p className="text-xs text-gray-500">Até 12x sem juros</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Confirmação */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <FiCheck className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Confirme sua Matrícula</h2>
                  <p className="text-gray-500 text-sm">Revise os dados antes de finalizar</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{form.name}</span></div>
                    <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{form.email}</span></div>
                    <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{form.phone}</span></div>
                    <div><span className="text-gray-500">CPF:</span> <span className="font-medium">{form.cpf}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Curso</h3>
                  {selectedCourse && (
                    <div>
                      <p className="font-medium">{selectedCourse.title}</p>
                      <p className="text-sm text-gray-500">{selectedCourse.teacher_name} • {selectedCourse.workload}h</p>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        R$ {Number(selectedCourse.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Pagamento</h3>
                  <p className="text-sm capitalize">
                    {form.payment_method === 'boleto' && 'Boleto Bancário'}
                    {form.payment_method === 'pix' && 'PIX'}
                    {form.payment_method === 'credit_card' && 'Cartão de Crédito'}
                  </p>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <p className="text-sm text-primary-800">
                    <strong>Importante:</strong> Após a confirmação, você receberá um e-mail com seus dados de acesso
                    (e-mail e senha) e as instruções de pagamento. O acesso ao será liberado automaticamente
                    após a confirmação do pagamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="p-6 sm:p-8 border-t border-gray-100 flex justify-between bg-gray-50">
            {currentStep > 0 ? (
              <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white flex items-center gap-2 transition-colors">
                <FiArrowLeft /> Voltar
              </button>
            ) : (
              <Link href="/" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white flex items-center gap-2 transition-colors">
                <FiArrowLeft /> Cancelar
              </Link>
            )}

            {currentStep < steps.length - 1 ? (
              <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-secondary-500 text-white font-semibold hover:bg-secondary-600 flex items-center gap-2 transition-colors">
                Próximo <FiArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processando...' : 'Finalizar Matrícula'}
                {!loading && <FiCheck />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
