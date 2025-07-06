<template>
  <div class="q-gutter-md">
    <q-input
      v-model="form.date"
      label="Дата"
      type="date"
      outlined
      :rules="[(val) => !!val || 'Дата обязательна']"
    />

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-8">
        <q-input
          v-model="form.note"
          label="Название удобрения"
          outlined
          :rules="[(val) => !!val || 'Название обязательно']"
        />
      </div>
      <div class="col-4">
        <q-btn
          color="secondary"
          icon="library_books"
          label="Библиотека"
          @click="showFertilizerSelector = true"
          class="full-width"
        />
      </div>
    </div>

    <q-input
      v-model.number="form.grams"
      label="Количество (г)"
      type="number"
      outlined
      :rules="[(val) => val > 0 || 'Количество должно быть больше 0']"
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
        />
      </div>
    </div>

    <!-- Селектор удобрений -->
    <FertilizerSelector v-model="showFertilizerSelector" @select="selectFertilizer" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FertilizingEntry, FertilizerComposition } from './models';
import type { Fertilizer } from 'stores/fertilizer-library';
import FertilizerSelector from './FertilizerSelector.vue';

interface Props {
  modelValue: FertilizingEntry;
}

interface Emits {
  (e: 'update:modelValue', value: FertilizingEntry): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showFertilizerSelector = ref(false);

const form = ref<FertilizingEntry>({
  date: '',
  note: '',
  grams: undefined,
  composition: {},
});

// Элементы для удобрений
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

// Синхронизируем с v-model
watch(
  () => props.modelValue,
  (newValue) => {
    form.value = { ...newValue };
  },
  { immediate: true, deep: true },
);

// Эмитим изменения
watch(
  form,
  (newValue) => {
    emit('update:modelValue', { ...newValue });
  },
  { deep: true },
);

function selectFertilizer(fertilizer: Fertilizer) {
  form.value.note = fertilizer.name;
  form.value.composition = { ...fertilizer.composition };
  showFertilizerSelector.value = false;
}
</script>
