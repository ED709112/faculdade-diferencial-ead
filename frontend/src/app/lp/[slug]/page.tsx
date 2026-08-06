import { Metadata } from 'next';
import Link from 'next/link';
import { FiCheck, FiClock, FiUsers, FiArrowRight } from 'react-icons/fi';
import { FaStar, FaWhatsapp } from 'react-icons/fa';
import LpLeadForm from './LpLeadForm';
import VestibularLp from './VestibularLp';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const SITE_URL = 'https://fadead.com.br';

interface Course {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  image?: string;
  price: number;
  original_price?: number;
  workload: number;
  enrollment_count: number;
  rating_avg: number;
  rating_count: number;
  teacher_name: string;
  category_name: string;
  is_free: number;
}

async function getCourse(slug: string): Promise<Course | null> {
  try {
    const res = await fetch(`${API_URL}/courses/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: 'Curso não encontrado - Faculdade Diferencial' };

  const imagePath = course.image
    ? course.image.startsWith('/') ? course.image : `/uploads/courses/${course.image}`
    : '/images/og-image.jpg';
  const imageUrl = `${SITE_URL}${imagePath}`;

  return {
    title: `${course.title} - Faculdade Diferencial`,
    description: course.subtitle || `Curso ${course.title} na Faculdade Diferencial. Matrículas abertas!`,
    openGraph: {
      title: course.title,
      description: course.subtitle || `Curso ${course.title} na Faculdade Diferencial`,
      url: `${SITE_URL}/lp/${course.slug}`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.subtitle || `Curso ${course.title} na Faculdade Diferencial`,
      images: [imageUrl],
    },
  };
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function LpPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso não encontrado</h1>
          <p className="text-gray-500 mb-4">O curso que você procura não está disponível.</p>
          <Link href="/" className="text-secondary-500 hover:underline font-semibold">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  if (course.slug === 'pedagogia-vestibular-2026-2') {
    return <VestibularLp course={course} />;
  }

  const benefits = [
    'Certificado reconhecido pelo MEC',
    'Suporte ao aluno 24h via WhatsApp',
    'Plataforma 100% online',
    'Mensalidades a partir de R$ 49,90',
    'Corpo docente qualificado',
    'Flexibilidade de horário',
  ];

  const courseImg = course.image
    ? course.image.startsWith('/') ? course.image : `/uploads/courses/${course.image}`
    : null;

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-600 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-white/70 text-sm font-semibold uppercase tracking-wider">
                {course.category_name}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3 leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-secondary-200 text-lg mb-6">{course.subtitle}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-white/80 mb-6">
                <span className="flex items-center gap-1"><FiUsers /> {course.enrollment_count} alunos</span>
                <span className="flex items-center gap-1"><FiClock /> {course.workload}h</span>
                <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {Number(course.rating_avg || 0).toFixed(1)}</span>
                <span className="flex items-center gap-1 font-semibold">{course.teacher_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">
                  {course.is_free ? 'Grátis' : formatPrice(course.price)}
                </span>
                {course.original_price && !course.is_free && (
                  <span className="text-lg text-white/60 line-through">{formatPrice(course.original_price)}</span>
                )}
              </div>
            </div>
            {courseImg && (
              <div>
                <img src={courseImg} alt={course.title} className="w-full rounded-2xl shadow-2xl" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Por que fazer este curso?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-secondary-50 to-white rounded-xl border border-secondary-100">
                  <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <FiCheck className="text-white text-sm" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 sticky top-8">
            <div className="flex items-center gap-2 mb-1">
              <FaWhatsapp className="text-secondary-500 text-xl" />
              <h3 className="text-xl font-bold text-gray-900">Receba informações</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Preencha seus dados e nossa equipe entrará em contato pelo WhatsApp sobre o curso <strong>{course.title}</strong>.
            </p>
            <LpLeadForm courseTitle={course.title} />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-secondary-500 to-primary-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Não perca essa oportunidade!
          </h2>
          <p className="text-white/80 mb-6">
            Matrículas abertas. Comece seu curso hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/matricula?curso=${course.id}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-secondary-600 rounded-xl font-bold hover:bg-secondary-50 transition-all shadow-lg">
              Quero me matricular <FiArrowRight />
            </Link>
            <Link href="/saiba-mais"
              className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all">
              Falar com consultor
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
