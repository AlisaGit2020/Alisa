import { Injectable } from '@nestjs/common';

/**
 * Service to track pending async event operations.
 * Used to ensure all event handlers complete before application shutdown.
 */
@Injectable()
export class EventTrackerService {
  private pendingCount = 0;

  /**
   * Increment the pending operation count.
   * Call at the start of an async event handler.
   */
  increment(): void {
    this.pendingCount++;
  }

  /**
   * Decrement the pending operation count.
   * Call when an async event handler completes (in finally block).
   */
  decrement(): void {
    this.pendingCount--;
  }

  /**
   * Get the current count of pending operations.
   */
  getPendingCount(): number {
    return this.pendingCount;
  }

  /**
   * Wait for all pending operations to complete.
   * @param timeout Maximum time to wait in milliseconds (default 5000ms)
   * @returns Promise that resolves when all operations complete or timeout is reached
   */
  async waitForPending(timeout = 5000): Promise<void> {
    const start = Date.now();
    while (this.pendingCount > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}
