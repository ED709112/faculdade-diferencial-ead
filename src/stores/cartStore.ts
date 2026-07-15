import { create } from 'zustand';

interface CartProduct {
  id: number;
  name: string;
  slug: string;
  image?: string;
  price: number;
  original_price?: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartProduct[];
  addItem: (product: Omit<CartProduct, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const { items } = get();
    const exists = items.find((i) => i.id === product.id);
    if (exists) return;
    set({ items: [...items, { ...product, quantity: 1 }] });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) return get().removeItem(productId);
    set({
      items: get().items.map((i) =>
        i.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  isInCart: (productId) => get().items.some((i) => i.id === productId),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
