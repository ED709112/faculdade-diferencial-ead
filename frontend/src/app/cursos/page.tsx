'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSliders, FiX } from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import CourseCard from '@/components/courses/CourseCard';
import SearchBar from '@/components/courses/SearchBar';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import api from '@/lib/api';

interface Course {
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
}

interface PaginatedResponse {
  data: Course[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const sortOptions = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preco' },
  { value: 'price_desc', label: 'Maior preco' },
];

const priceRanges = [
  { value: '', label: 'Todos' },
  { value: '0-100', label: 'Ate R$ 100' },
  { value: '100-300', label: 'R$ 100 - R$ 300' },
  { value: '300-500', label: 'R$ 300 - R$ 500' },
  { value: '500-', label: 'Acima de R$ 500' },
];

const workloadRanges = [
  { value: '', label: 'Todas' },
  { value: '0-20', label: 'Ate 20h' },
  { value: '20-50', label: '20h - 50h' },
  { value: '50-100', label: '50h - 100h' },
  { value: '100-', label: 'Acima de 100h' },
];

function CursosContent() {
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categoria') ? [searchParams.get('categoria')!] : []
  );
  const [priceRange, setPriceRange] = useState(searchParams.get('preco') || '');
  const [workloadRange, setWorkloadRange] = useState(searchParams.get('carga') || '');
  const [sort, setSort] = useState(searchParams.get('ordenar') || 'relevance');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategories.length) params.set('categoria', selectedCategories.join(','));
      if (priceRange) params.set('preco', priceRange);
      if (workloadRange) params.set('carga', workloadRange);
      if (sort) params.set('ordenar', sort);
      params.set('page', String(page));

      const { data } = await api.get(`/courses?${params.toString()}`);
      const result: PaginatedResponse = data;
      setCourses(result.data || []);
      setTotalPages(result.meta?.last_page || 1);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, priceRange, workloadRange, sort, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || data || []);
      } catch {
        // silent
      }
    }
    loadCategories();
  }, []);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setPriceRange('');
    setWorkloadRange('');
    setSort('relevance');
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || priceRange || workloadRange || search;

  const SidebarContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-secondary-500 hover:text-secondary-600 font-medium"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Categorias</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{cat.course_count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Faixa de preco</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="price"
                checked={priceRange === range.value}
                onChange={() => {
                  setPriceRange(range.value);
                  setPage(1);
                }}
                className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Workload */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Carga horaria</h4>
        <div className="space-y-2">
          {workloadRanges.map((range) => (
            <label
              key={range.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="workload"
                checked={workloadRange === range.value}
                onChange={() => {
                  setWorkloadRange(range.value);
                  setPage(1);
                }}
                className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 py-12">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-white mb-4">Nossos Cursos</h1>
          <SearchBar />
        </div>
      </section>

      <section className="container-custom py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiSliders />
                Filtros
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {selectedCategories.length + (priceRange ? 1 : 0) + (workloadRange ? 1 : 0)}
                  </span>
                )}
              </button>

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {search && (
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    Busca: &ldquo;{search}&rdquo;
                    <button
                      onClick={() => setSearch('')}
                      className="ml-1 hover:text-primary-800"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </span>
                )}
                {selectedCategories.map((slug) => {
                  const cat = categories.find((c) => c.slug === slug);
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      {cat?.name || slug}
                      <button
                        onClick={() => toggleCategory(slug)}
                        className="ml-1 hover:text-primary-800"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  );
                })}
                {priceRange && (
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    Preco: {priceRanges.find((r) => r.value === priceRange)?.label}
                    <button
                      onClick={() => setPriceRange('')}
                      className="ml-1 hover:text-primary-800"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </span>
                )}
                {workloadRange && (
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full">
                    Carga: {workloadRanges.find((r) => r.value === workloadRange)?.label}
                    <button
                      onClick={() => setWorkloadRange('')}
                      className="ml-1 hover:text-primary-800"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <Loading fullScreen={false} text="Carregando cursos..." />
            ) : courses.length === 0 ? (
              <EmptyState
                title="Nenhum curso encontrado"
                description="Tente ajustar os filtros ou buscar por outro termo."
                action={
                  hasActiveFilters
                    ? { label: 'Limpar filtros', href: '/cursos' }
                    : undefined
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                <div className="mt-10">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <SidebarContent />
            <button
              onClick={() => setSidebarOpen(false)}
              className="mt-6 w-full btn-primary text-sm"
            >
              Aplicar Filtros
            </button>
          </div>
        </>
      )}
    </PublicLayout>
  );
}

export default function CursosPage() {
  return (
    <Suspense fallback={<Loading text="Carregando..." />}>
      <CursosContent />
    </Suspense>
  );
}
