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

    <q-card-actions align="right">
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
import type { RoadmapItem } from './models';

const props = defineProps<{
  item: RoadmapItem;
}>();

const emit = defineEmits<{
  edit: [item: RoadmapItem];
  delete: [id: string];
}>();

const $q = useQuasar();

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

const priorityColor = computed(() => priorityConfig[props.item.priority].color);
const priorityLabel = computed(() => priorityConfig[props.item.priority].label);

const categoryColor = computed(() => categoryConfig[props.item.category].color);
const categoryLabel = computed(() => categoryConfig[props.item.category].label);

const statusColor = computed(() => statusConfig[props.item.status].color);
const statusLabel = computed(() => statusConfig[props.item.status].label);

const effortLabel = computed(() =>
  props.item.estimatedEffort ? effortConfig[props.item.estimatedEffort].label : '',
);

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
