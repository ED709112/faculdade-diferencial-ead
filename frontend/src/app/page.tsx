'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiUserPlus,
  FiBookOpen,
  FiMonitor,
  FiAward,
  FiCalendar,
  FiUser,
  FiBook,
  FiBarChart2,
  FiCreditCard,
} from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import CourseCard from '@/components/courses/CourseCard';
import CategoryCard from '@/components/courses/CategoryCard';
import TestimonialCard from '@/components/courses/TestimonialCard';
import FAQAccordion from '@/components/courses/FAQAccordion';
import HeroSlider from '@/components/ui/HeroSlider';
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

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  image_url?: string;
  published_at?: string;
}

const steps = [
  {
    icon: FiUserPlus,
    title: 'Cadastre-se',
    description: 'Crie sua conta gratuita em poucos segundos.',
  },
  {
    icon: FiBookOpen,
    title: 'Escolha o Curso',
    description: 'Explore nosso catalogo e encontre o curso ideal para voce.',
  },
  {
    icon: FiMonitor,
    title: 'Estude',
    description: 'Assista as aulas no seu ritmo, de qualquer dispositivo.',
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, categoriesRes, testimonialsRes, faqsRes, newsRes] = await Promise.allSettled([
          api.get('/courses/featured'),
          api.get('/categories'),
          api.get('/testimonials'),
          api.get('/faqs'),
          api.get('/news/public?limit=3'),
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
        if (newsRes.status === 'fulfilled') {
          setNews(newsRes.value.data || []);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const faqItems = faqs.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <PublicLayout>
      <div className="bg-secondary-50/50 dark:bg-gray-900">
      {loading && <Loading fullScreen />}

      <HeroSlider />

      <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="container-custom py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/auth/login" className="group flex items-center gap-4 bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-100 p-5 rounded-2xl hover:shadow-md hover:border-primary-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiBookOpen className="text-xl text-white" />
              </div>
              <div>
                <p className="text-xs text-primary-400 font-semibold uppercase tracking-wide">Portal do</p>
                <p className="text-base font-bold text-gray-900">Aluno</p>
              </div>
            </Link>

            <a href="#" className="group flex items-center gap-4 bg-gradient-to-br from-secondary-50 to-secondary-100/50 border border-secondary-100 p-5 rounded-2xl hover:shadow-md hover:border-secondary-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiMonitor className="text-xl text-white" />
              </div>
              <div>
                <p className="text-xs text-secondary-400 font-semibold uppercase tracking-wide">AVA</p>
                <p className="text-base font-bold text-gray-900">Academico</p>
              </div>
            </a>

            <Link href="/auth/login" className="group flex items-center gap-4 bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-100 p-5 rounded-2xl hover:shadow-md hover:border-violet-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiUser className="text-xl text-white" />
              </div>
              <div>
                <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Portal do</p>
                <p className="text-base font-bold text-gray-900">Professor</p>
              </div>
            </Link>

            <a href="#" className="group flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 p-5 rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FiBarChart2 className="text-xl text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Avaliacao</p>
                <p className="text-base font-bold text-gray-900">Institucional</p>
              </div>
            </a>

          </div>
        </div>
      </section>

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

      {categories.length > 0 && (
        <section className="py-8 lg:py-12 bg-gray-50 dark:bg-gray-900">
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
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                )}
                <div className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                  <step.icon className="text-3xl text-primary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="inline-block text-xs font-bold text-secondary-500 bg-secondary-50 dark:bg-secondary-900/30 px-3 py-1 rounded-full mb-3">
                  Passo {i + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[250px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="py-8 lg:py-12 bg-gray-50 dark:bg-gray-900">
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

      {news.length > 0 && (
        <section className="py-8 lg:py-12">
          <div className="container-custom">
            <div className="text-center mb-8">
              <h2 className="section-title">Ultimas Noticias</h2>
              <p className="section-subtitle mt-1">Confira o que ha de novidades na FAD</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`/noticia/${item.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center">
                      <FiBookOpen className="text-4xl text-primary-300 dark:text-primary-600" />
                    </div>
                  )}
                  <div className="p-6">
                    {item.published_at && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
                        <FiCalendar className="text-sm" />
                        {new Date(item.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.summary}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
      </div>
    </PublicLayout>
  );
}
