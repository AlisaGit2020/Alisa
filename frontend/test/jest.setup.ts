// frontend/test/jest.setup.ts
require('reflect-metadata');

// Polyfill TextEncoder/TextDecoder for Node environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Polyfill fetch for MSW
import 'whatwg-fetch';

// MSW server setup is only needed for tests that make API calls
// For now, we skip MSW initialization to avoid ESM compatibility issues
// Tests that need MSW will import and set it up manually

