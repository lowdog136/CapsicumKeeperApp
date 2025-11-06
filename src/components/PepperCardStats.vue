<template>
  <div>
    <!-- Краткая статистика -->
    <div class="row q-col-gutter-sm">
      <div class="col-4">
        <div class="text-caption text-grey-6 q-mb-xs">Поливов</div>
        <div class="text-body2 text-weight-medium">{{ pepper.wateringHistory?.length || 0 }}</div>
      </div>
      <div class="col-4">
        <div class="text-caption text-grey-6 q-mb-xs">Удобрений</div>
        <div class="text-body2 text-weight-medium">{{ pepper.fertilizingHistory?.length || 0 }}</div>
      </div>
      <div class="col-4">
        <div class="text-caption text-grey-6 q-mb-xs">Наблюдений</div>
        <div class="text-body2 text-weight-medium">{{ pepper.observationLog?.length || 0 }}</div>
      </div>
    </div>

    <!-- Последние действия -->
    <div v-if="lastWatering || lastFertilizing" class="q-mb-sm">
      <div class="text-caption text-grey-6">Последние действия</div>
      <div class="text-body2">
        <div v-if="lastWatering">Полив: {{ formatDate(lastWatering.date) }}</div>
        <div v-if="lastFertilizing">Удобрение: {{ formatDate(lastFertilizing.date) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Pepper } from './models';

interface Props {
  pepper: Pepper;
}

const props = defineProps<Props>();

const lastWatering = computed(() => {
  const history = props.pepper.wateringHistory;
  return history && history.length ? history[history.length - 1] : null;
});

const lastFertilizing = computed(() => {
  const history = props.pepper.fertilizingHistory;
  return history && history.length ? history[history.length - 1] : null;
});

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ru-RU');
}
</script>
