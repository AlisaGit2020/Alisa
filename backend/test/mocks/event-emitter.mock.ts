import { EventEmitter2 } from '@nestjs/event-emitter';

export type MockEventEmitter = Partial<Record<keyof EventEmitter2, jest.Mock>>;

export const createMockEventEmitter = (): MockEventEmitter => ({
  emit: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
});
