import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  publicDir: 'public', // 静的ファイルのディレクトリ
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
