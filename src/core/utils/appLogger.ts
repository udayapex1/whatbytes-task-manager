type LogDetails = Record<string, boolean | number | string | undefined>;

const isDevelopment = __DEV__;

const getErrorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string') return code;
  }

  if (error instanceof Error) return error.name;
  return 'unknown_error';
};

const write = (
  level: 'info' | 'warn',
  action: string,
  details?: LogDetails,
): void => {
  if (!isDevelopment) return;

  const message = `[TaskFlow] ${action}`;
  if (level === 'warn') {
    console.warn(message, details ?? '');
  } else {
    console.info(message, details ?? '');
  }
};

export const appLogger = {
  action: (action: string, details?: LogDetails): void =>
    write('info', action, details),
  success: (action: string, details?: LogDetails): void =>
    write('info', `${action}.success`, details),
  failure: (action: string, error: unknown): void =>
    write('warn', `${action}.failure`, { code: getErrorCode(error) }),
};
