'use client';

import React, { useEffect, useState } from 'react';
import { FiUsers, FiBook, FiMapPin, FiBriefcase, FiLinkedin, FiStar, FiCalendar } from 'react-icons/fi';
import api from '@/lib/api';
import PublicLayout from '@/components/layout/PublicLayout';
import Loading from '@/components/ui/Loading';

interface Alumni {
  id: number;
  full_name: string;
  course: string;
  completion_year: number;
  company_name: string;
  job_title: string;
  city: string;
  state: string;
  photo_url: string;
  bio: string;
  linkedin_url: string;
  is_featured: number;
}

interface Testimonial {
  id: number;
  title: string;
  content: string;
  rating: number;
  full_name: string;
  course: string;
  completion_year: number;
  alumni_photo: string;
}

interface Stats {
  total: number;
  by_course: { course: string; count: number }[];
  by_year: { completion_year: number; count: number }[];
  by_city: { city: string; count: number }[];
}

export default function EgressosPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/alumni/public'),
      api.get('/alumni/public/stats'),
      api.get('/alumni/testimonials/public'),
      api.get('/alumni/public/courses'),
    ]).then(([alumniRes, statsRes, testRes, coursesRes]) => {
      setAlumni(Array.isArray(alumniRes.data) ? alumniRes.data : []);
      setStats(statsRes.data);
      setTestimonials(Array.isArray(testRes.data) ? testRes.data : []);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filterCourse ? alumni.filter(a => a.course === filterCourse) : alumni;

  if (loading) return <PublicLayout><Loading text="Carregando egressos..." /></PublicLayout>;

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-16 lg:py-24">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FiUsers className="text-4xl" />
            <h1 className="text-3xl lg:text-5xl font-bold">Portal do Egresso</h1>
          </div>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Nossos egressos são a prova viva da qualidade da educação oferecida pela Faculdade Diferencial.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="bg-white py-12 border-b border-gray-100">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary-600">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Egressos Cadastrados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-secondary-500">{stats.by_course.length}</p>
                <p className="text-sm text-gray-500 mt-1">Cursos Representados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary-600">{stats.by_year.length}</p>
                <p className="text-sm text-gray-500 mt-1">Turmas Formadas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-secondary-500">{stats.by_city.length}</p>
                <p className="text-sm text-gray-500 mt-1">Cidades</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-10">
              Depoimentos dos Egressos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <FiStar key={i} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  {t.title && <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.content}</p>
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    {t.alumni_photo ? (
                      <img src={t.alumni_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                        {t.full_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.full_name}</p>
                      <p className="text-xs text-gray-500">{t.course} {t.completion_year ? `· Turma ${t.completion_year}` : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Egressos */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Nossos Egressos</h2>
            {courses.length > 0 && (
              <select
                value={filterCourse}
                onChange={e => setFilterCourse(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Todos os cursos</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FiUsers className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum egresso encontrado</h3>
              <p className="text-gray-500">Em breve teremos nossos egressos cadastrados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a) => (
                <div key={a.id} className={`bg-white rounded-2xl p-6 shadow-sm border ${a.is_featured ? 'border-secondary-200 ring-2 ring-secondary-100' : 'border-gray-100'} transition-shadow hover:shadow-md`}>
                  <div className="flex items-center gap-4 mb-4">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                        {a.full_name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{a.full_name}</h3>
                      <p className="text-sm text-primary-600">{a.course}</p>
                      {a.completion_year && <p className="text-xs text-gray-500">Turma {a.completion_year}</p>}
                    </div>
                  </div>
                  {a.job_title && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FiBriefcase className="text-gray-400 shrink-0" />
                      <span>{a.job_title}{a.company_name ? ` na ${a.company_name}` : ''}</span>
                    </div>
                  )}
                  {a.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <FiMapPin className="text-gray-400 shrink-0" />
                      <span>{a.city}{a.state ? ` - ${a.state}` : ''}</span>
                    </div>
                  )}
                  {a.bio && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{a.bio}</p>}
                  {a.linkedin_url && (
                    <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                      <FiLinkedin /> LinkedIn
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Você é egresso da FAD?</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Cadastre-se e faça parte da nossa rede de ex-alunos. Compartilhe sua trajetória e inspire futuros profissionais.
          </p>
          <a href="/contato" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
            Entre em Contato
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
