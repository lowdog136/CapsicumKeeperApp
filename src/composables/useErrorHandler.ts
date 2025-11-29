import { useQuasar } from 'quasar';

/**
 * Централизованная обработка ошибок
 * Устраняет дублирование кода обработки ошибок по всему приложению
 */
export function useErrorHandler() {
  const $q = useQuasar();

  /**
   * Извлекает сообщение об ошибке из различных типов ошибок
   */
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Неизвестная ошибка';
  };

  /**
   * Обрабатывает ошибку с уведомлением пользователя
   */
  const handleError = (
    error: unknown,
    context?: string,
    options?: {
      showNotification?: boolean;
      logError?: boolean;
    },
  ): string => {
    const message = getErrorMessage(error);
    const fullMessage = context ? `${context}: ${message}` : message;

    // Логирование только в dev режиме
    if (options?.logError !== false && import.meta.env.DEV) {
      console.error('❌ Ошибка', context || '', error);
      if (error instanceof Error && error.stack) {
        console.error('Стек ошибки:', error.stack);
      }
    }

    // Показываем уведомление пользователю
    if (options?.showNotification !== false) {
      $q.notify({
        color: 'negative',
        message: fullMessage,
        icon: 'error',
        timeout: 5000,
      });
    }

    return fullMessage;
  };

  /**
   * Обрабатывает ошибку и устанавливает значение в store
   */
  const handleErrorWithStore = (
    error: unknown,
    errorRef: { value: string | null },
    context?: string,
  ): void => {
    const message = handleError(error, context, { showNotification: false });
    errorRef.value = message;
  };

  /**
   * Обертка для async функций с автоматической обработкой ошибок
   */
  const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    context?: string,
    options?: {
      showNotification?: boolean;
      logError?: boolean;
    },
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, context, options);
      return null;
    }
  };

  return {
    handleError,
    handleErrorWithStore,
    withErrorHandling,
    getErrorMessage,
  };
}

