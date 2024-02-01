import { UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/..
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

  optimizeDeps: {
    include: ['tsconfig.json'],
  },
  resolve: {
    alias: {      
      '@alisa-backend': path.resolve(__dirname, '../backend/src'),      
      '@alisa-lib': path.resolve(__dirname, './src/lib'),
    },
  },
  
}) as UserConfig
