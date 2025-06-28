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
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const q = query(
        collection(db, 'roadmap'),
        where('assignee', '==', userStore.user.email),
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);
      items.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoadmapItem[];
    } catch (err) {
      console.error('Ошибка при загрузке дорожной карты:', err);
      error.value = 'Ошибка при загрузке дорожной карты';
    } finally {
      loading.value = false;
    }
  };

  // Добавить новый элемент
  const addItem = async (item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const now = new Date().toISOString();
      const newItem = {
        ...item,
        assignee: userStore.user.email!,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'roadmap'), newItem);
      const createdItem: RoadmapItem = {
        id: docRef.id,
        ...newItem,
      };

      items.value.unshift(createdItem);
      return createdItem;
    } catch (err) {
      console.error('Ошибка при добавлении элемента:', err);
      error.value = 'Ошибка при добавлении элемента';
      return null;
    } finally {
      loading.value = false;
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

  // Создать примеры элементов дорожной карты
  const createSampleItems = async () => {
    if (!userStore.user) {
      error.value = 'Пользователь не авторизован';
      return;
    }

    const sampleItems = [
      {
        title: 'Добавить уведомления',
        description: 'Реализовать систему уведомлений для напоминания о поливе и уходе за перцами',
        category: 'feature' as const,
        priority: 'high' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.3.0',
        notes: 'Включить push-уведомления и email-уведомления',
      },
      {
        title: 'Улучшить мобильную версию',
        description: 'Оптимизировать интерфейс для мобильных устройств',
        category: 'ui' as const,
        priority: 'medium' as const,
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
        title: 'Добавить экспорт данных',
        description: 'Возможность экспортировать данные о перцах в CSV/Excel',
        category: 'feature' as const,
        priority: 'low' as const,
        status: 'planned' as const,
        estimatedEffort: 'medium' as const,
        targetVersion: '1.4.0',
        notes: 'Включить фильтры для экспорта',
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
    createSampleItems,
    plannedItems,
    inProgressItems,
    completedItems,
    highPriorityItems,
    stats,
  };
});
