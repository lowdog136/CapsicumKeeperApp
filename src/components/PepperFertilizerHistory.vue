<template>
  <div class="q-mb-sm">
    <div class="text-subtitle2 q-mb-xs">История удобрений</div>

    <!-- Форма добавления удобрения -->
    <FertilizerEntryForm
      ref="formRef"
      :fertilizer-history-list="fertilizerHistoryList"
      @add="handleAddFertilizer"
      @open-library="showFertilizerLibrary = true"
    />

    <!-- Диалог выбора из библиотеки удобрений -->
    <FertilizerSelector v-model="showFertilizerLibrary" @select="onFertilizerSelect" />

    <!-- Список истории удобрений -->
    <FertilizerHistoryList :model-value="modelValue" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FertilizerComposition } from './models';
import FertilizerSelector from './FertilizerSelector.vue';
import FertilizerEntryForm from './FertilizerEntryForm.vue';
import FertilizerHistoryList from './FertilizerHistoryList.vue';

interface FertilizerEntry {
  date: string;
  note?: string;
  grams?: number;
  composition?: FertilizerComposition;
}

interface Props {
  modelValue: FertilizerEntry[];
}

interface Emits {
  (e: 'update:modelValue', value: FertilizerEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const FERTILIZER_HISTORY_KEY = 'fertilizerHistoryList';
const fertilizerHistoryList = ref<string[]>([]);
const showFertilizerLibrary = ref(false);
const formRef = ref();

// Загрузка истории удобрений из localStorage
function loadFertilizerHistory() {
  const raw = localStorage.getItem(FERTILIZER_HISTORY_KEY);
  if (raw) {
    try {
      fertilizerHistoryList.value = JSON.parse(raw);
    } catch {
      // ignore
    }
  }
}

function saveFertilizerHistory() {
  localStorage.setItem(FERTILIZER_HISTORY_KEY, JSON.stringify(fertilizerHistoryList.value));
}

loadFertilizerHistory();

// Обработчик добавления удобрения
function handleAddFertilizer(entry: FertilizerEntry) {
  const newHistory = [...props.modelValue, entry];
  emit('update:modelValue', newHistory);

  if (entry.note && !fertilizerHistoryList.value.includes(entry.note)) {
    fertilizerHistoryList.value.push(entry.note);
    saveFertilizerHistory();
  }
}

// Обработчик выбора удобрения из библиотеки
function onFertilizerSelect(fertilizer: any) {
  if (formRef.value) {
    formRef.value.fillFromLibrary(fertilizer);
  }
  showFertilizerLibrary.value = false;
}
</script>
