import 'server-only';
import { Product, User } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;

async function backendFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // 'x-api-key': API_KEY, // Mocking API key
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  products: {
    list: (params?: string) =>
      backendFetch<Product[]>(`/products${params ? `?${params}` : ''}`),
    byId: (id: string) =>
      backendFetch<Product>(`/products/${id}`),
    categories: () =>
      backendFetch<string[]>('/products/categories'),
    byCategory: (category: string) =>
      backendFetch<Product[]>(`/products/category/${category}`),
  },
  user: {
    me: (token: string) =>
      backendFetch<User>('/users/1', { // mocked user endpoint
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
