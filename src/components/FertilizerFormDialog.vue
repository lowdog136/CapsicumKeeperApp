<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ fertilizer ? 'Редактировать удобрение' : 'Добавить удобрение' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="handleSave" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Название *"
            outlined
            :rules="[(val) => !!val || 'Название обязательно']"
          />

          <q-select
            v-model="form.category"
            :options="categoryOptions"
            label="Категория *"
            outlined
            :rules="[(val) => !!val || 'Категория обязательна']"
          />

          <q-input
            v-model="form.manufacturer"
            label="Производитель"
            outlined
          />

          <q-input
            v-model="form.description"
            label="Описание"
            type="textarea"
            outlined
            rows="3"
          />

          <div class="text-subtitle2 q-mt-md">Состав (%):</div>

          <!-- Макроэлементы -->
          <div class="text-caption text-grey-6 q-mb-sm">Макроэлементы:</div>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-4" v-for="element in macroElements" :key="element.symbol">
              <q-input
                v-model.number="form.composition[element.symbol]"
                :label="`${element.symbol} (${element.name})`"
                type="number"
                outlined
                dense
                suffix="%"
                min="0"
                max="100"
              />
            </div>
          </div>

          <!-- Микроэлементы -->
          <div class="text-caption text-grey-6 q-mb-sm">Микроэлементы:</div>
          <div class="row q-col-gutter-sm">
            <div class="col-4" v-for="element in microElements" :key="element.symbol">
              <q-input
                v-model.number="form.composition[element.symbol]"
                :label="`${element.symbol} (${element.name})`"
                type="number"
                outlined
                dense
                suffix="%"
                min="0"
                max="100"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn unelevated label="Сохранить" color="primary" @click="handleSave" :loading="loading" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Fertilizer } from 'stores/fertilizer-library-firestore';
import type { FertilizerComposition } from 'components/models';

interface Props {
  modelValue: boolean;
  fertilizer?: Fertilizer | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', fertilizer: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>): void;
}

const props = withDefaults(defineProps<Props>(), {
  fertilizer: null,
  loading: false,
});
const emit = defineEmits<Emits>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  description: '',
  composition: {},
  category: 'other',
  manufacturer: '',
  isFavorite: false,
});

const categoryOptions = [
  { label: 'Органическое', value: 'organic' },
  { label: 'Минеральное', value: 'mineral' },
  { label: 'Комплексное', value: 'complex' },
  { label: 'Микроэлементы', value: 'micro' },
  { label: 'Другое', value: 'other' },
];

const macroElements = [
  { symbol: 'N', name: 'Азот' },
  { symbol: 'P', name: 'Фосфор' },
  { symbol: 'K', name: 'Калий' },
  { symbol: 'Ca', name: 'Кальций' },
  { symbol: 'Mg', name: 'Магний' },
  { symbol: 'S', name: 'Сера' },
];

const microElements = [
  { symbol: 'Fe', name: 'Железо' },
  { symbol: 'Mn', name: 'Марганец' },
  { symbol: 'Zn', name: 'Цинк' },
  { symbol: 'Cu', name: 'Медь' },
  { symbol: 'B', name: 'Бор' },
  { symbol: 'Mo', name: 'Молибден' },
  { symbol: 'Cl', name: 'Хлор' },
  { symbol: 'Co', name: 'Кобальт' },
  { symbol: 'Ni', name: 'Никель' },
  { symbol: 'Si', name: 'Кремний' },
];

watch(
  () => props.fertilizer,
  (newValue) => {
    if (newValue) {
      form.value = {
        name: newValue.name,
        description: newValue.description || '',
        composition: { ...newValue.composition },
        category: newValue.category,
        manufacturer: newValue.manufacturer || '',
        isFavorite: newValue.isFavorite || false,
      };
    } else {
      form.value = {
        name: '',
        description: '',
        composition: {},
        category: 'other',
        manufacturer: '',
        isFavorite: false,
      };
    }
  },
  { immediate: true },
);

function handleSave() {
  if (!form.value.name || !form.value.category) {
    return;
  }

  // Очищаем состав от undefined и нулевых значений
  const cleanComposition: FertilizerComposition = {};
  Object.entries(form.value.composition).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value > 0) {
      cleanComposition[key as keyof FertilizerComposition] = value;
    }
  });

  emit('save', {
    ...form.value,
    composition: cleanComposition,
  });
  showDialog.value = false;
}
</script>

