// frontend/test/jest.polyfills.ts
// This file runs BEFORE jest.setup.ts to ensure polyfills are available
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'web-streams-polyfill';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Polyfill TextEncoder/TextDecoder
(globalThis as Record<string, unknown>).TextEncoder = TextEncoder;
(globalThis as Record<string, unknown>).TextDecoder = TextDecoder;

// Polyfill Web Streams
(globalThis as Record<string, unknown>).ReadableStream = ReadableStream;
(globalThis as Record<string, unknown>).TransformStream = TransformStream;
(globalThis as Record<string, unknown>).WritableStream = WritableStream;

// Polyfill BroadcastChannel for MSW
class BroadcastChannelPolyfill {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage() {
    // No-op for testing
  }
  close() {
    // No-op for testing
  }
  addEventListener() {
    // No-op for testing
  }
  removeEventListener() {
    // No-op for testing
  }
  dispatchEvent(): boolean {
    return true;
  }
}
(globalThis as Record<string, unknown>).BroadcastChannel = BroadcastChannelPolyfill;

// Mock Vite's import.meta.env and import.meta.glob
(globalThis as Record<string, unknown>).import = {
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
  const filename = fileURLToPath(import.meta.url);
  const directoryName = dirname(filename);
  (globalThis as Record<string, unknown>).__dirname = directoryName;
  (globalThis as Record<string, unknown>).__filename = filename;
}
