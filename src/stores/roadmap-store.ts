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
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useUserStore } from './user-store';
import type { RoadmapItem } from 'src/components/models';

type RoadmapUpdate = Omit<RoadmapItem, 'id' | 'createdAt' | 'assignee' | 'updatedAt'>;

export const useRoadmapStore = defineStore('roadmap', () => {
  const items = ref<RoadmapItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  // Пагинация
  const currentPage = ref(1);
  const itemsPerPage = ref(12);
  const totalPages = computed(() => Math.ceil(items.value.length / itemsPerPage.value));

  const userStore = useUserStore();

  // Получить все элементы дорожной карты пользователя
  const fetchItems = async () => {
    console.log('=== Начало загрузки элементов дорожной карты ===');

    loading.value = true;
    error.value = null;

    try {
      console.log('🗄️ Подключение к Firestore...');

      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      console.log('✅ Firestore подключен, создаем запрос...');

      // Отписываемся от предыдущего слушателя, если он есть
      if (unsubscribe) {
        console.log('🔄 Отписываемся от предыдущего слушателя');
        unsubscribe();
        unsubscribe = null;
      }

      // Создаем запрос для всех элементов дорожной карты (публичная дорожная карта)
      const q = query(
        collection(db, 'roadmap'),
        orderBy('createdAt', 'desc'), // Сортируем по дате создания
      );

      console.log('🔍 Подписываемся на изменения коллекции roadmap (все элементы)...');

      // Подписываемся на изменения в реальном времени
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log('✅ Получены изменения, документов:', querySnapshot.size);
          console.log('🔄 Тип изменений: onSnapshot callback вызван');

          const newItems = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            console.log('📄 Документ:', doc.id, '=>', data);
            return {
              id: doc.id,
              ...data,
            };
          }) as RoadmapItem[];

          console.log('🔄 Старое количество элементов:', items.value.length);
          console.log('🔄 Новое количество элементов:', newItems.length);
          console.log(
            '🔄 Элементы изменились:',
            JSON.stringify(items.value) !== JSON.stringify(newItems),
          );

          items.value = newItems;

          console.log('✅ Элементы обновлены в локальном состоянии:', items.value.length);
          loading.value = false;
        },
        (err) => {
          console.error('❌ Ошибка при получении изменений:', err);
          error.value = `Ошибка при получении изменений: ${err.message}`;
          loading.value = false;
        },
      );

      console.log('✅ Подписка на изменения установлена');
    } catch (err) {
      console.error('❌ Ошибка при настройке подписки:', err);
      console.error('❌ Тип ошибки:', typeof err);
      console.error(
        '❌ Сообщение ошибки:',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      console.error('❌ Стек ошибки:', err instanceof Error ? err.stack : 'Нет стека');

      error.value = `Ошибка при настройке подписки: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`;
      loading.value = false;
    }

    console.log('=== Конец настройки подписки на элементы дорожной карты ===');
  };

  // Добавить новый элемент
  const addItem = async (item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('=== Начало добавления элемента дорожной карты ===');

    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      console.error('❌ Пользователь не авторизован');
      return null;
    }

    // Проверяем права на редактирование
    if (userStore.user.email !== 'lowdog136@gmail.com') {
      error.value = 'У вас нет прав на добавление элементов дорожной карты';
      console.error('❌ Пользователь не имеет прав на редактирование:', userStore.user.email);
      return null;
    }

    console.log(
      '✅ Пользователь авторизован и имеет права на редактирование:',
      userStore.user.email,
    );
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

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
      console.log('✅ Элемент добавлен в Firestore, локальное состояние обновится автоматически');

      const createdItem: RoadmapItem = {
        id: docRef.id,
        ...newItem,
      };

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
    console.log('=== Начало обновления элемента дорожной карты ===');
    console.log('🆔 ID элемента:', id);
    console.log('📝 Обновления:', updates);

    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      console.error('❌ Пользователь не авторизован');
      return;
    }

    // Проверяем права на редактирование
    if (userStore.user.email !== 'lowdog136@gmail.com') {
      error.value = 'У вас нет прав на редактирование элементов дорожной карты';
      console.error('❌ Пользователь не имеет прав на редактирование:', userStore.user.email);
      return;
    }

    console.log(
      '✅ Пользователь авторизован и имеет права на редактирование:',
      userStore.user.email,
    );

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

      console.log('🔧 Подготовленные данные для обновления:', updateData);
      console.log('🗄️ Попытка подключения к Firestore...');

      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      console.log('✅ Firestore подключен, обновляем документ...');

      await updateDoc(doc(db, 'roadmap', id), updateData);
      console.log('✅ Элемент обновлен в Firestore, локальное состояние обновится автоматически');

      // Временное принудительное обновление локального состояния
      const updatedItemIndex = items.value.findIndex((item) => item.id === id);
      if (updatedItemIndex !== -1) {
        console.log('🔄 Принудительно обновляем локальное состояние...');
        const item = items.value[updatedItemIndex];
        if (item) {
          item.title = updateData.title;
          item.description = updateData.description;
          item.category = updateData.category;
          item.priority = updateData.priority;
          item.status = updateData.status;
          item.estimatedEffort = updateData.estimatedEffort;
          item.targetVersion = updateData.targetVersion;
          item.notes = updateData.notes;
          item.updatedAt = updateData.updatedAt;
          if (updateData.completedAt) {
            item.completedAt = updateData.completedAt;
          }
          console.log('✅ Локальное состояние обновлено принудительно');
        }
      } else {
        console.log('⚠️ Элемент не найден в локальном состоянии для принудительного обновления');
      }

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
    } catch (err) {
      console.error('❌ Ошибка при обновлении элемента:', err);
      console.error('❌ Тип ошибки:', typeof err);
      console.error(
        '❌ Сообщение ошибки:',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      console.error('❌ Стек ошибки:', err instanceof Error ? err.stack : 'Нет стека');

      error.value = `Ошибка при обновлении элемента: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`;
    } finally {
      loading.value = false;
      console.log('=== Конец обновления элемента дорожной карты ===');
    }
  };

  // Удалить элемент
  const deleteItem = async (id: string) => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return;
    }

    // Проверяем права на редактирование
    if (userStore.user.email !== 'lowdog136@gmail.com') {
      error.value = 'У вас нет прав на удаление элементов дорожной карты';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      await deleteDoc(doc(db, 'roadmap', id));
      console.log('✅ Элемент удален из Firestore, локальное состояние обновится автоматически');

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
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
      assignee: userStore.user.email!,
      targetVersion: null,
      notes: 'Тестовый элемент',
      estimatedEffort: null,
    };

    return await addItem(testItem);
  };

  // Отладочная функция для проверки всех документов
  const debugAllItems = async () => {
    console.log('=== DEBUG: Проверка всех документов в коллекции roadmap ===');

    try {
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      const { collection, getDocs } = await import('firebase/firestore');

      // Получаем все документы без фильтров
      const querySnapshot = await getDocs(collection(db, 'roadmap'));

      console.log('📊 Всего документов в коллекции roadmap:', querySnapshot.size);

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Документ ID:', doc.id);
        console.log('📄 Данные:', data);
        console.log('📄 assignee:', data.assignee);
        console.log('📄 Текущий пользователь:', userStore.user?.email);
        console.log('---');
      });
    } catch (error) {
      console.error('❌ Ошибка при отладке:', error);
    }
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

  // Пагинация
  const paginatedItems = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    return items.value.slice(startIndex, endIndex);
  });

  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);

  // Методы пагинации
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++;
    }
  };

  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--;
    }
  };

  const goToFirstPage = () => {
    currentPage.value = 1;
  };

  const goToLastPage = () => {
    currentPage.value = totalPages.value;
  };

  // Метод для сброса состояния
  const reset = () => {
    // Отписываемся от слушателя, если он есть
    if (unsubscribe) {
      console.log('🔄 Отписываемся от слушателя при сбросе');
      unsubscribe();
      unsubscribe = null;
    }

    items.value = [];
    loading.value = false;
    error.value = null;
    currentPage.value = 1; // Сбрасываем на первую страницу
  };

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
    debugAllItems,
    reset,
    // Пагинация
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
  };
});
