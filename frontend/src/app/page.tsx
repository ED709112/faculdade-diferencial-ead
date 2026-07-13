'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiUserPlus,
  FiBookOpen,
  FiMonitor,
  FiAward,
} from 'react-icons/fi';
import { FaPlayCircle } from 'react-icons/fa';
import PublicLayout from '@/components/layout/PublicLayout';
import CourseCard from '@/components/courses/CourseCard';
import CategoryCard from '@/components/courses/CategoryCard';
import TestimonialCard from '@/components/courses/TestimonialCard';
import FAQAccordion from '@/components/courses/FAQAccordion';
import Loading from '@/components/ui/Loading';
import api from '@/lib/api';

interface FeaturedCourse {
  id: number;
  title: string;
  slug: string;
  image?: string;
  teacher_name: string;
  price: number;
  original_price?: number;
  workload: number;
  rating_avg: number;
  rating_count: number;
  category_name: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  course_count: number;
  icon?: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const stats = [
  { label: 'Alunos', value: '5.000+' },
  { label: 'Cursos', value: '120+' },
  { label: 'Professores', value: '80+' },
  { label: 'Certificados', value: '3.000+' },
];

const steps = [
  {
    icon: FiUserPlus,
    title: 'Cadastre-se',
    description: 'Crie sua conta gratuita em poucos segundos.',
  },
  {
    icon: FiBookOpen,
    title: 'Escolha o Curso',
    description: 'Explore nosso catálogo e encontre o curso ideal para você.',
  },
  {
    icon: FiMonitor,
    title: 'Estude',
    description: 'Assista às aulas no seu ritmo, de qualquer dispositivo.',
  },
  {
    icon: FiAward,
    title: 'Conquiste seu Certificado',
    description: 'Ao concluir, receba seu certificado reconhecido.',
  },
];

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, categoriesRes, testimonialsRes, faqsRes] = await Promise.allSettled([
          api.get('/courses/featured'),
          api.get('/categories'),
          api.get('/testimonials'),
          api.get('/faqs'),
        ]);

        if (coursesRes.status === 'fulfilled') {
          const data = coursesRes.value.data;
          setFeaturedCourses(data.data || data || []);
        }
        if (categoriesRes.status === 'fulfilled') {
          const data = categoriesRes.value.data;
          setCategories(data.data || data || []);
        }
        if (testimonialsRes.status === 'fulfilled') {
          const data = testimonialsRes.value.data;
          setTestimonials(data.data || data || []);
        }
        if (faqsRes.status === 'fulfilled') {
          const data = faqsRes.value.data;
          setFaqs(data.data || data || []);
        }
      } catch {
        // silent fail - sections will render empty
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const faqItems = faqs.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <PublicLayout>
      {loading && <Loading fullScreen />}

      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="container-custom flex flex-col lg:flex-row items-center gap-8 py-8 lg:py-12">
          <img
            src="/images/hero-banner.jpg"
            alt="Capacitação e Formação Continuada"
            className="w-full lg:w-1/2 max-h-[70vh] object-contain"
          />
          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-600 leading-tight">
              Invista em você!
            </h2>
            <p className="text-lg sm:text-xl text-primary-500 mt-4 leading-relaxed">
              Cursos EAD com flexibilidade, qualidade e certificação para o mercado de trabalho.
            </p>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 mt-8 bg-secondary-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-secondary-600 transition-colors shadow-lg shadow-secondary-500/30"
            >
              Ver Cursos
              <FiArrowRight className="text-xl" />
            </Link>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500" />
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-custom py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-primary-500 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-8 lg:py-12">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="section-title">Cursos em Destaque</h2>
                <p className="section-subtitle mt-1">Os cursos mais procurados pelos nossos alunos</p>
              </div>
              <Link
                href="/cursos"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Ver todos <FiArrowRight />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/cursos" className="btn-outline text-sm">
                Ver todos os cursos
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-8 lg:py-12 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-6">
              <h2 className="section-title">Categorias</h2>
              <p className="section-subtitle mt-1">Explore por area de atuacao</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  courseCount={cat.course_count}
                  icon={<FiBookOpen />}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="como-funciona" className="py-8 lg:py-12">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">Como Funciona</h2>
            <p className="section-subtitle mt-1">Simples, flexivel e do seu jeito</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center group">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                )}
                <div className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                  <step.icon className="text-3xl text-primary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="inline-block text-xs font-bold text-secondary-500 bg-secondary-50 px-3 py-1 rounded-full mb-3">
                  Passo {i + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[250px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-8 lg:py-12 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-6">
              <h2 className="section-title">Depoimentos</h2>
              <p className="section-subtitle mt-1">O que nossos alunos dizem</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  name={t.name}
                  role={t.role}
                  content={t.content}
                  rating={t.rating}
                  avatar={t.avatar}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="py-8 lg:py-12">
          <div className="container-custom">
            <div className="text-center mb-6">
              <h2 className="section-title">Perguntas Frequentes</h2>
              <p className="section-subtitle mt-1">Tire suas duvidas</p>
            </div>
            <FAQAccordion items={faqItems} />
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="container-custom text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Pronto para transformar sua carreira?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
            Cadastre-se agora e comece sua jornada rumo ao sucesso profissional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/cadastro"
              className="inline-flex items-center gap-2 bg-secondary-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary-600 transition-colors shadow-lg"
            >
              Comece Agora
              <FiArrowRight className="text-xl" />
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 bg-white/15 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/25 transition-colors border border-white/20"
            >
              Ver Cursos
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
