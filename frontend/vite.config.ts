import { UserConfig, defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Stub typeorm which is imported transitively through @alisa-backend/*
// path aliases. The frontend only uses TypeScript types from backend
// entities, not the ORM runtime. class-validator and class-transformer
// are NOT stubbed because the frontend uses them directly for validation.
function stubBackendDeps(): Plugin {
  const deps = ['typeorm'];
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
      // Force backend source files to resolve these from frontend's node_modules.
      // Without this, imports from /backend/src/ can't find them in Docker
      // because /app/node_modules/ is not an ancestor of /backend/src/.
      'class-validator': path.resolve(__dirname, 'node_modules/class-validator'),
      'class-transformer': path.resolve(__dirname, 'node_modules/class-transformer'),
    },
  },
  
}) as UserConfig
