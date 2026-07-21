'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShoppingCart, FiCheck, FiPackage, FiTruck } from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import Loading from '@/components/ui/Loading';
import { useCart } from '@/hooks/useCart';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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
  weight?: string;
  dimensions?: string;
  sales_count: number;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProdutoPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    api.get(`/products/${params.slug}`)
      .then(res => setProduct(res.data))
      .catch(() => toast.error('Produto não encontrado.'))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <PublicLayout><Loading /></PublicLayout>;
  if (!product) return <PublicLayout><div className="text-center py-16"><p>Produto não encontrado.</p></div></PublicLayout>;

  const inCart = isInCart(product.id);
  const outOfStock = product.stock <= 0;
  const hasDiscount = product.original_price && product.original_price > product.price;

  const handleAdd = () => {
    if (!inCart && !outOfStock) {
      addItem(product);
    }
  };

  return (
    <PublicLayout>
      <div className="container-custom py-8 lg:py-12">
          <Link href="/produtos" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 mb-6">
          <FiArrowLeft /> Voltar para a loja
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                <FiPackage className="text-secondary-300 text-8xl" />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <span className="inline-block bg-secondary-50 text-secondary-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {product.category}
              </span>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{product.name}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="flex items-center gap-1"><FiPackage /> {product.product_type === 'livro' ? 'Livro' : product.product_type === 'apostila' ? 'Apostila' : 'Produto'}</span>
              {product.weight && <span>{product.weight}</span>}
              {product.stock > 0 && <span className="text-green-600 font-medium">{product.stock} em estoque</span>}
            </div>

            {/* Price */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                {hasDiscount && (
                  <span className="text-lg text-gray-400 dark:text-gray-500 line-through">{formatPrice(product.original_price!)}</span>
                )}
                <span className="text-3xl font-bold text-secondary-500">{formatPrice(product.price)}</span>
              </div>
              {hasDiscount && (
                <span className="text-sm text-green-600 font-medium">
                  Economia de {formatPrice(product.original_price! - product.price)}
                </span>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            {!outOfStock ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Quantidade:</span>
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >-</button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >+</button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) addItem(product);
                  }}
                  disabled={inCart}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
                    inCart
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 cursor-default'
                      : 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg shadow-secondary-500/25'
                  }`}
                >
                  {inCart ? <><FiCheck /> Já no carrinho</> : <><FiShoppingCart /> Adicionar ao carrinho</>}
                </button>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl p-4 text-center font-medium">
                Produto fora de estoque
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Descrição</h2>
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</div>
              </div>
            )}

            {/* Shipping info */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex items-start gap-3">
              <FiTruck className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Frete</p>
                <p>Consulte prazo e valor de frete na finalização da compra.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
