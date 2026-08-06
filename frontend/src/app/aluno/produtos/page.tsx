'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiDownload, FiBookOpen, FiPackage, FiFileText, FiSearch } from 'react-icons/fi';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface PurchasedProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  product_type: string;
  download_url?: string;
}

const typeLabels: Record<string, string> = {
  livro: 'Livro',
  apostila: 'Apostila',
  material: 'Material',
  outro: 'Produto',
};

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeusProdutosPage() {
  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products/my');
      setProducts(data.data || []);
    } catch {
      toast.error('Erro ao carregar seus produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDownload = (product: PurchasedProduct) => {
    if (!product.download_url) {
      toast.error('Nenhum arquivo disponível para este produto.');
      return;
    }
    window.open(product.download_url, '_blank', 'noopener,noreferrer');
  };

  const filtered = products.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Carregando seus produtos..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Produtos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Apostilas e materiais digitais liberados após o pagamento
          </p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-full sm:w-72">
          <FiSearch className="text-gray-400 dark:text-gray-500 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<FiBookOpen />}
          title="Nenhum produto comprado ainda"
          description="Os produtos digitais que você comprar aparecerão aqui liberados para download."
          action={{ label: 'Visitar a Loja', href: '/aluno/loja' }}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <FiSearch className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum resultado para &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="relative h-40 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-gray-700 dark:to-gray-800">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiPackage className="text-secondary-300 dark:text-gray-600 text-4xl" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-white/90 text-secondary-500 text-xs font-semibold px-2 py-1 rounded-full">
                  {typeLabels[product.product_type] || 'Produto'}
                </span>
              </div>

              <div className="p-4">
                <Link href={`/produto/${product.slug}`} className="block">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 hover:text-secondary-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {product.category && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="text-sm text-gray-400">Pago em</span>
                    <span className="block font-bold text-secondary-500">{formatPrice(product.price)}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(product)}
                    disabled={!product.download_url}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      product.download_url
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiDownload /> {product.download_url ? 'Baixar' : 'Sem arquivo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
