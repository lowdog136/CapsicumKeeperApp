import { useQuasar } from 'quasar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  message: string;
  type?: NotificationType;
  icon?: string;
  timeout?: number;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  actions?: Array<{ label: string; color?: string; handler: () => void }>;
}

/**
 * Упрощенная система уведомлений
 * Устраняет дублирование кода уведомлений по всему приложению
 */
export function useNotifications() {
  const $q = useQuasar();

  const defaultConfig = {
    success: {
      color: 'positive',
      icon: 'check_circle',
      timeout: 3000,
    },
    error: {
      color: 'negative',
      icon: 'error',
      timeout: 5000,
    },
    warning: {
      color: 'warning',
      icon: 'warning',
      timeout: 4000,
    },
    info: {
      color: 'info',
      icon: 'info',
      timeout: 3000,
    },
  };

  /**
   * Показывает уведомление
   */
  const notify = (options: NotificationOptions): void => {
    const type = options.type || 'info';
    const config = defaultConfig[type];

    $q.notify({
      message: options.message,
      color: config.color,
      icon: options.icon || config.icon,
      timeout: options.timeout ?? config.timeout,
      position: options.position || 'top',
      actions: options.actions,
    });
  };

  /**
   * Успешное уведомление
   */
  const success = (message: string, options?: Partial<NotificationOptions>): void => {
    notify({
      ...options,
      message,
      type: 'success',
    });
  };

  /**
   * Уведомление об ошибке
   */
  const error = (message: string, options?: Partial<NotificationOptions>): void => {
    notify({
      ...options,
      message,
      type: 'error',
    });
  };

  /**
   * Предупреждение
   */
  const warning = (message: string, options?: Partial<NotificationOptions>): void => {
    notify({
      ...options,
      message,
      type: 'warning',
    });
  };

  /**
   * Информационное уведомление
   */
  const info = (message: string, options?: Partial<NotificationOptions>): void => {
    notify({
      ...options,
      message,
      type: 'info',
    });
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
  };
}

