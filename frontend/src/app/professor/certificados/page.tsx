'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiAward,
  FiFilter,
  FiCalendar,
  FiUser,
  FiBookOpen,
  FiClock,
  FiHash,
  FiDownload,
  FiCheckCircle,
  FiX,
} from 'react-icons/fi';
import api from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';

interface CourseOption {
  id: number;
  title: string;
}

interface Certificate {
  id: number;
  code: string;
  student: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    id: number;
    title: string;
  };
  completed_at: string;
  hours: number;
  grade?: number;
  pdf_url?: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 12 };
      if (courseFilter) params.course_id = courseFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const { data } = await api.get('/certificates', { params });
      setCertificates(data.certificates || data.data || data);
      setTotalPages(data.totalPages || data.meta?.totalPages || 1);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, courseFilter, dateFrom, dateTo]);

  useEffect(() => {
    api.get('/teacher/courses', { params: { limit: 100 } })
      .then(({ data }) => setCourses(data.courses || data.data || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    setPage(1);
  }, [courseFilter, dateFrom, dateTo]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatDateShort = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const clearFilters = () => {
    setCourseFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = courseFilter !== '' || dateFrom !== '' || dateTo !== '';

  if (loading && certificates.length === 0) {
    return <Loading text="Carregando certificados..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificados Emitidos</h2>
          <p className="text-gray-500 text-sm mt-1">Todos os certificados emitidos nos seus cursos</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-primary-500 text-primary-500 bg-primary-50'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FiFilter />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Curso</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : '')}
                className="input-field"
              >
                <option value="">Todos os cursos</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data Início</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Data Fim</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX /> Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && certificates.length === 0 && (
        <EmptyState
          icon={<FiAward />}
          title="Nenhum certificado encontrado"
          description={
            hasActiveFilters
              ? 'Nenhum certificado encontrado com os filtros aplicados.'
              : 'Ainda não foram emitidos certificados nos seus cursos.'
          }
        />
      )}

      {/* Certificates Grid */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header gradient */}
              <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                    <FiAward className="text-2xl text-primary-500" />
                  </div>
                  <span className="badge-success">
                    <FiCheckCircle className="mr-1" /> Emitido
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  {cert.course.title}
                </h3>

                {/* Student info */}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {cert.student.avatar ? (
                      <img src={cert.student.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="text-primary-500 text-xs" />
                    )}
                  </div>
                  <span className="truncate">{cert.student.name}</span>
                </div>

                {/* Details */}
                <div className="space-y-2 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-green-500 shrink-0" />
                    <span>Concluído em {formatDateShort(cert.completed_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400 shrink-0" />
                    <span>Carga horária: {cert.hours}h</span>
                  </div>
                  {cert.grade != null && (
                    <div className="flex items-center gap-2">
                      <FiHash className="text-gray-400 shrink-0" />
                      <span>Nota: {cert.grade.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FiHash className="text-gray-400 shrink-0" />
                    <span className="font-mono text-xs">{cert.code}</span>
                  </div>
                </div>

                {/* Actions */}
                {cert.pdf_url && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <a
                      href={cert.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors w-full"
                    >
                      <FiDownload /> Baixar Certificado
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
