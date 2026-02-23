import { UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 8080
  },
  esbuild: {
    target: 'esnext'
  },
  build: {
    // Disable source maps to reduce memory usage during build
    sourcemap: false,
    // Reduce memory by limiting concurrent transforms
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['tsconfig.json'],
  },
  resolve: {
    alias: {
      '@asset-lib': path.resolve(__dirname, './src/lib'),
      '@asset-types': path.resolve(__dirname, './src/types'),
      '@asset-mocks': path.resolve(__dirname, './test/mocks'),
    },
  },

}) as UserConfig
