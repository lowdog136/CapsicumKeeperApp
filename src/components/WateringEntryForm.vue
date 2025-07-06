<template>
  <div class="q-gutter-md">
    <q-input
      v-model="form.date"
      label="Дата"
      type="date"
      outlined
      :rules="[(val) => !!val || 'Дата обязательна']"
    />

    <q-input
      v-model.number="form.volume"
      label="Объем воды (мл)"
      type="number"
      outlined
      :rules="[(val) => val > 0 || 'Объем должен быть больше 0']"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WateringEntry } from './models';

interface Props {
  modelValue: WateringEntry;
}

interface Emits {
  (e: 'update:modelValue', value: WateringEntry): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const form = ref<WateringEntry>({
  date: '',
  volume: undefined,
});

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
</script>
