'use client';

import { useState, useEffect } from 'react';
import { FiShoppingBag, FiSearch } from 'react-icons/fi';
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

export default function AlunoLojaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-2">
          <FiShoppingBag className="text-2xl text-white" />
          <h1 className="text-2xl font-bold text-white">Nossa Loja</h1>
        </div>
        <p className="text-secondary-100">Livros, apostilas e materiais para impulsionar seus estudos.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <FiSearch className="text-gray-400 dark:text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
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

      {/* Products */}
      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <FiShoppingBag className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Nenhum produto encontrado</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Tente buscar por outro termo ou categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
