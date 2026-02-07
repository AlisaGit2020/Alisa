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
    // No 'apply' restriction - runs in both dev and build for consistency
    resolveId(source, importer) {
      // Always stub typeorm
      if (alwaysStub.includes(source)) {
        return `\0stub:${source}`;
      }
      // Stub class-validator/class-transformer only when imported from backend
      if (stubFromBackend.includes(source) && importer?.includes('/backend/')) {
        return `\0stub:${source}`;
      }
    },
    load(id) {
      if (id.startsWith('\0stub:')) {
        // Create explicit no-op exports for decorators and functions.
        // These are the commonly used exports from class-validator/class-transformer.
        return `
          const noop = () => () => {};
          const noopFn = () => {};

          // class-validator decorators
          export const IsNotEmpty = noop;
          export const IsString = noop;
          export const IsNumber = noop;
          export const IsInt = noop;
          export const IsOptional = noop;
          export const IsArray = noop;
          export const IsBoolean = noop;
          export const IsDate = noop;
          export const IsEmail = noop;
          export const Min = noop;
          export const Max = noop;
          export const MinLength = noop;
          export const MaxLength = noop;
          export const ValidateNested = noop;
          export const IsEnum = noop;
          export const ArrayMinSize = noop;
          export const ArrayMaxSize = noop;

          // class-validator functions (should not be called from backend)
          export const validate = () => Promise.resolve([]);
          export const validateSync = () => [];
          export class ValidationError {}

          // class-transformer decorators
          export const Type = noop;
          export const Transform = noop;
          export const Exclude = noop;
          export const Expose = noop;
          export const plainToInstance = (cls, obj) => obj;
          export const instanceToPlain = (obj) => obj;
          export const plainToClass = (cls, obj) => obj;
          export const classToPlain = (obj) => obj;

          // typeorm decorators
          export const Entity = noop;
          export const Column = noop;
          export const PrimaryGeneratedColumn = noop;
          export const PrimaryColumn = noop;
          export const ManyToOne = noop;
          export const OneToMany = noop;
          export const OneToOne = noop;
          export const ManyToMany = noop;
          export const JoinColumn = noop;
          export const JoinTable = noop;
          export const CreateDateColumn = noop;
          export const UpdateDateColumn = noop;
          export const DeleteDateColumn = noop;
          export const Index = noop;
          export const Unique = noop;
          export const Check = noop;
          export const BeforeInsert = noop;
          export const AfterInsert = noop;
          export const BeforeUpdate = noop;
          export const AfterUpdate = noop;
          export const Repository = class {};
          export const DataSource = class {};

          export default {};
        `;
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
