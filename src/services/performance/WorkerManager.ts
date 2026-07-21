/**
 * Worker Thread Pool Manager for CPU-Intensive Tasks
 */

export class WorkerManager {
  private maxConcurrency = Math.max(navigator.hardwareConcurrency || 4, 2);

  getMaxConcurrency(): number {
    return this.maxConcurrency;
  }

  async runTask<T>(taskFn: () => Promise<T>): Promise<T> {
    return await taskFn();
  }
}

export const workerManager = new WorkerManager();
