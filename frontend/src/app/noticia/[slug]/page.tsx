'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import api from '@/lib/api';
import PublicLayout from '@/components/layout/PublicLayout';
import Loading from '@/components/ui/Loading';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string | null;
  image_url: string | null;
  published_at: string;
}

export default function NoticiaPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/news/public/${slug}`)
      .then(({ data }) => setNews(data))
      .catch(() => setError('Notícia não encontrada'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PublicLayout><Loading text="Carregando notícia..." /></PublicLayout>;
  if (error || !news) {
    return (
      <PublicLayout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Notícia não encontrada</h1>
          <Link href="/" className="text-primary-600 hover:underline">Voltar ao início</Link>
        </div>
      </PublicLayout>
    );
  }

  const imageUrl = news.image_url ? (news.image_url.startsWith('http') ? news.image_url : `http://localhost:3001${news.image_url}`) : null;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-12">
        <div className="container-custom">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-100 hover:text-white text-sm mb-4 transition-colors">
            <FiArrowLeft /> Voltar
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold max-w-3xl">{news.title}</h1>
          <div className="flex items-center gap-2 mt-4 text-primary-100 text-sm">
            <FiCalendar />
            {new Date(news.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <article className="max-w-4xl mx-auto">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={news.title}
              className="w-full h-64 lg:h-96 object-cover rounded-2xl mb-8"
            />
          )}

          {news.summary && (
            <p className="text-lg text-gray-700 leading-relaxed mb-6 font-medium">
              {news.summary}
            </p>
          )}

          {news.content && (
            <div
              className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          )}
        </article>
      </div>
    </PublicLayout>
  );
}
