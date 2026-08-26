import { redact } from '../security/redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  critical(message: string, context?: Record<string, unknown>): void;
}

const write = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const payload = context && Object.keys(context).length ? redact(context) : undefined;
  const prefix = `[HOTEL-OS][${level.toUpperCase()}]`;
  if (level === 'critical' || level === 'error') console.error(prefix, message, payload ?? '');
  else if (level === 'warn') console.warn(prefix, message, payload ?? '');
  else if (level === 'debug') console.debug(prefix, message, payload ?? '');
  else console.info(prefix, message, payload ?? '');
};

export const logger: Logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
  critical: (message, context) => write('critical', message, context),
};
