export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${operation} timed out. Check your connection.`) as Error & {
        code: string;
      };
      error.code = 'app/timeout';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
};
