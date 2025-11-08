<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card class="charts-card">
      <q-card-section class="row items-center q-pb-none charts-header">
        <div class="text-h6">Графики и статистика "{{ pepper.name }}"</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none charts-scroll">
        <!-- Общая статистика -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card>
              <q-card-section class="text-center">
                <q-icon name="water_drop" size="48px" color="blue" />
                <div class="text-h4 q-mt-sm">{{ totalWaterings }}</div>
                <div class="text-body2 text-grey-6">Поливов</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card>
              <q-card-section class="text-center">
                <q-icon name="eco" size="48px" color="green" />
                <div class="text-h4 q-mt-sm">{{ totalFertilizings }}</div>
                <div class="text-body2 text-grey-6">Удобрений</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card>
              <q-card-section class="text-center">
                <q-icon name="visibility" size="48px" color="purple" />
                <div class="text-h4 q-mt-sm">{{ totalObservations }}</div>
                <div class="text-body2 text-grey-6">Наблюдений</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-card>
              <q-card-section class="text-center">
                <q-icon name="calendar_today" size="48px" color="orange" />
                <div class="text-h4 q-mt-sm">{{ daysSincePlanting }}</div>
                <div class="text-body2 text-grey-6">Дней растет</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- График поливов по времени -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">График поливов</div>
            <div v-if="wateringChartData.length === 0" class="text-center q-pa-lg text-grey-6">
              Нет данных о поливах
            </div>
            <div v-else class="watering-chart">
              <div
                v-for="(item, index) in wateringChartData"
                :key="index"
                class="chart-bar-container q-mb-xs"
              >
                <div class="row items-center">
                  <div class="col-3 text-caption text-grey-6">{{ item.date }}</div>
                  <div class="col-9">
                    <div class="row items-center q-gutter-xs">
                      <q-linear-progress
                        :value="item.volume / maxWateringVolume"
                        color="blue"
                        class="col"
                        style="height: 24px"
                      />
                      <div class="text-caption text-weight-medium" style="min-width: 50px">
                        {{ item.volume }} мл
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- График удобрений по времени -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">График удобрений</div>
            <div v-if="fertilizingChartData.length === 0" class="text-center q-pa-lg text-grey-6">
              Нет данных об удобрениях
            </div>
            <div v-else class="fertilizing-chart">
              <div
                v-for="(item, index) in fertilizingChartData"
                :key="index"
                class="chart-bar-container q-mb-xs"
              >
                <div class="row items-center">
                  <div class="col-3 text-caption text-grey-6">{{ item.date }}</div>
                  <div class="col-9">
                    <div class="row items-center q-gutter-xs">
                      <q-linear-progress
                        :value="item.grams / maxFertilizingGrams"
                        color="green"
                        class="col"
                        style="height: 24px"
                      />
                      <div class="text-caption text-weight-medium" style="min-width: 50px">
                        {{ item.grams }} г
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Статистика по элементам -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Статистика по элементам</div>
            <div v-if="elementStats.totalGrams === 0" class="text-center q-pa-lg text-grey-6">
              Нет данных о составе удобрений
            </div>
            <div v-else>
              <!-- Макроэлементы -->
              <div class="q-mb-lg">
                <div class="text-subtitle2 q-mb-sm">Макроэлементы (г)</div>
                <div
                  v-for="element in macroElementsList"
                  :key="element.symbol"
                  class="element-stat-item q-mb-sm"
                >
                  <div class="row items-center">
                    <div class="col-3">
                      <div class="text-weight-medium">{{ element.symbol }}</div>
                      <div class="text-caption text-grey-6">{{ element.name }}</div>
                    </div>
                    <div class="col-7">
                      <q-linear-progress
                        :value="getElementProgress(element.symbol, 'macro')"
                        :color="getElementColor(element.symbol, 'macro')"
                        class="q-mt-xs"
                        style="height: 20px"
                      />
                    </div>
                    <div class="col-2 text-right">
                      <div class="text-weight-medium">{{ elementStats.macro[element.symbol]?.toFixed(1) || 0 }}</div>
                      <div class="text-caption text-grey-6">г</div>
                    </div>
                  </div>
                  <div v-if="isElementExcessive(element.symbol, 'macro')" class="q-mt-xs">
                    <q-banner dense class="bg-warning text-white q-pa-xs">
                      <template v-slot:avatar>
                        <q-icon name="warning" />
                      </template>
                      <div class="text-caption">Возможен переизбыток</div>
                    </q-banner>
                  </div>
                </div>
              </div>

              <!-- Микроэлементы -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Микроэлементы (г)</div>
                <div
                  v-for="element in microElementsList"
                  :key="element.symbol"
                  class="element-stat-item q-mb-sm"
                >
                  <div class="row items-center">
                    <div class="col-3">
                      <div class="text-weight-medium">{{ element.symbol }}</div>
                      <div class="text-caption text-grey-6">{{ element.name }}</div>
                    </div>
                    <div class="col-7">
                      <q-linear-progress
                        :value="getElementProgress(element.symbol, 'micro')"
                        :color="getElementColor(element.symbol, 'micro')"
                        class="q-mt-xs"
                        style="height: 20px"
                      />
                    </div>
                    <div class="col-2 text-right">
                      <div class="text-weight-medium">{{ elementStats.micro[element.symbol]?.toFixed(2) || 0 }}</div>
                      <div class="text-caption text-grey-6">г</div>
                    </div>
                  </div>
                  <div v-if="isElementExcessive(element.symbol, 'micro')" class="q-mt-xs">
                    <q-banner dense class="bg-warning text-white q-pa-xs">
                      <template v-slot:avatar>
                        <q-icon name="warning" />
                      </template>
                      <div class="text-caption">Возможен переизбыток</div>
                    </q-banner>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- История стадий роста -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">История стадий роста</div>
            <div v-if="stageHistoryData.length === 0" class="text-center q-pa-lg text-grey-6">
              Нет данных о смене стадий
            </div>
            <div v-else class="stage-timeline">
              <div
                v-for="(stage, index) in stageHistoryData"
                :key="index"
                class="timeline-item q-mb-md"
              >
                <div class="row items-center">
                  <div class="col-3">
                    <q-chip
                      :color="getStageColor(stage.stage)"
                      text-color="white"
                      size="sm"
                      :label="stage.stage"
                    />
                  </div>
                  <div class="col-6 text-caption text-grey-6">
                    {{ formatDate(stage.date) }}
                  </div>
                  <div class="col-3 text-right text-caption text-grey-6">
                    {{ stage.days }} дн.
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Статистика по месяцам -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Активность по месяцам</div>
            <div v-if="monthlyStats.length === 0" class="text-center q-pa-lg text-grey-6">
              Недостаточно данных
            </div>
            <div v-else class="monthly-stats">
              <div
                v-for="(month, index) in monthlyStats"
                :key="index"
                class="month-stat q-mb-sm"
              >
                <div class="row items-center">
                  <div class="col-3 text-caption text-weight-medium">{{ month.month }}</div>
                  <div class="col-9">
                    <div class="row q-col-gutter-xs">
                      <div class="col-4">
                        <div class="text-caption text-grey-6">Поливов</div>
                        <div class="text-body2">{{ month.waterings }}</div>
                      </div>
                      <div class="col-4">
                        <div class="text-caption text-grey-6">Удобрений</div>
                        <div class="text-body2">{{ month.fertilizings }}</div>
                      </div>
                      <div class="col-4">
                        <div class="text-caption text-grey-6">Наблюдений</div>
                        <div class="text-body2">{{ month.observations }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pepper } from './models';

interface Props {
  modelValue: boolean;
  pepper: Pepper;
}

interface WateringChartItem {
  date: string;
  volume: number;
}

interface FertilizingChartItem {
  date: string;
  grams: number;
}

interface StageHistoryItem {
  stage: Pepper['stage'];
  date: string;
  days: number;
}

interface MonthlyStat {
  month: string;
  waterings: number;
  fertilizings: number;
  observations: number;
}

interface ElementStats {
  macro: Record<string, number>;
  micro: Record<string, number>;
  totalGrams: number;
}

interface ElementInfo {
  symbol: string;
  name: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Общая статистика
const totalWaterings = computed(() => props.pepper.wateringHistory?.length || 0);
const totalFertilizings = computed(() => props.pepper.fertilizingHistory?.length || 0);
const totalObservations = computed(() => props.pepper.observationLog?.length || 0);

const daysSincePlanting = computed(() => {
  if (!props.pepper.plantingDate) return 0;
  const plantDate = new Date(props.pepper.plantingDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
});

// График поливов
const wateringChartData = computed<WateringChartItem[]>(() => {
  if (!props.pepper.wateringHistory || props.pepper.wateringHistory.length === 0) return [];
  
  return props.pepper.wateringHistory
    .map((entry) => ({
      date: formatDate(entry.date),
      volume: entry.volume || 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Последние 10 поливов
});

const maxWateringVolume = computed(() => {
  if (wateringChartData.value.length === 0) return 1;
  return Math.max(...wateringChartData.value.map((item) => item.volume), 1);
});

// График удобрений
const fertilizingChartData = computed<FertilizingChartItem[]>(() => {
  if (!props.pepper.fertilizingHistory || props.pepper.fertilizingHistory.length === 0) return [];
  
  return props.pepper.fertilizingHistory
    .map((entry) => ({
      date: formatDate(entry.date),
      grams: entry.grams || 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Последние 10 удобрений
});

const maxFertilizingGrams = computed(() => {
  if (fertilizingChartData.value.length === 0) return 1;
  return Math.max(...fertilizingChartData.value.map((item) => item.grams), 1);
});

// Статистика по элементам
const macroElementsList: ElementInfo[] = [
  { symbol: 'N', name: 'Азот' },
  { symbol: 'P', name: 'Фосфор' },
  { symbol: 'K', name: 'Калий' },
  { symbol: 'Ca', name: 'Кальций' },
  { symbol: 'Mg', name: 'Магний' },
  { symbol: 'S', name: 'Сера' },
];

const microElementsList: ElementInfo[] = [
  { symbol: 'Fe', name: 'Железо' },
  { symbol: 'Mn', name: 'Марганец' },
  { symbol: 'Zn', name: 'Цинк' },
  { symbol: 'Cu', name: 'Медь' },
  { symbol: 'B', name: 'Бор' },
  { symbol: 'Mo', name: 'Молибден' },
  { symbol: 'Cl', name: 'Хлор' },
  { symbol: 'Co', name: 'Кобальт' },
  { symbol: 'Ni', name: 'Никель' },
  { symbol: 'Si', name: 'Кремний' },
];

// Пороги для предупреждений о переизбытке (в граммах за весь период)
const excessiveThresholds = {
  macro: {
    N: 50, // Азот
    P: 30, // Фосфор
    K: 50, // Калий
    Ca: 40, // Кальций
    Mg: 20, // Магний
    S: 15, // Сера
  },
  micro: {
    Fe: 2, // Железо
    Mn: 1, // Марганец
    Zn: 0.5, // Цинк
    Cu: 0.3, // Медь
    B: 0.2, // Бор
    Mo: 0.1, // Молибден
    Cl: 1, // Хлор
    Co: 0.05, // Кобальт
    Ni: 0.1, // Никель
    Si: 1, // Кремний
  },
};

const elementStats = computed<ElementStats>(() => {
  const macro: Record<string, number> = {};
  const micro: Record<string, number> = {};
  let totalGrams = 0;

  if (!props.pepper.fertilizingHistory) {
    return { macro, micro, totalGrams };
  }

  // Инициализируем все элементы нулями
  macroElementsList.forEach((el) => {
    macro[el.symbol] = 0;
  });
  microElementsList.forEach((el) => {
    micro[el.symbol] = 0;
  });

  // Суммируем элементы из всех удобрений
  props.pepper.fertilizingHistory.forEach((entry) => {
    if (!entry.composition || !entry.grams) return;

    const grams = entry.grams;
    totalGrams += grams;

    // Обрабатываем макроэлементы
    macroElementsList.forEach((el) => {
      const percentage = entry.composition![el.symbol];
      if (percentage !== undefined && percentage > 0) {
        macro[el.symbol] += (percentage / 100) * grams;
      }
    });

    // Обрабатываем микроэлементы
    microElementsList.forEach((el) => {
      const percentage = entry.composition![el.symbol];
      if (percentage !== undefined && percentage > 0) {
        micro[el.symbol] += (percentage / 100) * grams;
      }
    });
  });

  return { macro, micro, totalGrams };
});

const maxElementValue = computed(() => {
  const allValues: number[] = [];
  Object.values(elementStats.value.macro).forEach((v) => allValues.push(v));
  Object.values(elementStats.value.micro).forEach((v) => allValues.push(v));
  return Math.max(...allValues, 1);
});

function getElementProgress(symbol: string, type: 'macro' | 'micro'): number {
  const value = elementStats.value[type][symbol] || 0;
  return value / maxElementValue.value;
}

function getElementColor(symbol: string, type: 'macro' | 'micro'): string {
  if (isElementExcessive(symbol, type)) {
    return 'warning';
  }
  return type === 'macro' ? 'green' : 'blue';
}

function isElementExcessive(symbol: string, type: 'macro' | 'micro'): boolean {
  const value = elementStats.value[type][symbol] || 0;
  const threshold = excessiveThresholds[type][symbol as keyof typeof excessiveThresholds.macro];
  return threshold !== undefined && value > threshold;
}

// История стадий роста
const stageHistoryData = computed<StageHistoryItem[]>(() => {
  if (!props.pepper.stageHistory || props.pepper.stageHistory.length === 0) {
    // Если нет истории, показываем текущую стадию
    if (props.pepper.plantingDate) {
      return [
        {
          stage: props.pepper.stage,
          date: props.pepper.plantingDate,
          days: daysSincePlanting.value,
        },
      ];
    }
    return [];
  }
  
  const history = [...props.pepper.stageHistory];
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return history.map((entry, index) => {
    const currentDate = new Date(entry.date);
    const nextDate =
      index < history.length - 1
        ? new Date(history[index + 1].date)
        : new Date();
    const days = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      stage: entry.stage,
      date: entry.date,
      days: days >= 0 ? days : 0,
    };
  });
});

// Статистика по месяцам
const monthlyStats = computed<MonthlyStat[]>(() => {
  const stats: Record<string, MonthlyStat> = {};
  
  // Поливы
  props.pepper.wateringHistory?.forEach((entry) => {
    const month = getMonthKey(entry.date);
    if (!stats[month]) {
      stats[month] = {
        month: formatMonth(entry.date),
        waterings: 0,
        fertilizings: 0,
        observations: 0,
      };
    }
    stats[month].waterings++;
  });
  
  // Удобрения
  props.pepper.fertilizingHistory?.forEach((entry) => {
    const month = getMonthKey(entry.date);
    if (!stats[month]) {
      stats[month] = {
        month: formatMonth(entry.date),
        waterings: 0,
        fertilizings: 0,
        observations: 0,
      };
    }
    stats[month].fertilizings++;
  });
  
  // Наблюдения
  props.pepper.observationLog?.forEach((entry) => {
    const month = getMonthKey(entry.date);
    if (!stats[month]) {
      stats[month] = {
        month: formatMonth(entry.date),
        waterings: 0,
        fertilizings: 0,
        observations: 0,
      };
    }
    stats[month].observations++;
  });
  
  return Object.values(stats)
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 6); // Последние 6 месяцев
});

function getStageColor(stage: Pepper['stage']) {
  const colors: Record<string, string> = {
    проращивание: 'blue',
    рассада: 'green',
    вегетация: 'orange',
    плодоношение: 'red',
    'сбор урожая': 'purple',
  };
  return colors[stage] || 'grey';
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getMonthKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
}
</script>

<style scoped>
.charts-card {
  width: min(920px, 96vw);
  max-height: calc(100vh - 12px);
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top, 0px));
}

.charts-header {
  padding-top: 12px;
  padding-bottom: 4px;
}

.charts-scroll {
  max-height: calc(100vh - 170px);
  overflow-y: auto;
  padding-bottom: 16px;
}

.chart-bar-container {
  min-height: 32px;
}

.timeline-item {
  padding-left: 8px;
  border-left: 2px solid rgba(97, 137, 47, 0.3);
}

.month-stat {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(97, 137, 47, 0.05);
}

.element-stat-item {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(97, 137, 47, 0.03);
}

@media (max-width: 599px) {
  .charts-card {
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    padding-left: calc(env(safe-area-inset-left, 0px) + 4px);
    padding-right: calc(env(safe-area-inset-right, 0px) + 4px);
  }

  .charts-header {
    padding: 20px 16px 8px;
  }

  .charts-scroll {
    max-height: calc(100vh - 160px);
    padding: 0 12px calc(16px + env(safe-area-inset-bottom, 0px));
  }
}
</style>

