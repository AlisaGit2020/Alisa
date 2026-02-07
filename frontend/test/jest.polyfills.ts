// frontend/test/jest.polyfills.ts
// This file runs BEFORE jest.setup.ts to ensure polyfills are available
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'web-streams-polyfill';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Polyfill TextEncoder/TextDecoder
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

// Polyfill Web Streams
(globalThis as any).ReadableStream = ReadableStream;
(globalThis as any).TransformStream = TransformStream;

// Mock Vite's import.meta.env and import.meta.glob
(globalThis as any).import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3000',
    },
    // Mock glob for translation-loader
    glob: () => ({}),
  },
};

// Polyfill __dirname and __filename for ESM
if (typeof __dirname === 'undefined') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  (globalThis as any).__dirname = __dirname;
  (globalThis as any).__filename = __filename;
}
