<template>
  <div class="q-mb-sm">
    <div class="text-subtitle2 q-mb-xs">Дневник наблюдений</div>
    <q-input
      v-model="observationDate"
      label="Дата наблюдения*"
      type="date"
      :error="!!observationError"
      :error-message="observationError"
      class="q-mb-xs"
    />
    <q-input
      v-model.number="observationHeight"
      label="Высота куста (см)"
      type="number"
      class="q-mb-xs"
    />
    <q-input
      v-model="observationLeafCondition"
      label="Состояние листьев*"
      :error="!!observationLeafError"
      :error-message="observationLeafError"
      class="q-mb-xs"
    />
    <q-btn flat color="positive" @click="addObservation" size="sm">Добавить наблюдение</q-btn>
    <q-list v-if="observationHistory.length" dense class="q-mt-xs">
      <q-item v-for="(item, idx) in observationHistory" :key="idx">
        <q-item-section>
          {{ item.date }}: {{ item.leafCondition }}
          <span v-if="item.height">({{ item.height }} см)</span>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface ObservationEntry {
  date: string;
  height?: number;
  leafCondition: string;
}

interface Props {
  modelValue: ObservationEntry[];
}

interface Emits {
  (e: 'update:modelValue', value: ObservationEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const observationDate = ref(new Date().toISOString().slice(0, 10));
const observationHeight = ref<number | null>(null);
const observationLeafCondition = ref('');
const observationError = ref('');
const observationLeafError = ref('');

const observationHistory = computed(() => props.modelValue);

function addObservation() {
  observationError.value = !observationDate.value ? 'Укажите дату' : '';
  observationLeafError.value = !observationLeafCondition.value ? 'Укажите состояние листьев' : '';
  if (observationError.value || observationLeafError.value) return;

  const newObservation: ObservationEntry = {
    date: observationDate.value,
    leafCondition: observationLeafCondition.value,
  };

  if (observationHeight.value !== null) {
    newObservation.height = observationHeight.value;
  }

  const newHistory = [...props.modelValue, newObservation];
  emit('update:modelValue', newHistory);

  // Сброс полей
  observationHeight.value = null;
  observationLeafCondition.value = '';
  observationError.value = '';
  observationLeafError.value = '';
}
</script>
