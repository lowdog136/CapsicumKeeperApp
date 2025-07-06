<template>
  <div v-if="pepper.varietyInfo" class="q-mt-xs">
    <q-card flat bordered class="bg-blue-1">
      <q-card-section class="q-pa-sm">
        <div class="row items-center q-gutter-xs q-mb-xs">
          <q-chip
            :color="getHeatLevelInfo(pepper.varietyInfo.heatLevel).color"
            text-color="white"
            size="sm"
            :label="getHeatLevelInfo(pepper.varietyInfo.heatLevel).name"
          />
          <q-chip
            color="primary"
            text-color="white"
            size="sm"
            :label="pepper.varietyInfo.species"
            icon="science"
          />
          <q-chip
            v-if="pepper.varietyInfo.origin"
            color="grey"
            text-color="white"
            size="sm"
            :label="pepper.varietyInfo.origin"
          />
        </div>
        <div class="row q-col-gutter-sm text-caption">
          <div class="col-6">
            <div class="text-grey-6">Высота</div>
            <div>
              {{ pepper.varietyInfo.plantHeight.min }}-{{ pepper.varietyInfo.plantHeight.max }}
              {{ pepper.varietyInfo.plantHeight.unit }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-grey-6">Созревание</div>
            <div>
              {{ pepper.varietyInfo.daysToMaturity.min }}-{{
                pepper.varietyInfo.daysToMaturity.max
              }}
              дней
            </div>
          </div>
        </div>
        <div class="text-caption q-mt-xs text-grey-7">
          Цвета: {{ pepper.varietyInfo.color.join(', ') }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { Pepper, HeatLevel } from './models';

interface Props {
  pepper: Pepper;
}

defineProps<Props>();

function getHeatLevelInfo(heatLevel: HeatLevel) {
  const heatLevels = {
    'no-heat': { name: 'Без остроты', color: 'green', shuRange: '0 SHU' },
    'very-mild': { name: 'Очень мягкий', color: 'light-green', shuRange: '100-500 SHU' },
    mild: { name: 'Мягкий', color: 'yellow', shuRange: '500-2500 SHU' },
    medium: { name: 'Средний', color: 'orange', shuRange: '2500-8000 SHU' },
    hot: { name: 'Острый', color: 'red', shuRange: '8000-50000 SHU' },
    'very-hot': { name: 'Очень острый', color: 'deep-orange', shuRange: '50000-100000 SHU' },
    'extremely-hot': { name: 'Экстремально острый', color: 'purple', shuRange: '100000+ SHU' },
  };
  return heatLevels[heatLevel] || heatLevels['mild'];
}
</script>
