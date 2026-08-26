export type AppErrorCode =
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK'
  | 'DATABASE'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(message: string, code: AppErrorCode = 'UNKNOWN', cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export function toAppError(error: unknown, fallbackMessage = 'Ocorreu um erro inesperado.'): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, 'UNKNOWN', error);
  return new AppError(fallbackMessage, 'UNKNOWN', error);
}
