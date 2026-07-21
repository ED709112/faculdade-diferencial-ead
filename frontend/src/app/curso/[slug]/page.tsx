'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FiChevronRight,
  FiClock,
  FiUsers,
  FiStar,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiPlay,
} from 'react-icons/fi';
import { FaStar, FaPlayCircle } from 'react-icons/fa';
import PublicLayout from '@/components/layout/PublicLayout';
import CourseCard from '@/components/courses/CourseCard';
import Loading from '@/components/ui/Loading';
import api from '@/lib/api';

interface Lesson {
  id: number;
  title: string;
  duration?: number;
  is_free?: boolean;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Teacher {
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
  courses_count?: number;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  image?: string;
  video_url?: string;
  price: number;
  original_price?: number;
  workload: number;
  rating_avg: number;
  rating_count: number;
  students_count: number;
  teacher_name: string;
  teacher_avatar?: string;
  teacher_bio?: string;
  category_name: string;
  category_slug: string;
  modules: Module[];
  learn_items?: string[];
  requirements?: string[];
  reviews?: Review[];
  related_courses?: any[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatWorkload(hours: number): string {
  if (hours < 60) return `${hours}h`;
  const h = Math.floor(hours / 60);
  const m = hours % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

const tabs = [
  { id: 'content', label: 'Conteudo Programatico' },
  { id: 'learn', label: 'O que voce vai aprender' },
  { id: 'requirements', label: 'Requisitos' },
  { id: 'reviews', label: 'Avaliacoes' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function CursoDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/courses/slug/${slug}`);
        setCourse(data.data || data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const toggleModule = (id: number) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  if (loading) return <Loading text="Carregando curso..." />;
  if (!course)
    return (
      <PublicLayout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso nao encontrado</h1>
          <Link href="/cursos" className="btn-primary">
            Ver Cursos
          </Link>
        </div>
      </PublicLayout>
    );

  const hasDiscount = course.original_price && course.original_price > course.price;
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <PublicLayout>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-3">
          <nav className="flex items-center text-sm text-gray-500 gap-1 flex-wrap">
            <Link href="/" className="hover:text-primary-500 transition-colors">
              Inicio
            </Link>
            <FiChevronRight className="text-xs" />
            <Link href="/cursos" className="hover:text-primary-500 transition-colors">
              Cursos
            </Link>
            <FiChevronRight className="text-xs" />
            <Link
              href={`/cursos?categoria=${course.category_slug}`}
              className="hover:text-primary-500 transition-colors"
            >
              {course.category_name}
            </Link>
            <FiChevronRight className="text-xs" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {course.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-500 py-12 lg:py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Info */}
            <div className="lg:col-span-2">
              <span className="badge bg-white/20 text-white mb-4 inline-block">
                {course.category_name}
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-primary-100 text-lg mb-6">{course.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-primary-100">
                {/* Teacher */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {course.teacher_avatar ? (
                      <img
                        src={course.teacher_avatar}
                        alt={course.teacher_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {course.teacher_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span>{course.teacher_name}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar
                      key={i}
                      className={`text-sm ${
                        i < Math.round(Number(course.rating_avg || 0)) ? 'text-yellow-400' : 'text-white/30'
                      }`}
                    />
                  ))}
                  <span className="ml-1">
                    {Number(course.rating_avg || 0).toFixed(1)} ({course.rating_count || 0})
                  </span>
                </div>

                {/* Students */}
                <div className="flex items-center gap-1">
                  <FiUsers />
                  <span>{course.students_count} alunos</span>
                </div>

                {/* Workload */}
                <div className="flex items-center gap-1">
                  <FiClock />
                  <span>{formatWorkload(course.workload)}</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:sticky lg:top-24">
              {course.image && (
                <div className="rounded-xl overflow-hidden mb-5 -mx-1 -mt-1">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <div className="mb-5">
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through block mb-0.5">
                    {formatPrice(course.original_price!)}
                  </span>
                )}
                <span className="text-3xl font-extrabold text-secondary-500">
                  {formatPrice(course.price)}
                </span>
              </div>

              <Link
                href={`/matricula?curso=${course.id}`}
                className="block w-full bg-secondary-500 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-secondary-600 transition-colors text-center shadow-md shadow-secondary-500/25"
              >
                Matricular Agora
              </Link>

              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FiClock className="text-primary-500" />
                  {formatWorkload(course.workload)} de conteudo
                </li>
                <li className="flex items-center gap-2">
                  <FiBookOpen className="text-primary-500" />
                  {course.modules.length} modulos, {totalLessons} aulas
                </li>
                <li className="flex items-center gap-2">
                  <FiUsers className="text-primary-500" />
                  {course.students_count} alunos matriculados
                </li>
                <li className="flex items-center gap-2">
                  <FiStar className="text-primary-500" />
                  Certificado ao concluir
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="container-custom py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'content' && (
              <div className="space-y-3">
                {course.modules.length === 0 ? (
                  <p className="text-gray-500 text-sm">Conteudo programatico nao disponivel.</p>
                ) : (
                  course.modules.map((mod) => {
                    const isExpanded = expandedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <span className="text-sm font-bold text-gray-900">{mod.title}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'})
                            </span>
                          </div>
                          <FiChevronDown
                            className={`text-gray-400 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div
                          className="overflow-hidden transition-all duration-300"
                          style={{
                            maxHeight: isExpanded ? '1000px' : '0px',
                            opacity: isExpanded ? 1 : 0,
                          }}
                        >
                          <div className="border-t border-gray-100">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <FiPlay className="text-gray-300 text-sm shrink-0" />
                                  <span className="text-sm text-gray-700">{lesson.title}</span>
                                  {lesson.is_free && (
                                    <span className="badge-success text-[10px]">Gratis</span>
                                  )}
                                </div>
                                {lesson.duration && (
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {lesson.duration}min
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'learn' && (
              <div>
                {course.learn_items && course.learn_items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.learn_items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <FiCheck className="text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : course.description ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                ) : (
                  <p className="text-gray-500 text-sm">
                    Informacoes nao disponiveis para este curso.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'requirements' && (
              <div>
                {course.requirements && course.requirements.length > 0 ? (
                  <ul className="space-y-3">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FiCheck className="text-primary-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Nenhum requisito especial necessario. Basta vontade de aprender!
                  </p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {course.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-500 font-semibold text-sm">
                              {review.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.user_name}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`text-xs ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-12">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Ainda nao ha avaliacoes para este curso.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Teacher Sidebar */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Professor</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                  {course.teacher_avatar ? (
                    <img
                      src={course.teacher_avatar}
                      alt={course.teacher_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-500 font-bold text-xl">
                      {course.teacher_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{course.teacher_name}</p>
                </div>
              </div>
              {course.teacher_bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{course.teacher_bio}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses */}
      {course.related_courses && course.related_courses.length > 0 && (
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="container-custom">
            <h2 className="section-title mb-8">Cursos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.related_courses.map((rc: any) => (
                <CourseCard key={rc.id} course={rc} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
