// @ts-nocheck //
<reference types="vue" />
<template>
  <div>
    <q-checkbox v-model="localValue.hasDrainage" label="Дренаж" class="q-mb-xs" />
    <q-select
      v-if="localValue.hasDrainage"
      v-model="localValue.drainage"
      :options="drainageOptions"
      label="Вид дренажа"
      class="q-mb-sm"
      emit-value
      map-options
      option-value="value"
      option-label="label"
    />
    <q-checkbox v-model="localValue.hasSoilImprovement" label="Улучшение грунта" class="q-mb-xs" />
    <q-select
      v-if="localValue.hasSoilImprovement"
      v-model="localValue.soilImprovement"
      :options="soilImprovementOptions"
      label="Вид улучшения"
      class="q-mb-sm"
      emit-value
      map-options
      option-value="value"
      option-label="label"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineOptions } from 'vue';
defineOptions({});

const props = defineProps<{
  modelValue: {
    hasDrainage?: boolean;
    drainage?: string | null;
    hasSoilImprovement?: boolean;
    soilImprovement?: string | null;
  };
}>();
const emit = defineEmits(['update:modelValue']);

const drainageOptions = [
  { label: 'Керамзит', value: 'Керамзит' },
  { label: 'Камни', value: 'Камни' },
  { label: 'Без дренажа', value: 'Без дренажа' },
];
const soilImprovementOptions = [
  { label: 'Вермикулит', value: 'Вермикулит' },
  { label: 'Перлит', value: 'Перлит' },
  { label: 'Кокосовый субстрат', value: 'Кокосовый субстрат' },
  { label: 'Без улучшения', value: 'Без улучшения' },
];

const localValue = computed({
  get() {
    return {
      hasDrainage: !!props.modelValue.hasDrainage,
      drainage: props.modelValue.drainage ?? null,
      hasSoilImprovement: !!props.modelValue.hasSoilImprovement,
      soilImprovement: props.modelValue.soilImprovement ?? null,
    };
  },
  set(val) {
    emit('update:modelValue', {
      hasDrainage: val.hasDrainage,
      drainage: val.hasDrainage ? val.drainage : null,
      hasSoilImprovement: val.hasSoilImprovement,
      soilImprovement: val.hasSoilImprovement ? val.soilImprovement : null,
    });
  },
});
</script>
