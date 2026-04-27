import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import prerender from '@prerenderer/rollup-plugin'
import Renderer from '@prerenderer/renderer-puppeteer'

// https://vite.dev/config/
// NOTE: sitemap.xml is generated dynamically by the Express backend (sitemapRoutes.ts).
const generateUniqueSlug = (isbn: string, releaseDate?: string): string => {
  const combined = `${isbn}${releaseDate || ''}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  const sixDigit = (positiveHash % 1000000).toString().padStart(6, '0');
  return `uid=${sixDigit}`;
};

export default defineConfig(async () => {
  const routes = [
    '/',
    '/about',
    '/contact',
    '/bookchapters',
    '/bookpublications',
    '/books',
    '/resnova'
  ];

  try {
    // Fetch books for prerendering
    const tbRes = await fetch('https://api.brpublications.com/api/books?limit=100');
    if (tbRes.ok) {
      const json = (await tbRes.json()) as any;
      const list = json.data?.books || json.data || json.books || [];
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          if (item?.id) routes.push(`/book/${item.id}`);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to fetch books for prerendering:', error);
  }

  try {
    // Fetch book chapters for prerendering
    const res = await fetch('https://api.brpublications.com/api/book-chapter-publishing?limit=100');
    if (res.ok) {
      const json = (await res.json()) as any;
      const list = json.data?.chapters || json.data || json.chapters || [];
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          if (item?.id && item?.isbn) {
            const slug = generateUniqueSlug(item.isbn, item.releaseDate);
            routes.push(`/bookchapter/${item.id}/${slug}`);
          }
        });
      }
    }
  } catch (e) { console.warn('Book chapters fetch failed:', e); }

  return {
    plugins: [
      react(),
      tailwindcss(),
      prerender({
        routes: routes,
        renderer: new Renderer({
          // Wait 5s after page load so React has time to mount and render
          renderAfterTime: 5000,
          // Use modern headless Chrome for better JS execution
          headless: true,
          consoleHandler: (route: string, message: any) => {
            console.log(`[Puppeteer ${route}] ${message.type()}: ${message.text()}`);
          }
        }),
        server: {
          port: 5173,
        },
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — changes rarely, long cache life
            'react-core': ['react', 'react-dom', 'react-router-dom'],
            // MUI is large — isolate it so one change doesn't bust the entire bundle
            'mui': ['@mui/material', '@emotion/react', '@emotion/styled', '@mui/icons-material'],
            // Icon library
            'lucide': ['lucide-react'],
            // Charting library — only needed on dashboard pages
            'charts': ['recharts'],
            // Utility libraries
            'utils': ['axios', 'jwt-decode', 'react-hot-toast'],
          }
        }
      }
    }
  };
});
