import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function copyStaticAssets() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      const manifestSrc = path.resolve(__dirname, 'manifest.json');
      const manifestDest = path.resolve(outDir, 'manifest.json');
      const popupHtmlSrc = path.resolve(__dirname, 'src/popup/popup.html');
      const popupHtmlDest = path.resolve(outDir, 'popup.html');
      const popupCssSrc = path.resolve(__dirname, 'src/popup/popup.css');
      const popupCssDest = path.resolve(outDir, 'popup.css');
      const imagesSrc = path.resolve(__dirname, 'src/images');
      const imagesDest = path.resolve(outDir, 'images');

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Copy manifest
      fs.copyFileSync(manifestSrc, manifestDest);

      // Copy popup HTML
      if (fs.existsSync(popupHtmlSrc)) {
        fs.copyFileSync(popupHtmlSrc, popupHtmlDest);
        console.log('✓ Copied popup.html');
      }

      // Copy popup CSS
      if (fs.existsSync(popupCssSrc)) {
        fs.copyFileSync(popupCssSrc, popupCssDest);
        console.log('✓ Copied popup.css');
      }

      // Copy images if they exist
      if (fs.existsSync(imagesSrc)) {
        if (!fs.existsSync(imagesDest)) {
          fs.mkdirSync(imagesDest, { recursive: true });
        }
        const files = fs.readdirSync(imagesSrc);
        files.forEach((file) => {
          fs.copyFileSync(
            path.join(imagesSrc, file),
            path.join(imagesDest, file)
          );
        });
        console.log(`✓ Copied ${files.length} images to dist/images`);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyStaticAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,
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
