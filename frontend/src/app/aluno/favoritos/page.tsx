'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiHeart,
  FiClock,
  FiCheckCircle,
  FiTrash2,
} from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface FavoritedCourse {
  id: number;
  course: {
    id: number;
    title: string;
    slug: string;
    image?: string;
    teacher_name: string;
    workload: number;
    category_name: string;
  };
  progress?: number;
  enrolled?: boolean;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/favorites');
      setFavorites(data.favorites || data.data || data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (favoriteId: number) => {
    try {
      await api.delete(`/favorites/${favoriteId}`);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success('Removido dos favoritos');
    } catch {
      toast.error('Erro ao remover favorito');
    }
  };

  if (loading) return <Loading text="Carregando favoritos..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Favoritos</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Cursos que você salvou para assistir depois
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<FiHeart />}
          title="Nenhum favorito"
          description="Explore nossos cursos e salve seus favoritos aqui."
          action={{ label: 'Explorar Cursos', href: '/cursos' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((fav) => {
            const progress = fav.progress || 0;
            return (
              <div key={fav.id} className="card group relative">
                {/* Remove Button */}
                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-red-50 transition-colors group/btn"
                  title="Remover dos favoritos"
                >
                  <FiHeart className="text-red-500 fill-current" />
                  <span className="absolute -bottom-0.5 right-0 w-3.5 h-3.5 bg-white dark:bg-gray-800 rounded-full items-center justify-center hidden group-hover/btn:flex">
                    <FiTrash2 className="text-red-500 text-[8px]" />
                  </span>
                </button>

                {/* Image */}
                <Link href={`/aluno/curso/${fav.course.id}`}>
                  <div className="relative h-40 overflow-hidden">
                    {fav.course.image ? (
                      <img
                        src={fav.course.image?.startsWith('/') ? fav.course.image : `/uploads/courses/${fav.course.image}`}
                        alt={fav.course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <span className="text-primary-500 text-4xl font-bold">
                          {fav.course.title.charAt(0)}
                        </span>
                      </div>
                    )}

                    {fav.enrolled && (
                      <div className="absolute top-3 right-3 w-12 h-12">
                        <CircularProgressbar
                          value={progress}
                          text={`${Math.round(progress)}%`}
                          styles={buildStyles({
                            textSize: '28px',
                            textColor: '#fff',
                            pathColor:
                              progress >= 100 ? '#16a34a' : '#1a56db',
                            trailColor: 'rgba(255,255,255,0.3)',
                            pathTransitionDuration: 1,
                          })}
                        />
                      </div>
                    )}

                    {fav.enrolled && progress >= 100 && (
                      <div className="absolute bottom-3 left-3 badge-success">
                        <FiCheckCircle className="mr-1" /> Concluído
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/aluno/curso/${fav.course.id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-primary-500 transition-colors">
                      {fav.course.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    por {fav.course.teacher_name}
                  </p>

                  {/* Category */}
                  <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mb-3">
                    {fav.course.category_name}
                  </span>

                  {/* Meta */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <FiClock />
                    <span>{fav.course.workload}h de conteúdo</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
