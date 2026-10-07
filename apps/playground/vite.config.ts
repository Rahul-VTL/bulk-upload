import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'data-importer/styles.css': path.resolve(__dirname, '../../packages/data-importer/src/theme/theme.css'),
      'data-importer/react': path.resolve(__dirname, '../../packages/data-importer/src/react.ts'),
      'data-importer': path.resolve(__dirname, '../../packages/data-importer/src/index.ts')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: false
  }
});
