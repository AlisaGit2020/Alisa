// frontend/test/msw/server.ts
import { setupServer } from 'msw/node';

// Create MSW server with no default handlers
// Tests will add their own handlers as needed
export const server = setupServer();

// Configure server to log unhandled requests in development
if (process.env.NODE_ENV === 'test') {
  server.events.on('request:unhandled', ({ request }) => {
    console.warn('Unhandled %s %s', request.method, request.url);
  });
}
