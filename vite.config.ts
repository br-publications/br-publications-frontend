import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes rarely, long cache life
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          // MUI is large — isolate it so one change doesn't bust the entire bundle
          'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
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
})
