import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'data-importer/react': path.resolve(__dirname, '../../packages/data-importer/src/react.ts'),
      'data-importer': path.resolve(__dirname, '../../packages/data-importer/src/index.ts')
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
