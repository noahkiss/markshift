import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'src/web',
  base: '/markshift/',
  server: {
    port: 6275,
  },
  preview: {
    port: 6275,
  },
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      // Replace linkedom with empty module for browser builds
      // linkedom is Node-only; browser uses native DOMParser
      linkedom: path.resolve(__dirname, 'src/web/empty-module.ts'),
    },
  },
});
