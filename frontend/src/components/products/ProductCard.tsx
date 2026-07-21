'use client';

import React from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  stock: number;
  image?: string;
  category?: string;
  product_type: string;
}

interface ProductCardProps {
  product: Product;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const typeLabels: Record<string, string> = {
  livro: 'Livro',
  apostila: 'Apostila',
  material: 'Material',
  outro: 'Produto',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const hasDiscount = product.original_price && product.original_price > product.price;
  const inCart = isInCart(product.id);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart && !outOfStock) {
      addItem(product);
    }
  };

  return (
    <Link href={`/produto/${product.slug}`} className="card group block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
            <FiShoppingCart className="text-secondary-400 text-4xl" />
          </div>
        )}
        <span className="absolute top-3 left-3 badge bg-white/90 text-secondary-500 font-medium text-xs">
          {typeLabels[product.product_type] || 'Produto'}
        </span>
        {outOfStock && (
          <span className="absolute top-3 right-3 badge bg-red-500 text-white text-xs">Esgotado</span>
        )}
        {hasDiscount && !outOfStock && (
          <span className="absolute top-3 right-3 badge bg-green-500 text-white text-xs">Oferta</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-secondary-600 transition-colors">
          {product.name}
        </h3>
        {product.category && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through mr-2">
                {formatPrice(product.original_price!)}
              </span>
            )}
            <span className="text-lg font-bold text-secondary-500">
              {formatPrice(product.price)}
            </span>
          </div>
          {!outOfStock && (
            <button
              onClick={handleAddToCart}
              className={`p-2 rounded-lg transition-colors ${
                inCart
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/50'
              }`}
              title={inCart ? 'Já está no carrinho' : 'Adicionar ao carrinho'}
            >
              {inCart ? <FiCheck className="text-lg" /> : <FiShoppingCart className="text-lg" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
