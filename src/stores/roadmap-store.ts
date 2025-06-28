import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useUserStore } from './user-store';
import type { RoadmapItem } from 'src/components/models';

type RoadmapUpdate = Partial<Omit<RoadmapItem, 'id' | 'createdAt' | 'assignee' | 'updatedAt'>>;

export const useRoadmapStore = defineStore('roadmap', () => {
  const items = ref<RoadmapItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const userStore = useUserStore();

  // Получить все элементы дорожной карты пользователя
  const fetchItems = async () => {
    console.log('=== Начало загрузки элементов дорожной карты ===');

    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      console.error('❌ Пользователь не авторизован при загрузке');
      return;
    }

    console.log('✅ Пользователь авторизован:', userStore.user.email);

    loading.value = true;
    error.value = null;

    try {
      console.log('🗄️ Подключение к Firestore...');

      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      console.log('✅ Firestore подключен, создаем запрос...');

      const q = query(
        collection(db, 'roadmap'),
        where('assignee', '==', userStore.user.email),
        orderBy('createdAt', 'desc'),
      );

      console.log('🔍 Выполняем запрос к коллекции roadmap...');
      const querySnapshot = await getDocs(q);

      console.log('✅ Запрос выполнен, получено документов:', querySnapshot.size);

      items.value = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('📄 Документ:', doc.id, '=>', data);
        return {
          id: doc.id,
          ...data,
        };
      }) as RoadmapItem[];

      console.log('✅ Элементы загружены в локальное состояние:', items.value.length);
    } catch (err) {
      console.error('❌ Ошибка при загрузке дорожной карты:', err);
      console.error('❌ Тип ошибки:', typeof err);
      console.error(
        '❌ Сообщение ошибки:',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      console.error('❌ Стек ошибки:', err instanceof Error ? err.stack : 'Нет стека');

      error.value = `Ошибка при загрузке дорожной карты: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`;
    } finally {
      loading.value = false;
      console.log('=== Конец загрузки элементов дорожной карты ===');
    }
  };

  // Добавить новый элемент
  const addItem = async (item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('=== Начало добавления элемента дорожной карты ===');

    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      console.error('❌ Пользователь не авторизован');
      return null;
    }

    console.log('✅ Пользователь авторизован:', userStore.user.email);
    console.log('📝 Исходный элемент:', item);

    loading.value = true;
    error.value = null;

    try {
      const now = new Date().toISOString();
      const newItem = {
        ...item,
        assignee: userStore.user.email!,
        createdAt: now,
        updatedAt: now,
        // Убираем undefined значения
        targetVersion: item.targetVersion || null,
        notes: item.notes || null,
        estimatedEffort: item.estimatedEffort || null,
      };

      console.log('🔧 Подготовленный элемент для Firestore:', newItem);
      console.log('🗄️ Попытка подключения к Firestore...');

      // Проверяем подключение к Firestore
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      console.log('✅ Firestore подключен, добавляем документ...');

      const docRef = await addDoc(collection(db, 'roadmap'), newItem);
      console.log('✅ Элемент добавлен с ID:', docRef.id);

      const createdItem: RoadmapItem = {
        id: docRef.id,
        ...newItem,
      };

      items.value.unshift(createdItem);
      console.log('✅ Элемент добавлен в локальное состояние');
      console.log('📊 Всего элементов в локальном состоянии:', items.value.length);

      return createdItem;
    } catch (err) {
      console.error('❌ Ошибка при добавлении элемента:', err);
      console.error('❌ Тип ошибки:', typeof err);
      console.error(
        '❌ Сообщение ошибки:',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      console.error('❌ Стек ошибки:', err instanceof Error ? err.stack : 'Нет стека');

      error.value = `Ошибка при добавлении элемента: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`;
      return null;
    } finally {
      loading.value = false;
      console.log('=== Конец добавления элемента дорожной карты ===');
    }
  };

  // Обновить элемент
  const updateItem = async (id: string, updates: RoadmapUpdate) => {
    loading.value = true;
    error.value = null;

    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        targetVersion: updates.targetVersion || null,
        notes: updates.notes || null,
        estimatedEffort: updates.estimatedEffort || null,
      };

      if (updates.status === 'completed' && !updates.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, 'roadmap', id), updateData);

      const index = items.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        const updatedItem = { ...items.value[index] };
        Object.assign(updatedItem, updateData);
        items.value[index] = updatedItem as RoadmapItem;
      }
    } catch (err) {
      console.error('Ошибка при обновлении элемента:', err);
      error.value = 'Ошибка при обновлении элемента';
    } finally {
      loading.value = false;
    }
  };

  // Удалить элемент
  const deleteItem = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await deleteDoc(doc(db, 'roadmap', id));
      items.value = items.value.filter((item) => item.id !== id);
    } catch (err) {
      console.error('Ошибка при удалении элемента:', err);
      error.value = 'Ошибка при удалении элемента';
    } finally {
      loading.value = false;
    }
  };

  // Создать один тестовый элемент
  const createTestItem = async () => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return null;
    }

    const testItem = {
      title: 'Тестовый элемент дорожной карты',
      description: 'Это тестовый элемент для проверки работы дорожной карты',
      category: 'feature' as const,
      priority: 'medium' as const,
      status: 'planned' as const,
      estimatedEffort: 'small' as const,
      targetVersion: '1.0.0',
      notes: 'Тестовые заметки',
    };

    return await addItem(testItem);
  };

  // Создать примеры элементов дорожной карты
  const createSampleItems = async () => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return;
    }

    const sampleItems = [
      // Основные функции приложения
      {
        title: 'Система уведомлений',
        description:
          'Реализовать push-уведомления и email-уведомления для напоминания о поливе, подкормке и уходе за перцами',
        category: 'feature' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.3.0',
        notes: 'Включить настройки частоты уведомлений и возможность отключения',
      },
      {
        title: 'Функция "Добавить в сад"',
        description:
          'Реализовать список сортов, запланированных для посадки, с возможностью отслеживания прогресса',
        category: 'feature' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.2.0',
        notes: 'Связать с библиотекой сортов и добавить статусы посадки',
      },
      {
        title: 'Экспорт данных',
        description: 'Возможность экспортировать данные о перцах в CSV/Excel формате с фильтрами',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.4.0',
        notes: 'Включить выбор полей для экспорта и настройки формата',
      },
      {
        title: 'Импорт данных',
        description: 'Возможность импортировать данные о перцах из CSV/Excel файлов',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.5.0',
        notes: 'Добавить валидацию данных и предварительный просмотр',
      },
      {
        title: 'Календарь посадок',
        description: 'Календарный вид для планирования посадок и отслеживания сезонных работ',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.6.0',
        notes: 'Интеграция с климатическими зонами и рекомендациями по посадке',
      },
      {
        title: 'Статистика и аналитика',
        description: 'Подробная статистика по урожайности, успешности сортов, графики и отчеты',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.7.0',
        notes: 'Включить сравнение сортов, тренды и рекомендации',
      },
      {
        title: 'Социальные функции',
        description: 'Возможность делиться результатами, обмениваться семенами, комментировать',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '2.0.0',
        notes: 'Создать сообщество садоводов-любителей перцев',
      },
      {
        title: 'Мобильное приложение',
        description: 'Нативное мобильное приложение для iOS и Android',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '2.1.0',
        notes: 'Использовать Capacitor или React Native для разработки',
      },
      {
        title: 'Офлайн режим',
        description:
          'Возможность работы с приложением без интернета с синхронизацией при подключении',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.8.0',
        notes: 'Использовать Service Workers и IndexedDB для кэширования',
      },
      {
        title: 'Система тегов',
        description: 'Добавить возможность тегирования перцев для лучшей организации',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'small' as const,
        targetVersion: '1.9.0',
        notes: 'Пользовательские теги и предустановленные категории',
      },
      {
        title: 'Поиск и фильтры',
        description: 'Улучшить поиск по перцам с расширенными фильтрами и сортировкой',
        category: 'improvement' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.2.0',
        notes: 'Добавить поиск по описанию, датам, сортам',
      },
      {
        title: 'Множественное редактирование',
        description: 'Возможность редактировать несколько перцев одновременно',
        category: 'improvement' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.3.0',
        notes: 'Batch операции для массового обновления',
      },
      {
        title: 'Резервное копирование',
        description: 'Автоматическое резервное копирование данных в облако',
        category: 'feature' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.4.0',
        notes: 'Интеграция с Google Drive, Dropbox или собственным облаком',
      },
      {
        title: 'Восстановление данных',
        description: 'Функция восстановления данных из резервных копий',
        category: 'feature' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.4.0',
        notes: 'Предварительный просмотр изменений перед восстановлением',
      },
      {
        title: 'Система ролей',
        description: 'Добавить роли пользователей (админ, модератор, пользователь)',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '2.0.0',
        notes: 'Управление контентом и модерация пользовательского контента',
      },
      {
        title: 'API для интеграций',
        description: 'Создать REST API для интеграции с другими сервисами',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '2.2.0',
        notes: 'Документация API и примеры интеграций',
      },
      {
        title: 'Интеграция с погодными сервисами',
        description: 'Автоматические рекомендации по уходу на основе погоды',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.6.0',
        notes: 'Интеграция с OpenWeatherMap или подобными сервисами',
      },
      {
        title: 'Система достижений',
        description: 'Геймификация с достижениями за успешное выращивание перцев',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '2.0.0',
        notes: 'Бейджи, уровни, рейтинги среди пользователей',
      },
      {
        title: 'Чат поддержки',
        description: 'Встроенный чат для связи с поддержкой пользователей',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '2.1.0',
        notes: 'Интеграция с Zendesk или подобными сервисами',
      },
      {
        title: 'Многоязычность',
        description: 'Поддержка нескольких языков (английский, испанский, французский)',
        category: 'improvement' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.8.0',
        notes: 'Локализация интерфейса и контента',
      },
      {
        title: 'Темная тема',
        description: 'Добавить темную тему для комфортного использования в вечернее время',
        category: 'ui' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'small' as const,
        targetVersion: '1.3.0',
        notes: 'Автоматическое переключение по времени суток',
      },
      {
        title: 'Улучшить мобильную версию',
        description: 'Оптимизировать интерфейс для мобильных устройств',
        category: 'ui' as const,
        priority: 'high' as const,
        status: 'in-progress' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.2.0',
        notes: 'Добавить свайп-жесты и улучшить навигацию',
      },
      {
        title: 'Исправить баг с загрузкой фото',
        description: 'Исправить проблему с загрузкой фотографий на медленном интернете',
        category: 'bugfix' as const,
        priority: 'critical' as const,
        status: 'completed' as const,
        estimatedEffort: 'small' as const,
        targetVersion: '1.1.1',
        notes: 'Добавить прогресс-бар и обработку ошибок',
      },
      {
        title: 'Оптимизировать запросы к базе данных',
        description: 'Улучшить производительность запросов к Firestore',
        category: 'backend' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.2.0',
        notes: 'Добавить кэширование и пагинацию',
      },
      {
        title: 'Улучшить безопасность',
        description: 'Добавить двухфакторную аутентификацию и улучшить безопасность',
        category: 'backend' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.5.0',
        notes: '2FA, аудит действий, шифрование чувствительных данных',
      },
      {
        title: 'Система логирования',
        description: 'Добавить подробное логирование для отладки и мониторинга',
        category: 'backend' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.6.0',
        notes: 'Интеграция с Sentry или подобными сервисами',
      },
      {
        title: 'Автоматические тесты',
        description: 'Добавить unit и integration тесты для повышения качества кода',
        category: 'backend' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        estimatedEffort: 'large' as const,
        targetVersion: '1.7.0',
        notes: 'Jest для unit тестов, Cypress для e2e тестов',
      },
      {
        title: 'CI/CD пайплайн',
        description: 'Настроить автоматическое развертывание и тестирование',
        category: 'backend' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.8.0',
        notes: 'GitHub Actions для автоматического деплоя',
      },
    ];

    loading.value = true;
    error.value = null;

    try {
      for (const item of sampleItems) {
        await addItem(item);
      }
    } catch (err) {
      console.error('Ошибка при создании примеров:', err);
      error.value = 'Ошибка при создании примеров';
    } finally {
      loading.value = false;
    }
  };

  // Вычисляемые свойства для фильтрации
  const plannedItems = computed(() => items.value.filter((item) => item.status === 'planned'));

  const inProgressItems = computed(() =>
    items.value.filter((item) => item.status === 'in-progress'),
  );

  const completedItems = computed(() => items.value.filter((item) => item.status === 'completed'));

  const highPriorityItems = computed(() =>
    items.value.filter((item) => item.priority === 'high' || item.priority === 'critical'),
  );

  // Статистика
  const stats = computed(() => ({
    total: items.value.length,
    planned: plannedItems.value.length,
    inProgress: inProgressItems.value.length,
    completed: completedItems.value.length,
    highPriority: highPriorityItems.value.length,
  }));

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    createTestItem,
    createSampleItems,
    plannedItems,
    inProgressItems,
    completedItems,
    highPriorityItems,
    stats,
  };
});
