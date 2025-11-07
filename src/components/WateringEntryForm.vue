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
import { ref, watch, nextTick } from 'vue';
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
        volume: form.value.volume,
      });
      const newStr = JSON.stringify({
        date: newValue.date,
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
</script>
