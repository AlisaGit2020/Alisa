import { UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  
}) as UserConfig
