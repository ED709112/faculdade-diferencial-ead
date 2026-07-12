'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FiBookOpen,
  FiBriefcase,
  FiHeart,
  FiCpu,
  FiTrendingUp,
  FiActivity,
  FiCode,
  FiAward,
  FiUsers,
  FiChevronRight,
} from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  course_count: number;
}

const iconMap: Record<string, React.ReactNode> = {
  briefcase: <FiBriefcase />,
  book: <FiBookOpen />,
  heart: <FiHeart />,
  'trending-up': <FiTrendingUp />,
  activity: <FiActivity />,
  code: <FiCode />,
  cog: <FiCpu />,
  award: <FiAward />,
  users: <FiUsers />,
};

const bgColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-emerald-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-cyan-600',
  'from-indigo-500 to-blue-600',
  'from-yellow-500 to-orange-500',
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || data || []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 py-12">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
          <p className="text-primary-100">
            Explore nossas areas de formacao e encontre o curso ideal para voce.
          </p>
        </div>
      </section>

      <section className="container-custom py-12">
        {loading ? (
          <Loading fullScreen={false} text="Carregando categorias..." />
        ) : categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria encontrada"
            description="As categorias serao disponibilizadas em breve."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/cursos?categoria=${cat.slug}`}
                className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`bg-gradient-to-r ${
                    bgColors[i % bgColors.length]
                  } p-6 flex items-center gap-4`}
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-2xl">
                    {iconMap[cat.icon] || <FiBookOpen />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">{cat.name}</h2>
                    <p className="text-white/80 text-sm">
                      {cat.course_count} {cat.course_count === 1 ? 'curso' : 'cursos'}
                    </p>
                  </div>
                  <FiChevronRight className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all text-xl shrink-0" />
                </div>
                {cat.description && (
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{cat.description}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
