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
          v-model="form.agent"
          label="Средство обработки"
          outlined
          :rules="[(val) => !!val || 'Средство обязательно']"
        />
      </div>
      <div class="col-4">
        <q-btn
          color="secondary"
          icon="library_books"
          label="Библиотека"
          @click="showTreatmentSelector = true"
          class="full-width"
        />
      </div>
    </div>

    <q-input
      v-model.number="form.volume"
      label="Объем (мл)"
      type="number"
      outlined
      :rules="[(val) => val > 0 || 'Объем должен быть больше 0']"
    />

    <!-- Селектор обработок -->
    <TreatmentSelector v-model="showTreatmentSelector" @select="selectTreatment" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { TreatmentEntry } from './models';
import type { TreatmentAgent } from 'stores/treatment-library';
import TreatmentSelector from './TreatmentSelector.vue';

interface Props {
  modelValue: TreatmentEntry;
}

interface Emits {
  (e: 'update:modelValue', value: TreatmentEntry): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showTreatmentSelector = ref(false);

const form = ref<TreatmentEntry>({
  date: '',
  agent: '',
  volume: undefined,
});

// Флаг для предотвращения циклических обновлений
const isUpdating = ref(false);

// Синхронизируем с v-model
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isUpdating.value && newValue) {
      // Проверяем, отличаются ли значения перед обновлением
      const currentStr = JSON.stringify({
        date: form.value.date,
        agent: form.value.agent,
        volume: form.value.volume,
      });
      const newStr = JSON.stringify({
        date: newValue.date,
        agent: newValue.agent,
        volume: newValue.volume,
      });
      
      if (currentStr !== newStr) {
        isUpdating.value = true;
        form.value = { ...newValue };
        nextTick(() => {
          isUpdating.value = false;
        });
      }
    }
  },
  { immediate: true, deep: true },
);

// Эмитим изменения
watch(
  form,
  (newValue) => {
    if (!isUpdating.value) {
      isUpdating.value = true;
      emit('update:modelValue', { ...newValue });
      // Сбрасываем флаг после следующего тика
      nextTick(() => {
        isUpdating.value = false;
      });
    }
  },
  { deep: true },
);

function selectTreatment(treatment: TreatmentAgent) {
  form.value.agent = treatment.name;
  showTreatmentSelector.value = false;
}
</script>
