<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">Статистика по перцам</div>

      <!-- Основная статистика -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="local_florist" size="48px" color="primary" />
              <div class="text-h4 q-mt-sm">{{ totalPeppers }}</div>
              <div class="text-body2 text-grey-6">Всего перцев</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="favorite" size="48px" color="red" />
              <div class="text-h4 q-mt-sm">{{ favoritePeppers }}</div>
              <div class="text-body2 text-grey-6">В избранном</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="eco" size="48px" color="green" />
              <div class="text-h4 q-mt-sm">{{ activePeppers }}</div>
              <div class="text-body2 text-grey-6">Активных</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="schedule" size="48px" color="orange" />
              <div class="text-h4 q-mt-sm">{{ averageAge }}</div>
              <div class="text-body2 text-grey-6">Средний возраст (дн.)</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Статистика по стадиям -->
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
            <div
              v-for="(count, location) in locationStats"
              :key="location"
              class="row items-center"
            >
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

      <!-- Активность ухода -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <h6>Активность ухода</h6>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-card class="text-center">
                <q-card-section class="q-pa-sm">
                  <q-icon name="water_drop" size="32px" color="blue" />
                  <div class="text-h6 q-mt-sm">{{ totalWaterings }}</div>
                  <div class="text-caption">Всего поливов</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6">
              <q-card class="text-center">
                <q-card-section class="q-pa-sm">
                  <q-icon name="eco" size="32px" color="green" />
                  <div class="text-h6 q-mt-sm">{{ totalFertilizings }}</div>
                  <div class="text-caption">Всего удобрений</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6">
              <q-card class="text-center">
                <q-card-section class="q-pa-sm">
                  <q-icon name="healing" size="32px" color="orange" />
                  <div class="text-h6 q-mt-sm">{{ totalTreatments }}</div>
                  <div class="text-caption">Всего обработок</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6">
              <q-card class="text-center">
                <q-card-section class="q-pa-sm">
                  <q-icon name="visibility" size="32px" color="purple" />
                  <div class="text-h6 q-mt-sm">{{ totalObservations }}</div>
                  <div class="text-caption">Всего наблюдений</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <h6>Последняя активность</h6>
          <q-list>
            <q-item v-if="lastWatering">
              <q-item-section avatar>
                <q-icon name="water_drop" color="blue" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Последний полив</q-item-label>
                <q-item-label caption>{{ formatDate(lastWatering.date) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="lastFertilizing">
              <q-item-section avatar>
                <q-icon name="eco" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Последнее удобрение</q-item-label>
                <q-item-label caption>{{ formatDate(lastFertilizing.date) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="lastTreatment">
              <q-item-section avatar>
                <q-icon name="healing" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Последняя обработка</q-item-label>
                <q-item-label caption>{{ formatDate(lastTreatment.date) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="lastObservation">
              <q-item-section avatar>
                <q-icon name="visibility" color="purple" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Последнее наблюдение</q-item-label>
                <q-item-label caption>{{ formatDate(lastObservation.date) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Pepper } from './models';

const props = defineProps<{
  peppers: Pepper[];
}>();

// Вычисляемые свойства
const totalPeppers = computed(() => props.peppers.length);

const favoritePeppers = computed(() => props.peppers.filter((p) => p.isFavorite).length);

const activePeppers = computed(() => props.peppers.filter((p) => p.stage !== 'сбор урожая').length);

const averageAge = computed(() => {
  if (props.peppers.length === 0) return 0;

  const totalAge = props.peppers.reduce((sum, pepper) => {
    const plantDate = new Date(pepper.plantingDate);
    const now = new Date();
    const age = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + age;
  }, 0);

  return Math.round(totalAge / props.peppers.length);
});

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

// Активность ухода
const totalWaterings = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.wateringHistory?.length || 0), 0),
);

const totalFertilizings = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.fertilizingHistory?.length || 0), 0),
);

const totalTreatments = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.treatmentHistory?.length || 0), 0),
);

const totalObservations = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.observationLog?.length || 0), 0),
);

// Последняя активность
const lastWatering = computed(() => {
  const allWaterings = props.peppers.flatMap((p) =>
    (p.wateringHistory || []).map((w) => ({ ...w, pepperName: p.name })),
  );
  return allWaterings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastFertilizing = computed(() => {
  const allFertilizings = props.peppers.flatMap((p) =>
    (p.fertilizingHistory || []).map((f) => ({ ...f, pepperName: p.name })),
  );
  return allFertilizings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastTreatment = computed(() => {
  const allTreatments = props.peppers.flatMap((p) =>
    (p.treatmentHistory || []).map((t) => ({ ...t, pepperName: p.name })),
  );
  return allTreatments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastObservation = computed(() => {
  const allObservations = props.peppers.flatMap((p) =>
    (p.observationLog || []).map((o) => ({ ...o, pepperName: p.name })),
  );
  return allObservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}
</script>
