export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

const write = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const payload = context && Object.keys(context).length ? context : undefined;
  if (level === 'error') console.error(`[HOTEL-OS] ${message}`, payload ?? '');
  else if (level === 'warn') console.warn(`[HOTEL-OS] ${message}`, payload ?? '');
  else if (level === 'debug') console.debug(`[HOTEL-OS] ${message}`, payload ?? '');
  else console.info(`[HOTEL-OS] ${message}`, payload ?? '');
};

export const logger: Logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
};
