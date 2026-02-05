
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base paths so the app works on any GitHub Pages URL
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
