import { UserConfig, defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Stub backend-only dependencies in production builds.
// The frontend imports backend DTOs/entities for TypeScript types, but the
// decorators cause runtime errors in the production bundle due to Rollup's
// module ordering. We stub ALL class-validator/class-transformer imports
// in production because:
// 1. Backend DTOs have stubbed decorators (no validation metadata)
// 2. Calling real validate() on DTOs without metadata fails
// 3. Backend validation is mandatory anyway, so frontend validation is optional
function stubBackendDeps(): Plugin {
  // These libraries are always stubbed in production
  const stubInProd = ['typeorm', 'class-validator', 'class-transformer'];

  return {
    name: 'stub-backend-deps',
    apply: 'build', // Only stub in production builds
    resolveId(source) {
      if (stubInProd.includes(source)) {
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
