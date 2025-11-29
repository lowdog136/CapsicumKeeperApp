<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h4 class="q-my-none">Дорожная карта</h4>
        <p class="text-grey-6 q-mt-sm q-mb-none">Управляйте планами развития приложения</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="userStore.user && items.length === 0"
          color="secondary"
          icon="auto_fix_high"
          label="Создать примеры"
          @click="createSamples"
          :loading="loading"
        />
        <q-btn
          v-if="userStore.user && canEdit"
          color="orange"
          icon="bug_report"
          label="Тестовый элемент"
          @click="createTestItem"
          :loading="loading"
        />
        <q-btn
          v-if="userStore.user && canEdit"
          color="red"
          icon="bug_report"
          label="Debug Firebase"
          @click="debugFirebase"
        />
        <q-btn
          v-if="userStore.user && canEdit"
          color="purple"
          icon="search"
          label="Debug All Items"
          @click="debugAllItems"
        />
        <q-btn
          v-if="userStore.user && canEdit"
          color="blue"
          icon="refresh"
          label="Загрузить элементы"
          @click="fetchItems"
          :loading="loading"
        />
        <q-btn
          v-if="canEdit"
          color="primary"
          icon="add"
          label="Добавить элемент"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- Статистика -->
    <div class="row q-gutter-md q-mb-lg">
      <q-card class="col-auto">
        <q-card-section class="text-center">
          <div class="text-h6">{{ stats.total }}</div>
          <div class="text-caption">Всего</div>
        </q-card-section>
      </q-card>
      <q-card class="col-auto">
        <q-card-section class="text-center">
          <div class="text-h6 text-blue">{{ stats.planned }}</div>
          <div class="text-caption">Запланировано</div>
        </q-card-section>
      </q-card>
      <q-card class="col-auto">
        <q-card-section class="text-center">
          <div class="text-h6 text-orange">{{ stats.inProgress }}</div>
          <div class="text-caption">В работе</div>
        </q-card-section>
      </q-card>
      <q-card class="col-auto">
        <q-card-section class="text-center">
          <div class="text-h6 text-green">{{ stats.completed }}</div>
          <div class="text-caption">Завершено</div>
        </q-card-section>
      </q-card>
      <q-card class="col-auto">
        <q-card-section class="text-center">
          <div class="text-h6 text-red">{{ stats.highPriority }}</div>
          <div class="text-caption">Высокий приоритет</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Фильтры -->
    <div class="row q-gutter-md q-mb-lg">
      <q-select
        v-model="statusFilter"
        :options="statusFilterOptions"
        label="Фильтр по статусу"
        outlined
        dense
        clearable
        emit-value
        map-options
        @update:model-value="onFilterChange"
        class="col-auto"
      />
      <q-select
        v-model="priorityFilter"
        :options="priorityFilterOptions"
        label="Фильтр по приоритету"
        outlined
        dense
        clearable
        emit-value
        map-options
        @update:model-value="onFilterChange"
        class="col-auto"
      />
      <q-select
        v-model="categoryFilter"
        :options="categoryFilterOptions"
        label="Фильтр по категории"
        outlined
        dense
        clearable
        emit-value
        map-options
        @update:model-value="onFilterChange"
        class="col-auto"
      />
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Загрузка дорожной карты...</div>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">{{ error }}</div>
      <q-btn color="primary" label="Повторить" @click="fetchItems" class="q-mt-md" />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="filteredItems.length === 0" class="text-center q-pa-xl">
      <q-icon name="assignment" size="50px" color="grey" />
      <div class="q-mt-md text-grey">
        {{ hasFilters ? 'Нет элементов, соответствующих фильтрам' : 'Дорожная карта пуста' }}
      </div>
      <q-btn
        v-if="!hasFilters && canEdit"
        color="primary"
        label="Добавить первый элемент"
        @click="showAddDialog = true"
        class="q-mt-md"
      />
    </div>

    <!-- Список элементов -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="item in paginatedFilteredItems" :key="item.id" class="col-12 col-md-6 col-lg-4">
        <RoadmapItemCard :item="item" @edit="editItem" @delete="deleteItem" />
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="totalFilteredPages > 1" class="row justify-center q-mt-lg">
      <q-pagination
        v-model="roadmapStore.currentPage"
        :max="totalFilteredPages"
        :max-pages="7"
        boundary-numbers
        direction-links
        @update:model-value="onPageChange"
      />
    </div>

    <!-- Информация о пагинации -->
    <div v-if="totalFilteredItems > 0" class="row justify-center q-mt-md">
      <div class="text-caption text-grey-6">
        Показано {{ (roadmapStore.currentPage - 1) * roadmapStore.itemsPerPage + 1 }} -
        {{ Math.min(roadmapStore.currentPage * roadmapStore.itemsPerPage, totalFilteredItems) }}
        из {{ totalFilteredItems }} элементов
        <span v-if="hasFilters"> (отфильтровано)</span>
      </div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <RoadmapItemForm v-model="showAddDialog" :item="editingItem" @save="saveItem" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoadmapStore } from 'src/stores/roadmap-store';
import { useUserStore } from 'src/stores/user-store';
import RoadmapItemCard from 'src/components/RoadmapItemCard.vue';
import RoadmapItemForm from 'src/components/RoadmapItemForm.vue';
import type { RoadmapItem } from 'src/components/models';
import { useNotifications } from 'src/composables/useNotifications';
import { useErrorHandler } from 'src/composables/useErrorHandler';
import { useLogger } from 'src/composables/useLogger';

const $q = useQuasar();
const roadmapStore = useRoadmapStore();
const userStore = useUserStore();
const { success, error: showError } = useNotifications();
const { handleError } = useErrorHandler();
const logger = useLogger('RoadmapPage');

// Состояние
const showAddDialog = ref(false);
const editingItem = ref<RoadmapItem | undefined>(undefined);

// Фильтры
const statusFilter = ref<string | null>(null);
const priorityFilter = ref<string | null>(null);
const categoryFilter = ref<string | null>(null);

// Опции фильтров
const statusFilterOptions = [
  { label: 'Запланировано', value: 'planned' },
  { label: 'В работе', value: 'in-progress' },
  { label: 'Завершено', value: 'completed' },
  { label: 'Отменено', value: 'cancelled' },
];

const priorityFilterOptions = [
  { label: 'Низкий', value: 'low' },
  { label: 'Средний', value: 'medium' },
  { label: 'Высокий', value: 'high' },
  { label: 'Критический', value: 'critical' },
];

const categoryFilterOptions = [
  { label: 'Функция', value: 'feature' },
  { label: 'Улучшение', value: 'improvement' },
  { label: 'Исправление', value: 'bugfix' },
  { label: 'Интерфейс', value: 'ui' },
  { label: 'Бэкенд', value: 'backend' },
];

// Вычисляемые свойства
const stats = computed(() => roadmapStore.stats);
const items = computed(() => {
  logger.debug('items computed вызван, количество элементов:', roadmapStore.items.length);
  return roadmapStore.items;
});

const filteredItems = computed(() => {
  console.log('🔄 filteredItems computed вызван');
  console.log('🔄 Исходные элементы:', roadmapStore.items.length);
  console.log(
    '🔄 Фильтры: status=',
    statusFilter.value,
    'priority=',
    priorityFilter.value,
    'category=',
    categoryFilter.value,
  );

  let items = roadmapStore.items;

  // Функция для извлечения значения из фильтра (может быть строкой или объектом)
  const getFilterValue = (filter: any) => {
    if (typeof filter === 'string') return filter;
    if (filter && typeof filter === 'object' && filter.value) return filter.value;
    return null;
  };

  const statusValue = getFilterValue(statusFilter.value);
  const priorityValue = getFilterValue(priorityFilter.value);
  const categoryValue = getFilterValue(categoryFilter.value);

  if (statusValue) {
    items = items.filter((item) => item.status === statusValue);
    console.log('🔄 После фильтра по статусу:', items.length);
  }

  if (priorityValue) {
    items = items.filter((item) => item.priority === priorityValue);
    console.log('🔄 После фильтра по приоритету:', items.length);
  }

  if (categoryValue) {
    items = items.filter((item) => item.category === categoryValue);
    console.log('🔄 После фильтра по категории:', items.length);
  }

  console.log('🔄 Итоговые отфильтрованные элементы:', items.length);
  return items;
});

// Пагинированные отфильтрованные элементы
const paginatedFilteredItems = computed(() => {
  const startIndex = (roadmapStore.currentPage - 1) * roadmapStore.itemsPerPage;
  const endIndex = startIndex + roadmapStore.itemsPerPage;
  return filteredItems.value.slice(startIndex, endIndex);
});

// Общее количество отфильтрованных элементов
const totalFilteredItems = computed(() => filteredItems.value.length);

// Общее количество страниц для отфильтрованных элементов
const totalFilteredPages = computed(() =>
  Math.ceil(totalFilteredItems.value / roadmapStore.itemsPerPage),
);

const hasFilters = computed(() => {
  // Функция для извлечения значения из фильтра (может быть строкой или объектом)
  const getFilterValue = (filter: any) => {
    if (typeof filter === 'string') return filter;
    if (filter && typeof filter === 'object' && filter.value) return filter.value;
    return null;
  };

  const statusValue = getFilterValue(statusFilter.value);
  const priorityValue = getFilterValue(priorityFilter.value);
  const categoryValue = getFilterValue(categoryFilter.value);

  return Boolean(statusValue || priorityValue || categoryValue);
});

const loading = computed(() => roadmapStore.loading);
const error = computed(() => roadmapStore.error);

// Методы
const fetchItems = async () => {
  await roadmapStore.fetchItems();
};

const editItem = (item: RoadmapItem) => {
  editingItem.value = item;
  showAddDialog.value = true;
};

const saveItem = async (itemData: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  logger.group('Сохранение элемента дорожной карты');
  logger.log('Данные элемента:', itemData);
  logger.log('Режим редактирования:', !!editingItem.value);
  logger.log('ID редактируемого элемента:', editingItem.value?.id);

  try {
    if (editingItem.value) {
      // Обновление существующего элемента
      logger.log('Обновляем существующий элемент...');
      await roadmapStore.updateItem(editingItem.value.id, itemData);
      logger.log('Элемент обновлен успешно');
      success('Элемент обновлен успешно!');
    } else {
      // Добавление нового элемента
      logger.log('Добавляем новый элемент...');
      const result = await roadmapStore.addItem(itemData);
      if (result) {
        logger.log('Элемент добавлен успешно');
        success('Элемент добавлен успешно!');
      }
    }
  } catch (err) {
    handleError(err, 'Ошибка при сохранении элемента');
  } finally {
    editingItem.value = undefined;
    logger.groupEnd();
  }
};

const deleteItem = async (id: string) => {
  try {
    await roadmapStore.deleteItem(id);
    logger.log('Элемент удален успешно');
    success('Элемент удален успешно!');
  } catch (err) {
    handleError(err, 'Ошибка при удалении элемента');
  }
};

const createSamples = async () => {
  try {
    await roadmapStore.createSampleItems();
    console.log('✅ Примеры элементов созданы успешно');
    alert('Примеры элементов созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка при создании примеров:', error);
    alert(
      `Ошибка при создании примеров: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    );
  }
};

const createTestItem = async () => {
  try {
    const result = await roadmapStore.createTestItem();
    if (result) {
      console.log('✅ Тестовый элемент создан успешно');
      // Используем простой alert вместо $q.notify
      alert('Тестовый элемент создан успешно!');
    } else {
      console.error('❌ Не удалось создать тестовый элемент');
      alert('Ошибка: Не удалось создать тестовый элемент');
    }
  } catch (error) {
    console.error('❌ Ошибка при создании тестового элемента:', error);
    alert(
      `Ошибка при создании тестового элемента: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    );
  }
};

const debugFirebase = async () => {
  console.log('=== DEBUG FIREBASE ===');
  console.log('1. Проверка пользователя:');
  console.log('   - userStore.user:', userStore.user);
  console.log('   - userStore.user?.email:', userStore.user?.email);
  console.log('   - userStore.user?.uid:', userStore.user?.uid);

  console.log('2. Проверка Firebase подключения:');
  try {
    const { db } = await import('src/boot/firebase');
    console.log('   - db объект:', db);
    console.log('   - db app:', db?.app);
    console.log('   - db type:', typeof db);

    if (db) {
      console.log('   ✅ Firestore подключен');

      // Попробуем создать тестовый документ в коллекции roadmap
      console.log('3. Тест создания документа в коллекции roadmap...');
      const { collection, addDoc } = await import('firebase/firestore');

      const testData = {
        title: 'Тестовый элемент',
        description: 'Это тестовый элемент для проверки подключения',
        category: 'feature' as const,
        priority: 'medium' as const,
        status: 'planned' as const,
        assignee: userStore.user?.email || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetVersion: null,
        notes: 'Тестовый элемент создан через debug функцию',
        estimatedEffort: null,
      };

      console.log('   - Тестовые данные:', testData);

      const docRef = await addDoc(collection(db, 'roadmap'), testData);
      console.log('   ✅ Тестовый документ создан с ID:', docRef.id);
      alert(`✅ Тестовый документ создан с ID: ${docRef.id}`);

      // Попробуем загрузить элементы дорожной карты
      console.log('4. Тест загрузки элементов дорожной карты...');
      await roadmapStore.fetchItems();
      console.log('   ✅ Элементы загружены:', roadmapStore.items.length);
    } else {
      console.log('   ❌ Firestore не подключен');
      alert('❌ Firestore не подключен');
    }
  } catch (error) {
    console.error('   ❌ Ошибка при проверке Firebase:', error);
    alert(
      `❌ Ошибка при проверке Firebase: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    );
  }

  console.log('=== КОНЕЦ DEBUG ===');
};

const debugAllItems = async () => {
  console.log('=== DEBUG ALL ITEMS ===');
  try {
    await roadmapStore.debugAllItems();
  } catch (error) {
    console.error('   ❌ Ошибка при проверке всех элементов:', error);
    alert(
      `❌ Ошибка при проверке всех элементов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    );
  }
  console.log('=== КОНЕЦ DEBUG ALL ITEMS ===');
};

// Автоматическая загрузка данных при изменении пользователя
watch(
  () => userStore.user,
  (newUser) => {
    logger.log('Изменение пользователя:', newUser?.email);
    // Загружаем данные для всех пользователей (публичная дорожная карта)
    logger.log('Загрузка публичной дорожной карты');
    fetchItems();
  },
  { immediate: true },
);

// Сброс страницы при изменении фильтров
watch(
  [statusFilter, priorityFilter, categoryFilter],
  () => {
    if (roadmapStore.currentPage > 1) {
      logger.log('Сброс страницы при изменении фильтров');
      roadmapStore.currentPage = 1;
    }
  },
  { deep: true },
);

// Метод для обработки изменения страницы
const onPageChange = (page: number) => {
  console.log('🔄 Переход на страницу:', page);
  roadmapStore.currentPage = page;
};

// Метод для обработки изменения фильтров
const onFilterChange = () => {
  console.log('🔄 Изменение фильтров');
  if (roadmapStore.currentPage > 1) {
    console.log('🔄 Сброс страницы при изменении фильтров');
    roadmapStore.currentPage = 1;
  }
};

// Добавьте вычисляемое свойство для проверки прав на редактирование
const canEdit = computed(() => {
  return userStore.user?.email === 'lowdog136@gmail.com';
});
</script>
