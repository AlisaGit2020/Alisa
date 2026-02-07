import { UserConfig, defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Stub backend-only dependencies when imported from backend source files.
// The frontend imports backend DTOs/entities for TypeScript types, but the
// decorators cause runtime errors in the production bundle due to Rollup's
// module ordering. We stub these imports ONLY from /backend/ paths, while
// allowing frontend code to use the real libraries for validation.
function stubBackendDeps(): Plugin {
  // Always stub typeorm (frontend never uses it)
  const alwaysStub = ['typeorm'];
  // Stub these only when imported from backend source files
  const stubFromBackend = ['class-validator', 'class-transformer'];

  return {
    name: 'stub-backend-deps',
    apply: 'build',
    resolveId(source, importer) {
      // Always stub typeorm
      if (alwaysStub.includes(source)) {
        return { id: `\0stub:${source}`, syntheticNamedExports: 'default' };
      }
      // Stub class-validator/class-transformer only when imported from backend
      if (stubFromBackend.includes(source) && importer?.includes('/backend/')) {
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
