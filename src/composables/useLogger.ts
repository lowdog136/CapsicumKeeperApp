/**
 * Система логирования с уровнями
 * Устраняет избыточное логирование в production
 */
const isDev = import.meta.env.DEV;

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

/**
 * Создает логгер с контекстом
 */
export function useLogger(context?: string): Logger {
  const prefix = context ? `[${context}]` : '';

  return {
    log: (...args: unknown[]) => {
      if (isDev) {
        console.log(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (isDev) {
        console.info(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (isDev) {
        console.warn(prefix, ...args);
      } else {
        // В production логируем только предупреждения и ошибки
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      // Ошибки всегда логируем
      console.error(prefix, ...args);
    },
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    group: (label: string) => {
      if (isDev) {
        console.group(prefix, label);
      }
    },
    groupEnd: () => {
      if (isDev) {
        console.groupEnd();
      }
    },
  };
}

/**
 * Глобальный логгер
 */
export const logger = useLogger();

