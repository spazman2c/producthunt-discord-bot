/**
 * Simple retry utility to replace p-retry
 */
export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = 60000,
    randomize = true,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retries) {
        throw lastError;
      }

      const timeout = Math.min(
        minTimeout * Math.pow(factor, attempt),
        maxTimeout
      );

      const delay = randomize
        ? timeout * (0.5 + Math.random() * 0.5)
        : timeout;

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
