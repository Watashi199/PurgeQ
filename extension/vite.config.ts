import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      const manifestSrc = path.resolve(__dirname, 'manifest.json');
      const manifestDest = path.resolve(outDir, 'manifest.json');

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      fs.copyFileSync(manifestSrc, manifestDest);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyManifest()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        background: path.resolve(__dirname, 'src/background/service-worker.ts'),
        content: path.resolve(__dirname, 'src/content/content-script.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
