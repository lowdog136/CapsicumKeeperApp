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
import { useErrorHandler } from 'src/composables/useErrorHandler';
import { useLogger } from 'src/composables/useLogger';

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
  const { handleErrorWithStore } = useErrorHandler();
  const logger = useLogger('RoadmapStore');

  // Получить все элементы дорожной карты пользователя
  const fetchItems = async () => {
    logger.group('Загрузка элементов дорожной карты');
    loading.value = true;
    error.value = null;

    try {
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      // Отписываемся от предыдущего слушателя, если он есть
      if (unsubscribe) {
        logger.log('Отписываемся от предыдущего слушателя');
        unsubscribe();
        unsubscribe = null;
      }

      // Создаем запрос для всех элементов дорожной карты (публичная дорожная карта)
      const q = query(
        collection(db, 'roadmap'),
        orderBy('createdAt', 'desc'), // Сортируем по дате создания
      );

      logger.log('Подписываемся на изменения коллекции roadmap');

      // Подписываемся на изменения в реальном времени
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          logger.log('Получены изменения, документов:', querySnapshot.size);

          const newItems = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
            };
          }) as RoadmapItem[];

          items.value = newItems;
          logger.log('Элементы обновлены в локальном состоянии:', items.value.length);
          loading.value = false;
        },
        (err) => {
          handleErrorWithStore(err, error, 'Ошибка при получении изменений');
          loading.value = false;
        },
      );

      logger.log('Подписка на изменения установлена');
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка при настройке подписки');
      loading.value = false;
    } finally {
      logger.groupEnd();
    }
  };

  // Проверка прав доступа
  const checkEditPermissions = (): boolean => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return false;
    }

    if (userStore.user.email !== 'lowdog136@gmail.com') {
      error.value = 'У вас нет прав на редактирование элементов дорожной карты';
      return false;
    }

    return true;
  };

  // Добавить новый элемент
  const addItem = async (item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    logger.group('Добавление элемента дорожной карты');

    if (!checkEditPermissions()) {
      logger.warn('Пользователь не имеет прав на добавление');
      return null;
    }

    logger.log('Исходный элемент:', item);
    loading.value = true;
    error.value = null;

    try {
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      const now = new Date().toISOString();
      const newItem = {
        ...item,
        assignee: userStore.user!.email!,
        createdAt: now,
        updatedAt: now,
        // Убираем undefined значения
        targetVersion: item.targetVersion || null,
        notes: item.notes || null,
        estimatedEffort: item.estimatedEffort || null,
      };

      logger.log('Подготовленный элемент для Firestore:', newItem);

      const docRef = await addDoc(collection(db, 'roadmap'), newItem);
      logger.log('Элемент добавлен с ID:', docRef.id);

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
      const createdItem: RoadmapItem = {
        id: docRef.id,
        ...newItem,
      };

      return createdItem;
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка при добавлении элемента');
      return null;
    } finally {
      loading.value = false;
      logger.groupEnd();
    }
  };

  // Обновить элемент
  const updateItem = async (id: string, updates: RoadmapUpdate) => {
    logger.group('Обновление элемента дорожной карты');
    logger.log('ID элемента:', id);
    logger.log('Обновления:', updates);

    if (!checkEditPermissions()) {
      logger.warn('Пользователь не имеет прав на обновление');
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

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

      logger.log('Подготовленные данные для обновления:', updateData);

      await updateDoc(doc(db, 'roadmap', id), updateData);
      logger.log('Элемент обновлен в Firestore, локальное состояние обновится автоматически');

      // Временное принудительное обновление локального состояния
      const updatedItemIndex = items.value.findIndex((item) => item.id === id);
      if (updatedItemIndex !== -1) {
        logger.log('Принудительно обновляем локальное состояние');
        const item = items.value[updatedItemIndex];
        if (item) {
          Object.assign(item, {
            title: updateData.title,
            description: updateData.description,
            category: updateData.category,
            priority: updateData.priority,
            status: updateData.status,
            estimatedEffort: updateData.estimatedEffort,
            targetVersion: updateData.targetVersion,
            notes: updateData.notes,
            updatedAt: updateData.updatedAt,
            ...(updateData.completedAt && { completedAt: updateData.completedAt }),
          });
          logger.log('Локальное состояние обновлено принудительно');
        }
      }

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка при обновлении элемента');
    } finally {
      loading.value = false;
      logger.groupEnd();
    }
  };

  // Удалить элемент
  const deleteItem = async (id: string) => {
    logger.group('Удаление элемента дорожной карты');
    logger.log('ID элемента:', id);

    if (!checkEditPermissions()) {
      logger.warn('Пользователь не имеет прав на удаление');
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      if (!db) {
        throw new Error('Firestore не инициализирован');
      }

      await deleteDoc(doc(db, 'roadmap', id));
      logger.log('Элемент удален из Firestore, локальное состояние обновится автоматически');

      // Не обновляем локальное состояние вручную - это сделает onSnapshot
    } catch (err) {
      handleErrorWithStore(err, error, 'Ошибка при удалении элемента');
    } finally {
      loading.value = false;
      logger.groupEnd();
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
    console.log('=== Начало создания примеров элементов дорожной карты ===');

    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      console.error('❌ Пользователь не авторизован');
      return;
    }

    // Проверяем права на редактирование
    if (userStore.user.email !== 'lowdog136@gmail.com') {
      error.value = 'У вас нет прав на создание примеров';
      console.error('❌ Пользователь не имеет прав на редактирование:', userStore.user.email);
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const now = new Date().toISOString();
      const sampleItems = [
        {
          title: 'Рефакторинг компонента PepperForm',
          description:
            'Разделить монолитный компонент PepperForm (734 строки) на более мелкие специализированные компоненты для улучшения читаемости и поддерживаемости кода',
          category: 'improvement' as const,
          priority: 'high' as const,
          status: 'in-progress' as const,
          estimatedEffort: 'medium' as const,
          targetVersion: 'v3.2.0',
          notes:
            'Компонент слишком большой и сложный. Нужно разделить на: PepperBasicInfo, PepperPlantingInfo, PepperWateringHistory, PepperFertilizerHistory, PepperSoilInfo',
          assignee: userStore.user.email!,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Рефакторинг PepperHistoryManager',
          description:
            'Разделить компонент PepperHistoryManager (537 строк) на более мелкие компоненты для устранения дублирования кода между табами',
          category: 'improvement' as const,
          priority: 'medium' as const,
          status: 'planned' as const,
          estimatedEffort: 'small' as const,
          targetVersion: 'v3.3.0',
          notes:
            'Много дублирования кода между табами истории. Создать общие компоненты: HistoryTabPanel, HistoryEntryCard, EmptyHistoryState',
          assignee: userStore.user.email!,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Рефакторинг VarietySelector',
          description:
            'Упростить компонент VarietySelector (530 строк) путем разделения логики для v1 и v2 библиотек сортов',
          category: 'improvement' as const,
          priority: 'medium' as const,
          status: 'planned' as const,
          estimatedEffort: 'small' as const,
          targetVersion: 'v3.4.0',
          notes:
            'Сложная логика с двумя версиями библиотеки. Создать: VarietySearchFilters, VarietyInfoDialog',
          assignee: userStore.user.email!,
          createdAt: now,
          updatedAt: now,
        },
      ];

      console.log('📝 Создаем примеры элементов...');

      for (const item of sampleItems) {
        const docRef = await addDoc(collection(db, 'roadmap'), item);
        console.log('✅ Создан элемент с ID:', docRef.id);
      }

      console.log('✅ Все примеры элементов созданы успешно');
    } catch (err) {
      console.error('❌ Ошибка при создании примеров:', err);
      console.error('❌ Тип ошибки:', typeof err);
      console.error(
        '❌ Сообщение ошибки:',
        err instanceof Error ? err.message : 'Неизвестная ошибка',
      );
      console.error('❌ Стек ошибки:', err instanceof Error ? err.stack : 'Нет стека');

      error.value = `Ошибка при создании примеров: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`;
    } finally {
      loading.value = false;
      console.log('=== Конец создания примеров элементов дорожной карты ===');
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
