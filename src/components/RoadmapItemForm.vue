<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEditing ? 'Редактировать элемент' : 'Добавить элемент' }}</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.title"
            label="Название"
            :rules="[(val) => !!val || 'Название обязательно']"
            outlined
            dense
          />

          <q-input
            v-model="form.description"
            label="Описание"
            type="textarea"
            :rules="[(val) => !!val || 'Описание обязательно']"
            outlined
            dense
            rows="3"
          />

          <div class="row q-gutter-md">
            <q-select
              v-model="form.category"
              :options="categoryOptions"
              label="Категория"
              outlined
              dense
              class="col"
              emit-value
              map-options
            />

            <q-select
              v-model="form.priority"
              :options="priorityOptions"
              label="Приоритет"
              outlined
              dense
              class="col"
              emit-value
              map-options
            />
          </div>

          <div class="row q-gutter-md">
            <q-select
              v-model="form.status"
              :options="statusOptions"
              label="Статус"
              outlined
              dense
              class="col"
              emit-value
              map-options
            />

            <q-select
              v-model="form.estimatedEffort"
              :options="effortOptions"
              label="Сложность"
              outlined
              dense
              class="col"
              clearable
              emit-value
              map-options
            />
          </div>

          <q-input
            v-model="form.targetVersion"
            label="Целевая версия"
            outlined
            dense
            clearable
            placeholder="например: 1.2.0"
          />

          <q-input
            v-model="form.notes"
            label="Заметки"
            type="textarea"
            outlined
            dense
            rows="2"
            clearable
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="onCancel" />
        <q-btn
          unelevated
          :label="isEditing ? 'Сохранить' : 'Добавить'"
          color="primary"
          @click="onSubmit"
          :loading="loading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { RoadmapItem } from './models';

const props = defineProps<{
  modelValue: boolean;
  item?: RoadmapItem;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>];
}>();

const $q = useQuasar();

const loading = ref(false);

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.item);

// Опции для селекторов
const categoryOptions = [
  { label: 'Функция', value: 'feature' },
  { label: 'Улучшение', value: 'improvement' },
  { label: 'Исправление', value: 'bugfix' },
  { label: 'Интерфейс', value: 'ui' },
  { label: 'Бэкенд', value: 'backend' },
];

const priorityOptions = [
  { label: 'Низкий', value: 'low' },
  { label: 'Средний', value: 'medium' },
  { label: 'Высокий', value: 'high' },
  { label: 'Критический', value: 'critical' },
];

const statusOptions = [
  { label: 'Запланировано', value: 'planned' },
  { label: 'В работе', value: 'in-progress' },
  { label: 'Завершено', value: 'completed' },
  { label: 'Отменено', value: 'cancelled' },
];

const effortOptions = [
  { label: 'Простое', value: 'small' },
  { label: 'Среднее', value: 'medium' },
  { label: 'Сложное', value: 'large' },
];

// Форма
const form = ref({
  title: '',
  description: '',
  category: 'feature' as 'feature' | 'improvement' | 'bugfix' | 'ui' | 'backend',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  status: 'planned' as 'planned' | 'in-progress' | 'completed' | 'cancelled',
  estimatedEffort: null as 'small' | 'medium' | 'large' | null,
  targetVersion: '',
  notes: '',
});

// Заполнить форму при редактировании
watch(
  () => props.item,
  (item) => {
    if (item) {
      form.value = {
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        status: item.status,
        estimatedEffort: item.estimatedEffort,
        targetVersion: item.targetVersion || '',
        notes: item.notes || '',
      };
    } else {
      // Сбросить форму
      form.value = {
        title: '',
        description: '',
        category: 'feature',
        priority: 'medium',
        status: 'planned',
        estimatedEffort: null,
        targetVersion: '',
        notes: '',
      };
    }
  },
  { immediate: true },
);

const onSubmit = async () => {
  if (!form.value.title || !form.value.description) {
    $q.notify({
      type: 'negative',
      message: 'Заполните обязательные поля',
    });
    return;
  }

  loading.value = true;

  try {
    const itemData = {
      title: form.value.title,
      description: form.value.description,
      category: form.value.category,
      priority: form.value.priority,
      status: form.value.status,
      estimatedEffort: form.value.estimatedEffort,
      targetVersion: form.value.targetVersion || null,
      notes: form.value.notes || null,
    };

    emit('save', itemData);
    showDialog.value = false;
  } catch (error) {
    console.error('Ошибка при сохранении:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при сохранении',
    });
  } finally {
    loading.value = false;
  }
};

const onCancel = () => {
  showDialog.value = false;
};
</script>
