<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Добавить новое средство</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="newTreatment.name"
            label="Название*"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'Введите название']"
          />
          <q-input
            v-model="newTreatment.description"
            label="Описание"
            type="textarea"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="newTreatment.category"
            :options="categoryOptions"
            label="Категория*"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'Выберите категорию']"
          />
          <q-input
            v-model="newTreatment.activeIngredient"
            label="Активное вещество"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="newTreatment.manufacturer"
            label="Производитель"
            outlined
            dense
            class="q-mb-sm"
          />
          <div class="row q-gutter-sm">
            <q-input
              v-model.number="newTreatment.concentration"
              label="Концентрация"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
            />
            <q-select
              v-model="newTreatment.unit"
              :options="unitOptions"
              label="Единица"
              outlined
              dense
              class="col"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="handleCancel" />
        <q-btn unelevated label="Добавить" color="primary" @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { TreatmentAgent } from 'stores/treatment-library';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'add', treatment: TreatmentAgent): void;
}>();

const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Новое средство
const newTreatment = ref({
  name: '',
  description: '',
  category: 'bio' as TreatmentAgent['category'],
  activeIngredient: '',
  manufacturer: '',
  concentration: 0,
  unit: 'ml/l' as TreatmentAgent['unit'],
});

// Категории
const categories = [
  { label: 'Фунгициды', value: 'fungicide' },
  { label: 'Инсектициды', value: 'insecticide' },
  { label: 'Гербициды', value: 'herbicide' },
  { label: 'Пестициды', value: 'pesticide' },
  { label: 'Био', value: 'bio' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.map((c) => ({
  label: c.label,
  value: c.value,
}));

const unitOptions = [
  { label: 'мл/л', value: 'ml/l' },
  { label: 'г/л', value: 'g/l' },
  { label: 'ppm', value: 'ppm' },
  { label: 'Другое', value: 'other' },
];

// Обработчики
function handleSubmit() {
  if (!newTreatment.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Название средства обязательно',
      icon: 'error',
    });
    return;
  }

  const treatment: TreatmentAgent = {
    id: '', // Будет сгенерирован в store
    name: newTreatment.value.name,
    description: newTreatment.value.description || undefined,
    activeIngredient: newTreatment.value.activeIngredient || undefined,
    manufacturer: newTreatment.value.manufacturer || undefined,
    category: newTreatment.value.category,
    concentration: newTreatment.value.concentration || undefined,
    unit: newTreatment.value.unit,
    isFavorite: false,
  };

  emit('add', treatment);
  resetForm();
  showDialog.value = false;
}

function handleCancel() {
  resetForm();
  showDialog.value = false;
}

function resetForm() {
  newTreatment.value = {
    name: '',
    description: '',
    category: 'bio',
    activeIngredient: '',
    manufacturer: '',
    concentration: 0,
    unit: 'ml/l',
  };
}
</script>
