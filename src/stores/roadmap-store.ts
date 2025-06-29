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
    console.log('=== Создание примеров элементов дорожной карты ===');

    const sampleItems = [
      {
        title: 'Исправить функционал избранного',
        description: 'Восстановить работу кнопков избранного в карточках перцев и сортов',
        priority: 'high' as const,
        status: 'planned' as const,
        category: 'bugfix' as const,
        targetVersion: '1.1.0',
        notes: 'Проблема с обновлением состояния избранного в реальном времени',
        estimatedEffort: 'medium' as const,
      },
      {
        title: 'Создать страницу избранного',
        description: 'Отдельная страница для просмотра всех избранных перцев и сортов',
        priority: 'medium' as const,
        status: 'planned' as const,
        category: 'feature' as const,
        targetVersion: '1.2.0',
        notes: 'Нужно добавить фильтры и поиск по избранному',
        estimatedEffort: 'medium' as const,
      },
      {
        title: 'Показать количество пользователей выращивающих сорт',
        description:
          'Добавить счетчик показывающий сколько пользователей выращивают каждый сорт перца',
        priority: 'low' as const,
        status: 'planned' as const,
        category: 'feature' as const,
        targetVersion: '1.3.0',
        notes: 'Требует изменения структуры данных в Firestore',
        estimatedEffort: 'large' as const,
      },
      {
        title: 'Обратный таймер до сбора урожая',
        description:
          'Показывать сколько дней осталось до сбора урожая на основе дней до созревания сорта',
        priority: 'low' as const,
        status: 'planned' as const,
        category: 'feature' as const,
        targetVersion: '1.3.0',
        notes: 'Нужно добавить дату посадки в модель перца',
        estimatedEffort: 'medium' as const,
      },
      {
        title: 'Завершено: Ограничения функционала для неавторизованных пользователей',
        description:
          'Скрыть кнопки управления и функционал избранного для неавторизованных пользователей в библиотеке сортов',
        priority: 'medium' as const,
        status: 'completed' as const,
        category: 'feature' as const,
        targetVersion: '1.1.0',
        notes:
          'Ограничения применены: кнопки импорта/управления только для админа, кнопки избранного и добавления в сад только для авторизованных пользователей',
        estimatedEffort: 'small' as const,
      },
    ];

    console.log('📝 Создаем', sampleItems.length, 'элементов...');

    for (const item of sampleItems) {
      console.log('➕ Добавляем элемент:', item.title);
      const result = await addItem(item);
      if (result) {
        console.log('✅ Элемент добавлен:', result.id);
      } else {
        console.log('❌ Ошибка при добавлении элемента:', item.title);
      }
    }

    console.log('=== Завершение создания примеров элементов дорожной карты ===');
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
