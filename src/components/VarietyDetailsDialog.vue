<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ variety?.name }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div v-if="variety" class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <h6>Описание</h6>
            <p>{{ variety.description }}</p>
            <h6>Научная классификация</h6>
            <p><strong>Вид:</strong> {{ variety.species }}</p>
            <h6>Характеристики</h6>
            <ul>
              <li><strong>Острота:</strong> {{ getHeatLevelInfo(variety).name }}</li>
              <li v-if="variety.color">
                <strong>Цвета:</strong>
                {{ Array.isArray(variety.color) ? variety.color.join(', ') : variety.color }}
              </li>
              <li><strong>Высота:</strong> {{ getPlantHeight(variety) }}</li>
              <li><strong>Созревание:</strong> {{ getDaysToMaturity(variety) }}</li>
              <li v-if="variety.origin"><strong>Происхождение:</strong> {{ variety.origin }}</li>
            </ul>
          </div>
          <div class="col-12 col-md-6">
            <h6>Советы по выращиванию</h6>
            <ul>
              <li v-for="tip in variety.growingTips" :key="tip">{{ tip }}</li>
            </ul>
            <h6>Размер плода</h6>
            <p v-if="variety.fruitSize">
              Длина:
              {{ getFruitLength(variety) }}<br />
              Ширина:
              {{ getFruitWidth(variety) }}
            </p>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { PepperVariety } from './models';
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  variety: PepperVariety | null;
  useV2?: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function getHeatLevelInfo(variety: PepperVariety) {
  if (props.useV2) {
    const level = (variety as any).shu ?? variety.heatLevel;
    if (!level) return { name: 'Нет данных', color: 'grey' };
    if (typeof level === 'string') return { name: level, color: 'primary' };
    if (typeof level === 'number') return { name: `${level} SHU`, color: 'red' };
    return { name: String(level), color: 'primary' };
  } else {
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
function getPlantHeight(variety: PepperVariety) {
  if (typeof variety.plantHeight === 'object' && variety.plantHeight) {
    return `${variety.plantHeight.min ?? ''}${variety.plantHeight.max ? '-' + variety.plantHeight.max : ''}${variety.plantHeight.unit || ''}`;
  }
  return variety.plantHeight;
}
function getDaysToMaturity(variety: PepperVariety) {
  if (typeof variety.daysToMaturity === 'object' && variety.daysToMaturity) {
    return `${variety.daysToMaturity.min ?? ''}${variety.daysToMaturity.max ? '-' + variety.daysToMaturity.max : ''} дней`;
  }
  return variety.daysToMaturity;
}
function getFruitLength(variety: PepperVariety) {
  if (variety.fruitSize && variety.fruitSize.length) {
    const l = variety.fruitSize.length;
    return `${l.min ?? l.toString?.() ?? ''}${l.max ? '-' + l.max : ''}${l.unit || ''}`;
  }
  return '';
}
function getFruitWidth(variety: PepperVariety) {
  if (variety.fruitSize && variety.fruitSize.width) {
    const w = variety.fruitSize.width;
    return `${w.min ?? w.toString?.() ?? ''}${w.max ? '-' + w.max : ''}${w.unit || ''}`;
  }
  return '';
}
</script>
