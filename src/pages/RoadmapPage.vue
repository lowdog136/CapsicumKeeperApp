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
          v-if="userStore.user"
          color="orange"
          icon="bug_report"
          label="Тестовый элемент"
          @click="createTestItem"
          :loading="loading"
        />
        <q-btn
          color="primary"
          icon="add"
          label="Добавить элемент"
          @click="showAddDialog = true"
          :disable="!userStore.user"
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
        class="col-auto"
      />
      <q-select
        v-model="priorityFilter"
        :options="priorityFilterOptions"
        label="Фильтр по приоритету"
        outlined
        dense
        clearable
        class="col-auto"
      />
      <q-select
        v-model="categoryFilter"
        :options="categoryFilterOptions"
        label="Фильтр по категории"
        outlined
        dense
        clearable
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

    <!-- Состояние неавторизованного пользователя -->
    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="lock" size="50px" color="grey" />
      <div class="q-mt-md text-grey">Войдите в систему для доступа к дорожной карте</div>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="filteredItems.length === 0" class="text-center q-pa-xl">
      <q-icon name="assignment" size="50px" color="grey" />
      <div class="q-mt-md text-grey">
        {{ hasFilters ? 'Нет элементов, соответствующих фильтрам' : 'Дорожная карта пуста' }}
      </div>
      <q-btn
        v-if="!hasFilters"
        color="primary"
        label="Добавить первый элемент"
        @click="showAddDialog = true"
        class="q-mt-md"
      />
    </div>

    <!-- Список элементов -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="item in filteredItems" :key="item.id" class="col-12 col-md-6 col-lg-4">
        <RoadmapItemCard :item="item" @edit="editItem" @delete="deleteItem" />
      </div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <RoadmapItemForm v-model="showAddDialog" :item="editingItem" @save="saveItem" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRoadmapStore } from 'src/stores/roadmap-store';
import { useUserStore } from 'src/stores/user-store';
import RoadmapItemCard from 'src/components/RoadmapItemCard.vue';
import RoadmapItemForm from 'src/components/RoadmapItemForm.vue';
import type { RoadmapItem } from 'src/components/models';

const $q = useQuasar();
const roadmapStore = useRoadmapStore();
const userStore = useUserStore();

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
const items = computed(() => roadmapStore.items);

const filteredItems = computed(() => {
  let items = roadmapStore.items;

  if (statusFilter.value) {
    items = items.filter((item) => item.status === statusFilter.value);
  }

  if (priorityFilter.value) {
    items = items.filter((item) => item.priority === priorityFilter.value);
  }

  if (categoryFilter.value) {
    items = items.filter((item) => item.category === categoryFilter.value);
  }

  return items;
});

const hasFilters = computed(
  () => statusFilter.value || priorityFilter.value || categoryFilter.value,
);

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
  try {
    if (editingItem.value) {
      // Обновление существующего элемента
      await roadmapStore.updateItem(editingItem.value.id, itemData);
      $q.notify({
        type: 'positive',
        message: 'Элемент обновлен',
      });
    } else {
      // Добавление нового элемента
      const result = await roadmapStore.addItem(itemData);
      if (result) {
        $q.notify({
          type: 'positive',
          message: 'Элемент добавлен',
        });
      }
    }
  } catch (error) {
    console.error('Ошибка при сохранении:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при сохранении',
    });
  } finally {
    editingItem.value = undefined;
  }
};

const deleteItem = async (id: string) => {
  try {
    await roadmapStore.deleteItem(id);
    $q.notify({
      type: 'positive',
      message: 'Элемент удален',
    });
  } catch (error) {
    console.error('Ошибка при удалении:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при удалении',
    });
  }
};

const createSamples = async () => {
  try {
    await roadmapStore.createSampleItems();
    $q.notify({
      type: 'positive',
      message: 'Примеры элементов созданы',
    });
  } catch (error) {
    console.error('Ошибка при создании примеров:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании примеров',
    });
  }
};

const createTestItem = async () => {
  try {
    await roadmapStore.createTestItem();
    $q.notify({
      type: 'positive',
      message: 'Тестовый элемент создан',
    });
  } catch (error) {
    console.error('Ошибка при создании тестового элемента:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании тестового элемента',
    });
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  if (userStore.user) {
    fetchItems();
  }
});
</script>
