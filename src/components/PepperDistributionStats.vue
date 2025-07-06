<template>
  <div class="row q-col-gutter-md q-mb-lg">
    <div class="col-12 col-md-6">
      <h6>Распределение по стадиям</h6>
      <div class="q-gutter-sm">
        <div v-for="(count, stage) in stageStats" :key="stage" class="row items-center">
          <div class="col-4">
            <q-chip
              :color="getStageColor(stage)"
              text-color="white"
              size="sm"
              :label="getStageLabel(stage)"
            />
          </div>
          <div class="col-4">
            <q-linear-progress
              :value="count / totalPeppers"
              :color="getStageColor(stage)"
              class="q-mt-sm"
            />
          </div>
          <div class="col-4 text-right">
            {{ count }} ({{ Math.round((count / totalPeppers) * 100) }}%)
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6">
      <h6>Распределение по местам посадки</h6>
      <div class="q-gutter-sm">
        <div v-for="(count, location) in locationStats" :key="location" class="row items-center">
          <div class="col-4">
            <q-chip
              color="primary"
              text-color="white"
              size="sm"
              :label="getLocationLabel(location)"
            />
          </div>
          <div class="col-4">
            <q-linear-progress :value="count / totalPeppers" color="primary" class="q-mt-sm" />
          </div>
          <div class="col-4 text-right">
            {{ count }} ({{ Math.round((count / totalPeppers) * 100) }}%)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Pepper } from './models';

interface Props {
  peppers: Pepper[];
}

const props = defineProps<Props>();

const totalPeppers = computed(() => props.peppers.length);

// Статистика по стадиям
const stageStats = computed(() => {
  const stats: Record<string, number> = {};
  props.peppers.forEach((pepper) => {
    stats[pepper.stage] = (stats[pepper.stage] || 0) + 1;
  });
  return stats;
});

// Статистика по местам посадки
const locationStats = computed(() => {
  const stats: Record<string, number> = {};
  props.peppers.forEach((pepper) => {
    const location = pepper.location?.type || 'неизвестно';
    stats[location] = (stats[location] || 0) + 1;
  });
  return stats;
});

// Методы
function getStageColor(stage: string) {
  const colors = {
    проращивание: 'blue',
    рассада: 'green',
    вегетация: 'orange',
    плодоношение: 'red',
    'сбор урожая': 'purple',
  };
  return colors[stage as keyof typeof colors] || 'grey';
}

function getStageLabel(stage: string) {
  const labels = {
    проращивание: 'Проращивание',
    рассада: 'Рассада',
    вегетация: 'Вегетация',
    плодоношение: 'Плодоношение',
    'сбор урожая': 'Сбор урожая',
  };
  return labels[stage as keyof typeof labels] || stage;
}

function getLocationLabel(location: string) {
  const labels = {
    грунт: 'Грунт',
    теплица: 'Теплица',
    огород: 'Огород',
    горшок: 'Горшок',
    'кассета для проращивания': 'Кассета',
    неизвестно: 'Неизвестно',
  };
  return labels[location as keyof typeof labels] || location;
}
</script>
