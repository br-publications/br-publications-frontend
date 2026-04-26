import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import prerender from '@prerenderer/rollup-plugin'

// https://vite.dev/config/
// NOTE: sitemap.xml is generated dynamically by the Express backend (sitemapRoutes.ts).
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
    // Fetch top 20 books for prerendering (so Google sees their content instantly)
    const tbRes = await fetch('https://api.brpublications.com/api/books?limit=20');
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
    console.warn('Failed to fetch dynamic routes for prerendering:', error);
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      prerender({
        routes: routes,
        renderer: '@prerenderer/renderer-puppeteer',
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
            'mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
            // Separate chunk for icons — very large, only needed on admin/dashboard pages
            'mui-icons': ['@mui/icons-material'],
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
