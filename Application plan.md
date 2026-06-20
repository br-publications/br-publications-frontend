# React + Next.js SSR Application with BFF Layer

> A production-ready React application using Next.js as the SSR engine and Backend-for-Frontend (BFF) layer. All backend API communication is handled server-side — secrets never reach the browser. Public pages are server-rendered for full SEO coverage.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project Setup — Step by Step](#4-project-setup--step-by-step)
5. [Full Project Structure](#5-full-project-structure)
6. [Environment Variables](#6-environment-variables)
7. [Core Concepts Explained](#7-core-concepts-explained)
8. [Code Patterns with Examples](#8-code-patterns-with-examples)
9. [Routing Guide](#9-routing-guide)
10. [SEO Setup](#10-seo-setup)
11. [Authentication Flow](#11-authentication-flow)
12. [State Management](#12-state-management)
13. [Running the App](#13-running-the-app)
14. [Deployment](#14-deployment)
15. [Folder-by-Folder Reference](#15-folder-by-folder-reference)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  BROWSER                        │
│   React hydrates here — interactive UI          │
│   Client Components  │  React Query / SWR       │
└──────────┬───────────┴──────────┬───────────────┘
           │ First load (SSR)     │ Client fetches
           ▼                      ▼
┌─────────────────────────────────────────────────┐
│         NEXT.JS SERVER  (Node.js)               │
│                                                 │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Server Components│  │   API Routes /api/*  │  │
│  │ Fetch data direct│  │   BFF — hides secrets│  │
│  │ Zero JS to client│  │   Auth, cache, xform │  │
│  └─────────────────┘  └──────────────────────┘  │
│                                                 │
│  middleware.ts — JWT auth, route protection     │
└──────────────────────┬──────────────────────────┘
                       │ Server-to-server (secrets safe)
                       ▼
┌─────────────────────────────────────────────────┐
│           BACKEND APIs                          │
│   REST  │  GraphQL  │  Microservices            │
│   (Never directly called from browser)          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              DATA LAYER                         │
│   PostgreSQL  │  MongoDB  │  Redis cache        │
└─────────────────────────────────────────────────┘
```

**Key rule:** The browser only ever talks to Next.js (`/api/*` routes). Your real backend URL and API keys live in `.env.local` and never leave the server.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI framework | React 18+ | Component model, hooks, JSX |
| SSR / BFF | Next.js 14+ (App Router) | Server rendering, API routes, routing |
| Styling | Tailwind CSS | Utility-first CSS |
| Server state | TanStack Query (React Query) | Client-side data fetching & caching |
| Global state | Zustand | Lightweight client state |
| Auth | next-auth / jose | Session management, JWT |
| TypeScript | TypeScript 5 | Type safety across the whole app |
| HTTP client | Native fetch (server) + Axios (client) | API calls |

---

## 3. Prerequisites

Make sure these are installed before starting:

```bash
node --version    # v18.17.0 or higher
npm --version     # v9+ or use pnpm / yarn
git --version     # any recent version
```

Install Node via [https://nodejs.org](https://nodejs.org) or use `nvm`:

```bash
nvm install 20
nvm use 20
```

---

## 4. Project Setup — Step by Step

### Step 1 — Bootstrap the Next.js app

```bash
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd my-app
```

When prompted, select:
- TypeScript → **Yes**
- ESLint → **Yes**
- Tailwind CSS → **Yes**
- `src/` directory → **Yes**
- App Router → **Yes**
- Import alias → `@/*`

### Step 2 — Install additional dependencies

```bash
# Data fetching & state
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install axios

# Auth
npm install next-auth@beta
npm install jose

# Utilities
npm install clsx tailwind-merge
npm install zod                        # schema validation
npm install server-only                # prevent server code leaking to client

# Dev tools
npm install -D @types/node
```

### Step 3 — Create the folder structure

Run this script to scaffold all folders and placeholder files at once:

```bash
mkdir -p src/app/api/auth \
         src/app/api/products \
         src/app/products \
         src/app/"(auth)"/login \
         src/app/"(dashboard)"/dashboard \
         src/components/ui \
         src/components/layout \
         src/components/features/products \
         src/lib \
         src/hooks \
         src/store \
         src/types \
         src/config

touch src/middleware.ts \
      src/lib/api.ts \
      src/lib/auth.ts \
      src/lib/utils.ts \
      src/types/index.ts \
      src/config/constants.ts \
      src/store/useAppStore.ts
```

### Step 4 — Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local` (see [Environment Variables](#6-environment-variables) section).

### Step 5 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Next.js welcome page.

---

## 5. Full Project Structure

```
my-app/
│
├── src/
│   │
│   ├── app/                              # Next.js App Router root
│   │   │
│   │   ├── layout.tsx                   # Root layout — wraps every page
│   │   ├── page.tsx                     # Home page (Server Component, SSR)
│   │   ├── loading.tsx                  # Global loading UI (Suspense boundary)
│   │   ├── error.tsx                    # Global error boundary
│   │   ├── not-found.tsx                # 404 page
│   │   ├── globals.css                  # Global styles + Tailwind imports
│   │   │
│   │   ├── api/                         # ── BFF API Routes (server only) ──
│   │   │   ├── auth/
│   │   │   │   └── route.ts             # POST /api/auth  — login / logout
│   │   │   ├── products/
│   │   │   │   ├── route.ts             # GET  /api/products  — list
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts         # GET  /api/products/:id — detail
│   │   │   └── user/
│   │   │       └── route.ts             # GET  /api/user  — current user
│   │   │
│   │   ├── products/                    # ── Public SSR pages (SEO) ──
│   │   │   ├── page.tsx                 # /products  — server rendered list
│   │   │   ├── loading.tsx              # Skeleton while streaming
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # /products/:id  — detail page
│   │   │       └── generateMetadata.ts  # Dynamic SEO metadata per product
│   │   │
│   │   ├── (auth)/                      # Route group — no layout impact
│   │   │   └── login/
│   │   │       └── page.tsx             # /login  — auth page
│   │   │
│   │   └── (dashboard)/                 # Route group — dashboard layout
│   │       ├── layout.tsx               # Dashboard shell (sidebar, header)
│   │       └── dashboard/
│   │           └── page.tsx             # /dashboard  — protected page
│   │
│   ├── components/                      # ── React Components ──
│   │   │
│   │   ├── ui/                          # Primitive / design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx             # Loading placeholders
│   │   │
│   │   ├── layout/                      # App shell components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Providers.tsx            # React Query + Zustand providers
│   │   │
│   │   └── features/                   # Feature-specific components
│   │       └── products/
│   │           ├── ProductCard.tsx      # Pure display component
│   │           ├── ProductList.tsx      # "use client" — filters, pagination
│   │           └── ProductDetail.tsx    # "use client" — add to cart etc.
│   │
│   ├── lib/                             # ── Server-side utilities ──
│   │   ├── api.ts                       # Fetch wrapper — calls real backend
│   │   ├── auth.ts                      # JWT / session helpers
│   │   └── utils.ts                     # Shared utility functions
│   │
│   ├── hooks/                           # ── Custom React hooks (client) ──
│   │   ├── useProducts.ts               # React Query hook for products
│   │   └── useAuth.ts                   # Auth state hook
│   │
│   ├── store/                           # ── Zustand global state ──
│   │   └── useAppStore.ts               # Cart, UI state, user preferences
│   │
│   ├── types/                           # ── TypeScript types ──
│   │   └── index.ts                     # Product, User, ApiResponse types
│   │
│   ├── config/                          # ── App-wide config ──
│   │   └── constants.ts                 # API base URLs, feature flags
│   │
│   └── middleware.ts                    # Edge middleware — auth guard
│
├── public/                              # Static assets (images, fonts, icons)
├── .env.local                           # Secret keys — never commit this
├── .env.example                         # Safe template to commit
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind configuration
├── tsconfig.json                        # TypeScript configuration
└── package.json
```

---

## 6. Environment Variables

**`.env.example`** — commit this file:

```env
# Backend API
BACKEND_URL=https://your-api.com
BACKEND_API_KEY=your-secret-key-here

# Auth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Database (if connecting directly from Next.js)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

**`.env.local`** — never commit this file:

```env
BACKEND_URL=https://api.mycompany.com
BACKEND_API_KEY=sk_live_xxxxxxxxxxxxxxxx
NEXTAUTH_SECRET=Kd9mP2xQvLnR7tYwHjF0sAeIuBoCgZkV
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
```

> All variables without `NEXT_PUBLIC_` prefix are server-only and invisible to the browser. Use `NEXT_PUBLIC_` only for values safe to expose (e.g. `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`).

---

## 7. Core Concepts Explained

### Server Components vs Client Components

| | Server Component | Client Component |
|---|---|---|
| Runs on | Node.js server | Browser (after hydration) |
| Can use | `async/await`, secrets, DB | `useState`, `useEffect`, browser APIs |
| Marker | default (no marker needed) | `"use client"` at top of file |
| Ships JS? | No — zero JS bundle | Yes — included in JS bundle |
| Good for | SEO pages, data fetching | Interactivity, forms, real-time |

### The two data fetching patterns

**Pattern A — Server Component** (best for SEO, first load):
- Page runs on server → fetches backend directly → returns HTML with data already in it
- Google crawls the HTML and sees all content immediately

**Pattern B — Client Component + BFF route** (best for interactivity):
- Page loads → React mounts → component calls `/api/products` → Next.js API route calls real backend → returns data to browser
- Used for filters, pagination, user-triggered actions

---

## 8. Code Patterns with Examples

### `src/lib/api.ts` — server-side fetch wrapper

```typescript
import 'server-only'; // Ensures this file never runs in the browser

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY     = process.env.BACKEND_API_KEY!;

async function backendFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
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
  },
  user: {
    me: (token: string) =>
      backendFetch<User>('/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
```

---

### `src/app/products/page.tsx` — SSR page (Server Component)

```tsx
import { api } from '@/lib/api';
import { Metadata } from 'next';
import ProductCard from '@/components/features/products/ProductCard';

// Static metadata for SEO
export const metadata: Metadata = {
  title: 'All Products | My Store',
  description: 'Browse our full catalogue of products.',
  openGraph: {
    title: 'All Products | My Store',
    description: 'Browse our full catalogue of products.',
  },
};

// This runs on the server — never in the browser
export default async function ProductsPage() {
  const products = await api.products.list();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
```

---

### `src/app/products/[id]/page.tsx` — dynamic SSR page with per-product SEO

```tsx
import { api } from '@/lib/api';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = { params: { id: string } };

// Dynamic metadata — different title/description per product
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await api.products.byId(params.id);
  if (!product) return { title: 'Not Found' };

  return {
    title: `${product.name} | My Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await api.products.byId(params.id);
  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">{product.name}</h1>
      <p className="text-gray-600 mt-2">{product.description}</p>
      <p className="text-2xl font-semibold mt-4">${product.price}</p>
    </div>
  );
}
```

---

### `src/app/api/products/route.ts` — BFF API route

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY     = process.env.BACKEND_API_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Forward query params (category, page, search, etc.)
    const { searchParams } = req.nextUrl;

    const res = await fetch(
      `${BACKEND_URL}/products?${searchParams.toString()}`,
      { headers: { 'x-api-key': API_KEY } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Optional: set cache headers
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

---

### `src/components/features/products/ProductList.tsx` — Client Component

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

async function fetchProducts(category: string) {
  const res = await fetch(`/api/products?category=${category}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function ProductList() {
  const [category, setCategory] = useState('all');

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products', category],
    queryFn: () => fetchProducts(category),
    staleTime: 60_000,  // cache for 60 seconds
  });

  return (
    <div>
      {/* Category filter — interactive, only possible in Client Component */}
      <div className="flex gap-2 mb-6">
        {['all', 'shoes', 'clothing', 'accessories'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm ${
              category === cat
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-red-500">Failed to load products. Try again.</p>
      )}

      {products && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### `src/middleware.ts` — route protection

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/account', '/orders'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtected = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### `src/store/useAppStore.ts` — Zustand global state

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AppStore {
  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
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
```

---

### `src/app/layout.tsx` — root layout with providers

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'My Store',
    template: '%s | My Store',  // Appended to page titles
  },
  description: 'The best store for everything.',
  metadataBase: new URL('https://mystore.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

---

### `src/components/layout/Providers.tsx` — React Query setup

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,       // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

### `src/types/index.ts` — shared TypeScript types

```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
}
```

---

## 9. Routing Guide

Next.js App Router uses the filesystem as the router.

| File path | URL | Notes |
|---|---|---|
| `app/page.tsx` | `/` | Home page |
| `app/products/page.tsx` | `/products` | Product list |
| `app/products/[id]/page.tsx` | `/products/123` | Dynamic route |
| `app/(auth)/login/page.tsx` | `/login` | Route group — no URL segment |
| `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | Route group with own layout |
| `app/api/products/route.ts` | `/api/products` | API endpoint |
| `app/api/products/[id]/route.ts` | `/api/products/123` | Dynamic API endpoint |

**Route Groups** (`(auth)`, `(dashboard)`) let you share layouts across pages without affecting the URL. The parentheses are stripped from the URL.

---

## 10. SEO Setup

### Static metadata (same for all visitors)

```tsx
// app/products/page.tsx
export const metadata = {
  title: 'Products',          // becomes "Products | My Store"
  description: '...',
  openGraph: { ... },
  twitter: { card: 'summary_large_image', ... },
};
```

### Dynamic metadata (different per page)

```tsx
// app/products/[id]/page.tsx
export async function generateMetadata({ params }) {
  const product = await api.products.byId(params.id);
  return {
    title: product.name,
    description: product.description,
  };
}
```

### Static generation for SEO-critical pages

```tsx
// Pre-generate product pages at build time (fastest for SEO)
export async function generateStaticParams() {
  const products = await api.products.list();
  return products.map(p => ({ id: p.id }));
}
```

### Sitemap

```tsx
// app/sitemap.ts
import { api } from '@/lib/api';

export default async function sitemap() {
  const products = await api.products.list();

  return [
    { url: 'https://mystore.com', lastModified: new Date() },
    { url: 'https://mystore.com/products', lastModified: new Date() },
    ...products.map(p => ({
      url: `https://mystore.com/products/${p.id}`,
      lastModified: new Date(p.createdAt),
    })),
  ];
}
```

---

## 11. Authentication Flow

```
1. User submits login form (Client Component)
      ↓
2. POST /api/auth  (Next.js API route)
      ↓
3. Next.js calls real backend: POST https://api.com/auth/login
      ↓
4. Backend returns JWT
      ↓
5. Next.js sets HttpOnly cookie (browser can't read this)
      ↓
6. middleware.ts reads cookie on every protected request
      ↓
7. Redirect to /login if cookie missing
```

```typescript
// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const { token } = await res.json();

  // Set HttpOnly cookie — JavaScript cannot access this
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,  // 7 days
  });

  return response;
}
```

---

## 12. State Management

Use the right tool for the right kind of state:

| State type | Tool | Example |
|---|---|---|
| Server data (cached) | TanStack Query | Products list, user profile |
| Global UI state | Zustand | Cart, sidebar open/closed |
| Local component state | `useState` | Form inputs, toggles |
| URL state | `useSearchParams` | Filters, pagination |
| Form state | React Hook Form | Login, checkout forms |

**Decision rule:** If the state comes from the server, use React Query. If it's purely client-side UI state shared across components, use Zustand. Everything else stays in `useState`.

---

## 13. Running the App

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## 14. Deployment

### Vercel (recommended — zero config for Next.js)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

### Other platforms (Railway, Render, AWS)

Any platform that supports Node.js 18+ can run this app. Build with `npm run build`, start with `npm run start`, and set environment variables in the platform dashboard.

---

## 15. Folder-by-Folder Reference

| Folder / File | What lives here |
|---|---|
| `src/app/` | All pages, layouts, and API routes. This is the Next.js App Router root. |
| `src/app/api/` | BFF layer — every file here runs on the server. Real backend calls go here. |
| `src/components/ui/` | Generic, reusable UI components — Button, Input, Card, Modal. No business logic. |
| `src/components/layout/` | App shell — Header, Footer, Sidebar, Provider wrappers. |
| `src/components/features/` | Feature-specific components grouped by domain (products, cart, auth). |
| `src/lib/` | Server-side helpers marked with `import 'server-only'`. The `api.ts` fetch wrapper lives here. |
| `src/hooks/` | Custom React hooks for the client — wrap React Query calls, handle auth state. |
| `src/store/` | Zustand stores for global client state — cart, UI preferences. |
| `src/types/` | All TypeScript interfaces and types shared across the app. |
| `src/config/` | Constants, feature flags, non-secret config values. |
| `src/middleware.ts` | Runs at the Edge before every request — auth checks, redirects. |
| `.env.local` | Secret API keys and URLs — server-only, never committed to git. |
| `next.config.ts` | Next.js configuration — rewrites, headers, image domains, output mode. |

---

*Generated for React 18 + Next.js 14 App Router + TypeScript. Last updated June 2026.*
