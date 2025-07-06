<template>
  <div class="q-mb-sm">
    <div class="text-subtitle2 q-mb-xs">Обработка</div>
    <q-input
      v-model="treatmentDate"
      label="Дата обработки*"
      type="date"
      :error="!!treatmentError"
      :error-message="treatmentError"
      class="q-mb-xs"
    />
    <q-input
      v-model="treatmentAgent"
      label="Чем обрабатывали*"
      :error="!!treatmentAgentError"
      :error-message="treatmentAgentError"
      class="q-mb-xs"
    />
    <q-input
      v-model.number="treatmentVolume"
      label="Объем (мл, по желанию)"
      type="number"
      class="q-mb-xs"
    />
    <q-btn flat color="positive" @click="addTreatment" size="sm">Добавить обработку</q-btn>
    <q-list v-if="treatmentHistory.length" dense class="q-mt-xs">
      <q-item v-for="(item, idx) in treatmentHistory" :key="idx">
        <q-item-section>
          {{ item.date }} — {{ item.agent }}
          <span v-if="item.volume"> — {{ item.volume }} мл</span>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface TreatmentEntry {
  date: string;
  agent: string;
  volume?: number;
}

interface Props {
  modelValue: TreatmentEntry[];
}

interface Emits {
  (e: 'update:modelValue', value: TreatmentEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const treatmentDate = ref(new Date().toISOString().slice(0, 10));
const treatmentAgent = ref('');
const treatmentVolume = ref<number | null>(null);
const treatmentError = ref('');
const treatmentAgentError = ref('');

const treatmentHistory = computed(() => props.modelValue);

function addTreatment() {
  if (!treatmentDate.value) {
    treatmentError.value = 'Укажите дату обработки';
    return;
  }
  if (!treatmentAgent.value) {
    treatmentAgentError.value = 'Укажите чем обрабатывали';
    return;
  }

  const newHistory = [
    ...props.modelValue,
    {
      date: treatmentDate.value,
      agent: treatmentAgent.value,
      volume: treatmentVolume.value !== null ? treatmentVolume.value : undefined,
    },
  ];

  emit('update:modelValue', newHistory);

  // Сброс полей
  treatmentDate.value = new Date().toISOString().slice(0, 10);
  treatmentAgent.value = '';
  treatmentVolume.value = null;
  treatmentError.value = '';
  treatmentAgentError.value = '';
}
</script>
