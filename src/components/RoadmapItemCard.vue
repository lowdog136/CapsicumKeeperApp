<template>
  <q-card class="roadmap-item-card q-mb-md" :class="statusClass">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">{{ item.title }}</div>
          <div class="text-subtitle2 text-grey-7">{{ item.description }}</div>
        </div>
        <div class="col-auto">
          <q-chip :color="priorityColor" text-color="white" size="sm">
            {{ priorityLabel }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="row items-center q-gutter-sm">
        <q-chip :color="categoryColor" text-color="white" size="sm">
          {{ categoryLabel }}
        </q-chip>
        <q-chip :color="statusColor" text-color="white" size="sm">
          {{ statusLabel }}
        </q-chip>
        <q-chip v-if="item.estimatedEffort" color="blue" text-color="white" size="sm">
          {{ effortLabel }}
        </q-chip>
        <q-chip v-if="item.targetVersion" color="purple" text-color="white" size="sm">
          v{{ item.targetVersion }}
        </q-chip>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none" v-if="item.notes">
      <div class="text-body2"><strong>Заметки:</strong> {{ item.notes }}</div>
    </q-card-section>

    <q-card-actions align="right" v-if="canEdit">
      <q-btn flat color="primary" label="Редактировать" @click="$emit('edit', item)" size="sm" />
      <q-btn flat color="negative" label="Удалить" @click="confirmDelete" size="sm" />
    </q-card-actions>

    <q-card-section class="q-pt-none">
      <div class="text-caption text-grey-6">
        Создано: {{ formatDate(item.createdAt) }}
        <span v-if="item.updatedAt !== item.createdAt">
          • Обновлено: {{ formatDate(item.updatedAt) }}
        </span>
        <span v-if="item.completedAt"> • Завершено: {{ formatDate(item.completedAt) }} </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/user-store';
import type { RoadmapItem } from './models';

const props = defineProps<{
  item: RoadmapItem;
}>();

const emit = defineEmits<{
  edit: [item: RoadmapItem];
  delete: [id: string];
}>();

const $q = useQuasar();
const userStore = useUserStore();

// Проверка прав на редактирование
const canEdit = computed(() => {
  return userStore.user?.email === 'lowdog136@gmail.com';
});

// Цвета и метки для приоритетов
const priorityConfig = {
  low: { color: 'green', label: 'Низкий' },
  medium: { color: 'orange', label: 'Средний' },
  high: { color: 'red', label: 'Высокий' },
  critical: { color: 'purple', label: 'Критический' },
};

// Цвета и метки для категорий
const categoryConfig = {
  feature: { color: 'blue', label: 'Функция' },
  improvement: { color: 'teal', label: 'Улучшение' },
  bugfix: { color: 'red', label: 'Исправление' },
  ui: { color: 'pink', label: 'Интерфейс' },
  backend: { color: 'grey', label: 'Бэкенд' },
};

// Цвета и метки для статусов
const statusConfig = {
  planned: { color: 'grey', label: 'Запланировано' },
  'in-progress': { color: 'blue', label: 'В работе' },
  completed: { color: 'green', label: 'Завершено' },
  cancelled: { color: 'red', label: 'Отменено' },
};

// Цвета и метки для сложности
const effortConfig = {
  small: { label: 'Простое' },
  medium: { label: 'Среднее' },
  large: { label: 'Сложное' },
};

const priorityColor = computed(() => {
  const config = priorityConfig[props.item.priority];
  if (!config) {
    console.warn(`Неизвестный приоритет: ${props.item.priority}`, props.item);
    return 'grey';
  }
  return config.color;
});

const priorityLabel = computed(() => {
  const config = priorityConfig[props.item.priority];
  if (!config) {
    console.warn(`Неизвестный приоритет: ${props.item.priority}`, props.item);
    return props.item.priority || 'Неизвестно';
  }
  return config.label;
});

const categoryColor = computed(() => {
  const config = categoryConfig[props.item.category];
  if (!config) {
    console.warn(`Неизвестная категория: ${props.item.category}`, props.item);
    return 'grey';
  }
  return config.color;
});

const categoryLabel = computed(() => {
  const config = categoryConfig[props.item.category];
  if (!config) {
    console.warn(`Неизвестная категория: ${props.item.category}`, props.item);
    return props.item.category || 'Неизвестно';
  }
  return config.label;
});

const statusColor = computed(() => {
  const config = statusConfig[props.item.status];
  if (!config) {
    console.warn(`Неизвестный статус: ${props.item.status}`, props.item);
    return 'grey';
  }
  return config.color;
});

const statusLabel = computed(() => {
  const config = statusConfig[props.item.status];
  if (!config) {
    console.warn(`Неизвестный статус: ${props.item.status}`, props.item);
    return props.item.status || 'Неизвестно';
  }
  return config.label;
});

const effortLabel = computed(() => {
  if (!props.item.estimatedEffort) return '';
  const config = effortConfig[props.item.estimatedEffort];
  if (!config) {
    console.warn(`Неизвестная сложность: ${props.item.estimatedEffort}`, props.item);
    return props.item.estimatedEffort || 'Неизвестно';
  }
  return config.label;
});

const statusClass = computed(() => ({
  'roadmap-item-completed': props.item.status === 'completed',
  'roadmap-item-cancelled': props.item.status === 'cancelled',
}));

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const confirmDelete = () => {
  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить "${props.item.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('delete', props.item.id);
  });
};
</script>

<style scoped>
.roadmap-item-card {
  transition: all 0.3s ease;
}

.roadmap-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.roadmap-item-completed {
  opacity: 0.7;
}

.roadmap-item-cancelled {
  opacity: 0.5;
  text-decoration: line-through;
}
</style>
