<template>
  <div class="row items-end q-gutter-sm">
    <div class="col">
      <q-input
        v-model="selectedVarietyName"
        label="Сорт перца"
        :error="!!errors?.variety"
        :error-message="errors?.variety"
        readonly
        class="q-mb-sm"
        placeholder="Выберите сорт из библиотеки"
      >
        <template v-slot:append>
          <q-btn flat dense icon="search" @click="$emit('open-dialog')" color="primary">
            <q-tooltip>Выбрать из библиотеки</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </div>
    <div class="col-auto">
      <q-btn v-if="selectedVariety" flat dense icon="info" @click="$emit('show-info')" color="info">
        <q-tooltip>Информация о сорте</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PepperVariety } from './models';

interface Props {
  modelValue?: PepperVariety | null;
  errors?: { variety?: string };
}

interface Emits {
  (e: 'update:modelValue', value: PepperVariety | null): void;
  (e: 'open-dialog'): void;
  (e: 'show-info'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedVariety = computed({
  get: () => props.modelValue || null,
  set: (value) => emit('update:modelValue', value),
});

const selectedVarietyName = computed(() => selectedVariety.value?.name || '');
</script>
