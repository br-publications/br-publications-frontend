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
            // 1. Add the book landing page route (slug-based)
            const slug = generateUniqueSlug(item.isbn, item.releaseDate);
            routes.push(`/bookchapter/${item.id}/${slug}`);

            // 2. Add individual chapter routes (/book/:id/chapter/:num)
            // We check both relational 'chapters' and legacy 'tableContents' JSON
            let chapterEntries = [];
            if (Array.isArray(item.chapters) && item.chapters.length > 0) {
              chapterEntries = item.chapters;
            } else if (item.tableContents) {
              try {
                chapterEntries = typeof item.tableContents === 'string'
                  ? JSON.parse(item.tableContents)
                  : item.tableContents;
              } catch (e) { chapterEntries = []; }
            }

            if (Array.isArray(chapterEntries)) {
              chapterEntries.forEach((ch: any, idx: number) => {
                // Ensure we use the exact same padding logic as ChapterDetail.tsx (padStart 2)
                const rawNum = ch.chapterNumber || (idx + 1);
                const chNum = String(rawNum).padStart(2, '0');
                routes.push(`/book/${item.id}/chapter/${chNum}`);
              });
            }
          }
        });
      }
    }
  } catch (e) { console.warn('Book chapters fetch failed:', e); }

  try {
    // Fetch authors for pre-rendering — so Google sees real author metadata, not a JS shell
    const authRes = await fetch('https://api.brpublications.com/api/book-chapter-publishing/authors?limit=500');
    if (authRes.ok) {
      const json = (await authRes.json()) as any;
      const list = json.data || json.authors || [];
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          if (item?.id) routes.push(`/author/${item.id}`);
        });
        console.log(`Queued ${list.length} author routes for pre-rendering`);
      }
    }
  } catch (e) { console.warn('Authors fetch failed:', e); }

  try {
    // Fetch editors for pre-rendering — so Google sees real editor metadata, not a JS shell
    const edRes = await fetch('https://api.brpublications.com/api/book-chapter-publishing/editors?limit=500');
    if (edRes.ok) {
      const json = (await edRes.json()) as any;
      const list = json.data || json.editors || [];
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          if (item?.id) routes.push(`/editor/${item.id}`);
        });
        console.log(`Queued ${list.length} editor routes for pre-rendering`);
      }
    }
  } catch (e) { console.warn('Editors fetch failed:', e); }

  return {
    plugins: [
      react(),
      tailwindcss(),
      prerender({
        routes: routes,
        renderer: new Renderer({
          // Wait for a custom DOM event to guarantee dynamic API data has loaded.
          // This ensures we capture the fully populated metadata instead of loading states.
          renderAfterDocumentEvent: 'prerender-ready',
          timeout: 60000,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
