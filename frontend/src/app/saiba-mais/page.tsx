'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiCheck, FiSend, FiBook, FiTrendingUp, FiHeart, FiArrowRight,
} from 'react-icons/fi';
import { FaGraduationCap, FaChalkboardTeacher, FaStar, FaWhatsapp } from 'react-icons/fa';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  price: number;
  workload: number;
  category_name: string;
}

const benefits = [
  'Cursos reconhecidos pelo MEC',
  'Certificado em até 2 anos',
  'Mensalidades a partir de R$ 49,90',
  'Suporte ao aluno 24h via WhatsApp',
  'Corpo docente qualificado',
  'Plataforma 100% online',
];

const testimonials = [
  { initials: 'MA', name: 'Maria A.', course: 'Administração - 2025', text: 'Melhor decisão que tomei! Consegui meu emprego antes mesmo de formar.', color: 'secondary' },
  { initials: 'JP', name: 'João P.', course: 'Pedagogia - 2024', text: 'Flexibilidade de horário fez toda diferença. Conciliei trabalho e faculdade.', color: 'primary' },
  { initials: 'CL', name: 'Carla L.', course: 'Enfermagem - 2025', text: 'Professores incríveis e conteúdo atualizado. Recomendo de olhos fechados!', color: 'secondary' },
];

function LeadForm() {
  const [form, setForm] = useState({ name: '', whatsapp: '', course_interest: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(Array.isArray(data) ? data : data.data || [])).catch(() => {});
  }, []);

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
        source: 'saiba-mais',
      });
      setSent(true);
      toast.success('Recebemos seu interesse! Entraremos em contato.');
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiHeart className="text-4xl text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Obrigado pelo Interesse!</h3>
        <p className="text-gray-500">Recebemos seus dados. Nossa equipe entrará em contato em breve pelo WhatsApp.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-secondary-400"
          placeholder="Digite seu nome completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatPhone(e.target.value)})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-secondary-400"
          placeholder="(86) 99999-9999" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Curso de interesse</label>
        <select value={form.course_interest} onChange={e => setForm({...form, course_interest: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-secondary-400">
          <option value="">Selecione um curso</option>
          {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
        </select>
      </div>
      <button type="submit" disabled={sending || !form.name.trim()}
        className="w-full py-3 bg-gradient-to-r from-secondary-500 to-primary-500 text-white rounded-xl font-semibold hover:from-secondary-600 hover:to-primary-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base">
        {sending ? 'Enviando...' : <><FaWhatsapp className="text-lg" /> Quero receber informações</>}
      </button>
      <p className="text-xs text-center text-gray-400">Seus dados estão protegidos. Não compartilhamos com terceiros.</p>
    </form>
  );
}

export default function SaibaMaisPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formRef, setFormRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(Array.isArray(data) ? data : data.data || [])).catch(() => {});
  }, []);

  const scrollToForm = () => formRef?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white">
      {/* Meta tags para redes sociais */}
      <div className="hidden">
        <div itemProp="image" content="/images/students-hero.jpg" />
        <div itemProp="description" content="Faculdade Diferencial - Cursos reconhecidos pelo MEC. Matrículas abertas! Mensalidades a partir de R$ 49,90." />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/students-hero.jpg')] bg-cover bg-center opacity-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FiBook className="text-white text-lg" />
            </div>
            <span className="text-white/80 font-semibold">Faculdade Diferencial</span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur mb-5">
              <FaGraduationCap /> Ensino Superior Reconhecido pelo MEC
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
              Sua Carreira Começa<br />
              <span className="text-secondary-200">Aqui e Agora</span>
            </h1>

            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8">
              Cursos de graduação e pós-graduação 100% online com certificação MEC.
              Mensalidades a partir de <strong className="text-white">R$ 49,90</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={scrollToForm}
                className="px-8 py-3.5 bg-white text-secondary-600 rounded-xl font-bold hover:bg-secondary-50 transition-all shadow-lg flex items-center gap-2">
                <FaWhatsapp /> Quero saber mais
              </button>
              <Link href="/matricula"
                className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2">
                Fazer matrícula <FiArrowRight />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '+500', label: 'Alunos' },
              { value: '15+', label: 'Anos' },
              { value: '95%', label: 'Empregabilidade' },
            ].map(s => (
              <div key={s.label} className="text-center bg-white/10 backdrop-blur rounded-xl py-3">
                <div className="text-xl md:text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Por que escolher a <span className="text-secondary-500">Faculdade Diferencial</span>?
          </h2>
          <p className="text-gray-500">Qualidade, flexibilidade e preço justo para você realizar seus sonhos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-secondary-50 to-white rounded-xl border border-secondary-100">
              <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <FiCheck className="text-white text-sm" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Courses Preview + Form */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left - Course cards */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Nossos Cursos</h2>
              <p className="text-gray-500 text-sm mb-6">Confira alguns dos nossos cursos mais procurados:</p>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {courses.slice(0, 6).map(c => (
                  <Link key={c.id} href={`/curso/${c.slug}`}
                    className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-secondary-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{c.category_name} &middot; {c.workload}h</p>
                      </div>
                      <span className="text-secondary-600 font-bold text-sm whitespace-nowrap ml-3">
                        R$ {Number(c.price).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">Carregando cursos...</p>
                )}
              </div>
              <Link href="/cursos"
                className="inline-flex items-center gap-1.5 text-sm text-secondary-600 font-semibold mt-4 hover:text-secondary-700">
                Ver todos os cursos <FiArrowRight />
              </Link>
            </div>

            {/* Right - Lead Form */}
            <div ref={setFormRef} className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 sticky top-8">
              <div className="flex items-center gap-2 mb-1">
                <FaWhatsapp className="text-secondary-500 text-xl" />
                <h3 className="text-xl font-bold text-gray-900">Receba informações</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Preencha seus dados e nossa equipe entrará em contato pelo WhatsApp.
              </p>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-secondary-500 mb-2">
            {[...Array(5)].map((_, i) => <FaStar key={i} />)}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            O que nossos alunos dizem
          </h2>
          <p className="text-gray-500">Histórias reais de quem transformou a vida com a Faculdade Diferencial.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-${t.color === 'secondary' ? 'secondary' : 'primary'}-500 flex items-center justify-center text-white text-sm font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.course}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-secondary-500 to-primary-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Não perca mais tempo!
          </h2>
          <p className="text-white/80 mb-6">
            Matrículas abertas para 2026. Garanta sua vaga e comece a construir seu futuro hoje.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={scrollToForm}
              className="px-8 py-3.5 bg-white text-secondary-600 rounded-xl font-bold hover:bg-secondary-50 transition-all flex items-center gap-2">
              <FaWhatsapp /> Fale conosco
            </button>
            <Link href="/matricula"
              className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all">
              Quero me matricular
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FiBook className="text-secondary-400" />
            <span className="text-white font-semibold">Faculdade Diferencial</span>
          </div>
          <p>Ensino superior a distância com qualidade e certificação MEC.</p>
          <p className="text-xs mt-2">&copy; {new Date().getFullYear()} Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
