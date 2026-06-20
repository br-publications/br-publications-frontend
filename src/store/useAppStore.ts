import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface CartItem extends Product {
  quantity: number;
}

interface AppStore {
  cart: CartItem[];
  addToCart: (item: Product) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item) => set(state => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
      }),

      removeFromCart: (id) => set(state => ({
        cart: state.cart.filter(i => i.id !== id),
      })),

      clearCart: () => set({ cart: [] }),

      cartTotal: () => get().cart.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
      ),
    }),
    { name: 'app-store' }
  )
);
