<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="saveEntry" class="q-gutter-md">
          <!-- Полив -->
          <WateringEntryForm
            v-if="type === 'watering'"
            v-model="form"
            @update:modelValue="updateForm"
          />

          <!-- Удобрение -->
          <FertilizingEntryForm
            v-if="type === 'fertilizing'"
            v-model="form"
            @update:modelValue="updateForm"
          />

          <!-- Обработка -->
          <TreatmentEntryForm
            v-if="type === 'treatment'"
            v-model="form"
            @update:modelValue="updateForm"
          />

          <!-- Наблюдение -->
          <ObservationEntryForm
            v-if="type === 'observation'"
            v-model="form"
            @update:modelValue="updateForm"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn unelevated label="Сохранить" color="primary" @click="saveEntry" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { WateringEntry, FertilizingEntry, TreatmentEntry, Observation } from './models';
import WateringEntryForm from './WateringEntryForm.vue';
import FertilizingEntryForm from './FertilizingEntryForm.vue';
import TreatmentEntryForm from './TreatmentEntryForm.vue';
import ObservationEntryForm from './ObservationEntryForm.vue';

const props = defineProps<{
  modelValue: boolean;
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation';
  entry?: WateringEntry | FertilizingEntry | TreatmentEntry | Observation;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', entry: WateringEntry | FertilizingEntry | TreatmentEntry | Observation): void;
}>();

const $q = useQuasar();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<any>({
  date: '',
  volume: null,
  note: '',
  grams: null,
  agent: '',
  height: null,
  leafCondition: '',
  composition: {},
  problems: '',
});

// Вычисляемые свойства
const dialogTitle = computed(() => {
  const action = props.entry ? 'Редактировать' : 'Добавить';
  const typeName =
    {
      watering: 'полив',
      fertilizing: 'удобрение',
      treatment: 'обработку',
      observation: 'наблюдение',
    }[props.type] || 'запись';

  return `${action} ${typeName}`;
});

// Методы
function initializeForm() {
  const today = new Date().toISOString().slice(0, 10);

  if (props.entry) {
    // Редактирование существующей записи
    form.value = { ...props.entry };
  } else {
    // Новая запись
    form.value = {
      date: today,
      volume: null,
      note: '',
      grams: null,
      agent: '',
      height: null,
      leafCondition: '',
      composition: {},
      problems: '',
    };
  }
}

function updateForm(newValue: any) {
  form.value = { ...newValue };
}

function saveEntry() {
  // Валидация
  if (!form.value.date) {
    $q.notify({
      color: 'negative',
      message: 'Дата обязательна',
      icon: 'error',
    });
    return;
  }

  // Специфичная валидация по типу
  if (props.type === 'watering' && (!form.value.volume || form.value.volume <= 0)) {
    $q.notify({
      color: 'negative',
      message: 'Объем воды должен быть больше 0',
      icon: 'error',
    });
    return;
  }

  if (
    props.type === 'fertilizing' &&
    (!form.value.note || !form.value.grams || form.value.grams <= 0)
  ) {
    $q.notify({
      color: 'negative',
      message: 'Заполните название и количество удобрения',
      icon: 'error',
    });
    return;
  }

  if (
    props.type === 'treatment' &&
    (!form.value.agent || !form.value.volume || form.value.volume <= 0)
  ) {
    $q.notify({
      color: 'negative',
      message: 'Заполните средство и объем обработки',
      icon: 'error',
    });
    return;
  }

  if (props.type === 'observation' && (!form.value.leafCondition || !form.value.note)) {
    $q.notify({
      color: 'negative',
      message: 'Заполните состояние листьев и заметки',
      icon: 'error',
    });
    return;
  }

  // Создаем чистый объект без undefined значений
  const cleanEntry: any = {
    date: form.value.date,
  };

  // Добавляем поля в зависимости от типа
  if (props.type === 'watering') {
    if (form.value.volume) cleanEntry.volume = form.value.volume;
    if (form.value.note) cleanEntry.note = form.value.note;
  } else if (props.type === 'fertilizing') {
    cleanEntry.note = form.value.note;
    cleanEntry.grams = form.value.grams;
    if (form.value.composition && Object.keys(form.value.composition).length > 0) {
      cleanEntry.composition = {};
      Object.entries(form.value.composition).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanEntry.composition[key] = Number(value);
        }
      });
    }
  } else if (props.type === 'treatment') {
    cleanEntry.agent = form.value.agent;
    if (form.value.volume) cleanEntry.volume = form.value.volume;
    if (form.value.note) cleanEntry.note = form.value.note;
  } else if (props.type === 'observation') {
    cleanEntry.leafCondition = form.value.leafCondition;
    cleanEntry.note = form.value.note;
    if (form.value.height) cleanEntry.height = form.value.height;
    if (form.value.problems) cleanEntry.problems = form.value.problems;
  }

  // Эмитим событие сохранения
  emit('save', cleanEntry);
  showDialog.value = false;
}

// Инициализация формы при открытии диалога
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      initializeForm();
    }
  },
);
</script>
