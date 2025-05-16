import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  publicDir: 'public', // 静的ファイルのディレクトリを指定
  base: './', // ベースURLを相対パスに設定
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 開発サーバーの設定
  optimizeDeps: {
    exclude: ['live2dcubismcore'] // ライブラリの最適化から除外
  }
});
