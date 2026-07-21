'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiArrowLeft, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import PublicLayout from '@/components/layout/PublicLayout';
import toast from 'react-hot-toast';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, total, itemCount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    router.push('/carrinho/checkout');
  };

  return (
    <PublicLayout>
      <div className="container-custom py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FiShoppingCart className="text-2xl text-secondary-500" />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Meu Carrinho</h1>
            {itemCount > 0 && (
              <span className="bg-secondary-100 text-secondary-600 text-sm font-semibold px-3 py-1 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FiShoppingCart className="text-5xl text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
              <p className="text-gray-500 mb-6">Adicione produtos da nossa loja para continuar.</p>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
              >
                <FiArrowLeft />
                Ver Produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                          <FiShoppingCart className="text-secondary-300 text-xl" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      <p className="text-lg font-bold text-secondary-500 mt-1">{formatPrice(item.price)}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        ><FiMinus size={12} /></button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                          disabled={item.quantity >= item.stock}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        ><FiPlus size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}

                <Link
                  href="/produtos"
                  className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                >
                  <FiArrowLeft />
                  Continuar comprando
                </Link>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>

                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate max-w-[160px]">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-medium text-gray-900 shrink-0 ml-2">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-secondary-500">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors disabled:opacity-50 shadow-lg shadow-secondary-500/25"
                  >
                    {loading ? 'Processando...' : 'Finalizar Compra'}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Você precisará fazer login para finalizar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
