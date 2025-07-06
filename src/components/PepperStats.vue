<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">Статистика по перцам</div>

      <!-- Основная статистика -->
      <PepperMainStats :peppers="peppers" />

      <!-- Статистика по стадиям и местам -->
      <PepperDistributionStats :peppers="peppers" />

      <!-- Активность ухода -->
      <PepperCareActivity :peppers="peppers" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Pepper } from './models';
import PepperMainStats from './PepperMainStats.vue';
import PepperDistributionStats from './PepperDistributionStats.vue';
import PepperCareActivity from './PepperCareActivity.vue';

const props = defineProps<{
  peppers: Pepper[];
}>();
</script>
