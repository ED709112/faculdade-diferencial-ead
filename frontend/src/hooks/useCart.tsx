'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  image?: string;
  price: number;
  original_price?: number;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartProduct[];
  addItem: (product: Omit<CartProduct, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('product_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        localStorage.removeItem('product_cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('product_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Omit<CartProduct, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        toast.success('Produto já está no carrinho. Quantidade atualizada.');
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success('Produto adicionado ao carrinho!');
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(p => p.id !== productId));
    toast.success('Produto removido do carrinho.');
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(p => p.id === productId ? { ...p, quantity } : p));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((productId: number) => {
    return items.some(p => p.id === productId);
  }, [items]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, isInCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
