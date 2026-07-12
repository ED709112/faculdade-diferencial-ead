'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDownload,
  FiFileText,
  FiFile,
  FiVideo,
  FiBook,
  FiSearch,
} from 'react-icons/fi';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface DownloadItem {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  file_size?: string;
  course_title: string;
  lesson_title: string;
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDownloads = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/enrollments/my/downloads');
      setDownloads(data.downloads || data.data || data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return <FiFileText className="text-red-500" />;
    if (type?.includes('video')) return <FiVideo className="text-purple-500" />;
    if (type?.includes('image')) return <FiFile className="text-green-500" />;
    return <FiFile className="text-blue-500" />;
  };

  const filtered = downloads.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.course_title.toLowerCase().includes(search.toLowerCase()) ||
      d.lesson_title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Carregando downloads..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Downloads</h2>
          <p className="text-gray-500 text-sm mt-1">
            Materiais disponíveis para download dos seus cursos
          </p>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full sm:w-72">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar material..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
          />
        </div>
      </div>

      {downloads.length === 0 ? (
        <EmptyState
          icon={<FiDownload />}
          title="Nenhum material disponível"
          description="Os materiais dos seus cursos aparecerão aqui."
          action={{ label: 'Ver Meus Cursos', href: '/aluno/cursos' }}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <FiSearch className="text-3xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum resultado para &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {getFileIcon(item.file_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <FiBook />
                    <span>{item.course_title}</span>
                    <span>·</span>
                    <span>{item.lesson_title}</span>
                    {item.file_size && (
                      <>
                        <span>·</span>
                        <span>{item.file_size}</span>
                      </>
                    )}
                  </div>
                </div>

                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-500 text-sm font-medium hover:bg-primary-100 transition-colors shrink-0"
                >
                  <FiDownload /> Baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
