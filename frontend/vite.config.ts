import { UserConfig, defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Stub backend-only dependencies (typeorm, class-validator, class-transformer)
// imported transitively through @alisa-backend/* path aliases.
// Frontend only uses TypeScript types from backend entities/DTOs,
// not the decorator runtime, so no-op stubs are sufficient.
function stubBackendDeps(): Plugin {
  const deps = ['typeorm', 'class-validator', 'class-transformer'];
  return {
    name: 'stub-backend-deps',
    apply: 'build',
    resolveId(source) {
      if (deps.includes(source)) {
        return { id: `\0stub:${source}`, syntheticNamedExports: 'default' };
      }
    },
    load(id) {
      if (id.startsWith('\0stub:')) {
        return 'export default new Proxy({}, { get: () => () => () => {} });';
      }
    }
  };
}

// https://vitejs.dev/config/..
export default defineConfig({
  plugins: [react(), stubBackendDeps()],
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
      '@alisa-mocks': path.resolve(__dirname, './test/mocks'),
    },
  },
  
}) as UserConfig
