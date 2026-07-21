'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiShoppingBag, FiSearch, FiFilter } from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import ProductCard from '@/components/products/ProductCard';
import Loading from '@/components/ui/Loading';
import api from '@/lib/api';

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  original_price?: number;
  stock: number;
  image?: string;
  category?: string;
  product_type: string;
  sales_count: number;
}

function ProdutosContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');

  useEffect(() => {
    Promise.all([
      api.get(`/products?category=${selectedCategory}&search=${search}`),
      api.get('/products/categories')
    ]).then(([productsRes, categoriesRes]) => {
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedCategory, search]);

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 py-12 lg:py-16">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-4">
            <FiShoppingBag className="text-3xl text-white" />
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Nossa Loja</h1>
          </div>
          <p className="text-secondary-100 text-lg">Livros, apostilas e materiais para impulsionar seus estudos.</p>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
            <FiSearch className="text-gray-400 dark:text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat.category} value={cat.category}>{cat.category} ({cat.count})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingBag className="text-5xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Nenhum produto encontrado</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProdutosContent />
    </Suspense>
  );
}
