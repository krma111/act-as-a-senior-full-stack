export class OperationTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = "OperationTimeoutError";
  }
}

export function withTimeout<T = any>(operation: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new OperationTimeoutError(label, ms)), ms);
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
