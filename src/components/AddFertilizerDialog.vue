<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="text-h6">Добавить новое удобрение</q-card-section>
      <q-card-section>
        <q-form @submit="handleSubmit">
          <q-input
            v-model="newFertilizer.name"
            label="Название*"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'Введите название']"
          />
          <q-input
            v-model="newFertilizer.description"
            label="Описание"
            type="textarea"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-select
            v-model="newFertilizer.category"
            :options="categoryOptions"
            label="Категория*"
            outlined
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || 'Выберите категорию']"
          />
          <q-input
            v-model="newFertilizer.manufacturer"
            label="Производитель"
            outlined
            dense
            class="q-mb-sm"
          />
          <div class="text-subtitle2 q-mb-sm">Состав (в %)</div>
          <div class="row q-gutter-sm">
            <q-input
              v-model.number="newFertilizer.composition.N"
              label="N"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
            <q-input
              v-model.number="newFertilizer.composition.P"
              label="P"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
            <q-input
              v-model.number="newFertilizer.composition.K"
              label="K"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
          </div>
          <div class="row q-gutter-sm q-mt-sm">
            <q-input
              v-model.number="newFertilizer.composition.Ca"
              label="Ca"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
            <q-input
              v-model.number="newFertilizer.composition.Mg"
              label="Mg"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
            <q-input
              v-model.number="newFertilizer.composition.S"
              label="S"
              outlined
              dense
              type="number"
              class="col"
              step="0.1"
              min="0"
              max="100"
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" @click="handleCancel" />
        <q-btn color="primary" label="Добавить" @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Fertilizer } from 'stores/fertilizer-library';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'add', fertilizer: Fertilizer): void;
}>();

const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Новое удобрение
const newFertilizer = ref({
  name: '',
  description: '',
  manufacturer: '',
  category: 'complex' as Fertilizer['category'],
  composition: {
    N: 0,
    P: 0,
    K: 0,
    Ca: 0,
    Mg: 0,
    S: 0,
  } as Fertilizer['composition'],
});

// Категории
const categories = [
  { label: 'Комплексные', value: 'complex' },
  { label: 'Минеральные', value: 'mineral' },
  { label: 'Органические', value: 'organic' },
  { label: 'Микроэлементы', value: 'micro' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.map((c) => ({
  label: c.label,
  value: c.value,
}));

// Обработчики
function handleSubmit() {
  if (!newFertilizer.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Название удобрения обязательно',
      icon: 'error',
    });
    return;
  }

  // Очищаем состав от пустых значений
  const cleanComposition: any = {};
  Object.entries(newFertilizer.value.composition).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleanComposition[key] = Number(value);
    }
  });

  const fertilizer: Fertilizer = {
    id: '', // Будет сгенерирован в store
    name: newFertilizer.value.name,
    description: newFertilizer.value.description || undefined,
    manufacturer: newFertilizer.value.manufacturer || undefined,
    category: newFertilizer.value.category,
    composition: cleanComposition,
    isFavorite: false,
  };

  emit('add', fertilizer);
  resetForm();
  showDialog.value = false;
}

function handleCancel() {
  resetForm();
  showDialog.value = false;
}

function resetForm() {
  newFertilizer.value = {
    name: '',
    description: '',
    manufacturer: '',
    category: 'complex',
    composition: { N: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0 },
  };
}
</script>
