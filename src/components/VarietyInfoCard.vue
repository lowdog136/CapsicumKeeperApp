<template>
  <q-card v-if="variety" flat bordered class="bg-blue-1 q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-sm">
        <q-chip
          :color="getHeatLevelInfo(variety).color"
          text-color="white"
          size="sm"
          :label="getHeatLevelInfo(variety).name"
        />
        <q-chip
          color="primary"
          text-color="white"
          size="sm"
          :label="variety.species"
          icon="science"
        />
        <q-chip
          v-if="variety.origin"
          color="grey"
          text-color="white"
          size="sm"
          :label="variety.origin"
        />
      </div>
      <div class="text-caption q-mt-xs text-grey-7">
        {{ variety.description }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { PepperVariety } from './models';
import { computed } from 'vue';

interface Props {
  variety: PepperVariety | null;
  useV2?: boolean;
}
const props = defineProps<Props>();

function getHeatLevelInfo(variety: PepperVariety) {
  if (props.useV2) {
    // В v2 heatLevel может быть просто числом SHU или строкой
    const level = (variety as any).shu ?? variety.heatLevel;
    if (!level) return { name: 'Нет данных', color: 'grey' };
    if (typeof level === 'string') return { name: level, color: 'primary' };
    if (typeof level === 'number') return { name: `${level} SHU`, color: 'red' };
    return { name: String(level), color: 'primary' };
  } else {
    // v1
    const heatLevels = [
      { level: 'mild', name: 'Слабая', color: 'green' },
      { level: 'medium', name: 'Средняя', color: 'orange' },
      { level: 'hot', name: 'Острая', color: 'red' },
      { level: 'superhot', name: 'Очень острая', color: 'purple' },
    ];
    const found = heatLevels.find((h) => h.level === variety.heatLevel);
    return found || { name: variety.heatLevel, color: 'primary' };
  }
}
</script>
