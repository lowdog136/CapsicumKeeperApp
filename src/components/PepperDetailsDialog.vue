<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 800px; max-width: 90vw; max-height: 90vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ pepper.name }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto">
        <q-carousel
          v-model="activeSlide"
          animated
          arrows
          navigation
          infinite
          class="rounded-borders"
        >
          <!-- Основная информация -->
          <q-carousel-slide name="info" class="column no-wrap">
            <div class="row fit justify-start items-start q-gutter-xs">
              <div class="col-12 col-md-6 q-pa-md">
                <q-img
                  :src="pepper.photoUrl || 'https://via.placeholder.com/400x300?text=No+Image'"
                  :alt="pepper.name"
                  style="height: 300px; object-fit: cover"
                  class="rounded-borders q-mb-md"
                />

                <h5>{{ pepper.name }}</h5>
                <p class="text-grey-6">{{ pepper.description }}</p>

                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-6">
                    <q-chip
                      :color="getStageColor(pepper.stage)"
                      text-color="white"
                      size="md"
                      :label="pepper.stage"
                    />
                  </div>
                  <div class="col-6">
                    <q-chip color="primary" text-color="white" size="md" :label="pepper.variety" />
                  </div>
                </div>

                <!-- Информация о сорте из библиотеки -->
                <div v-if="pepper.varietyInfo" class="q-mb-md">
                  <q-card flat bordered class="bg-blue-1">
                    <q-card-section class="q-pa-sm">
                      <div class="text-subtitle2 q-mb-sm">Информация о сорте</div>
                      <div class="row items-center q-gutter-xs q-mb-sm">
                        <q-chip
                          :class="getHeatLevelInfo(pepper.varietyInfo.heatLevel).color === 'mild-custom' ? 'mild-heat-chip' : ''"
                          :color="getHeatLevelInfo(pepper.varietyInfo.heatLevel).color === 'mild-custom' ? undefined : getHeatLevelInfo(pepper.varietyInfo.heatLevel).color"
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
                            {{ pepper.varietyInfo.plantHeight.min }}-{{
                              pepper.varietyInfo.plantHeight.max
                            }}
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
              </div>

              <div class="col-12 col-md-6 q-pa-md">
                <h6>Основная информация</h6>
                <q-list>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Дата посадки</q-item-label>
                      <q-item-label>{{ formatDate(pepper.plantingDate) }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Растет</q-item-label>
                      <q-item-label>{{ daysSincePlanting }} дней</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label caption>Место посадки</q-item-label>
                      <q-item-label>{{ locationText }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item v-if="pepper.soilExtras">
                    <q-item-section>
                      <q-item-label caption>Почвенные добавки</q-item-label>
                      <q-item-label>
                        <div v-if="pepper.soilExtras.hasDrainage">
                          Дренаж: {{ pepper.soilExtras.drainage }}
                        </div>
                        <div v-if="pepper.soilExtras.hasSoilImprovement">
                          Улучшение почвы: {{ pepper.soilExtras.soilImprovement }}
                        </div>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <!-- История стадий роста -->
                <div v-if="pepper.stageHistory?.length" class="q-mt-md">
                  <h6>История стадий роста</h6>
                  <q-list dense>
                    <q-item v-for="(item, idx) in pepper.stageHistory" :key="idx">
                      <q-item-section>
                        <q-item-label>{{ formatDate(item.date) }} — {{ item.stage }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <!-- История мест посадки -->
                <div v-if="pepper.locationHistory?.length" class="q-mt-md">
                  <h6>История мест посадки</h6>
                  <q-list dense>
                    <q-item v-for="(item, idx) in pepper.locationHistory" :key="idx">
                      <q-item-section>
                        <q-item-label>
                          {{ formatDate(item.date) }} — {{ item.type }}
                          <span v-if="item.potVolume">({{ item.potVolume }})</span>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </div>
          </q-carousel-slide>

          <!-- Статистика -->
          <q-carousel-slide name="stats" class="column no-wrap">
            <div class="row fit justify-start items-start q-gutter-xs">
              <div class="col-12 q-pa-md">
                <h5>Статистика по растению</h5>

                <div class="row q-col-gutter-md q-mb-lg">
                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card class="text-center">
                      <q-card-section>
                        <q-icon name="water_drop" size="48px" color="blue" />
                        <div class="text-h4 q-mt-sm">{{ totalWatered }} мл</div>
                        <div class="text-body2 text-grey-6">Всего полито</div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card class="text-center">
                      <q-card-section>
                        <q-icon name="eco" size="48px" color="green" />
                        <div class="text-h4 q-mt-sm">{{ totalFertilized }} г</div>
                        <div class="text-body2 text-grey-6">Всего удобрений</div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card class="text-center">
                      <q-card-section>
                        <q-icon name="healing" size="48px" color="orange" />
                        <div class="text-h4 q-mt-sm">{{ totalTreatments }}</div>
                        <div class="text-body2 text-grey-6">Обработок</div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div class="col-12 col-sm-6 col-md-3">
                    <q-card class="text-center">
                      <q-card-section>
                        <q-icon name="visibility" size="48px" color="purple" />
                        <div class="text-h4 q-mt-sm">{{ totalObservations }}</div>
                        <div class="text-body2 text-grey-6">Наблюдений</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <!-- Графики и диаграммы можно добавить здесь -->
                <div class="text-center q-pa-xl">
                  <q-icon name="analytics" size="100px" color="grey-4" />
                  <div class="text-h6 q-mt-md text-grey-6">Графики в разработке</div>
                  <div class="text-body2 text-grey-5">Здесь будут графики роста и ухода</div>
                </div>
              </div>
            </div>
          </q-carousel-slide>
        </q-carousel>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Статистика" color="primary" @click="activeSlide = 'stats'" />
        <q-btn flat label="Информация" color="primary" @click="activeSlide = 'info'" />
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Pepper, HeatLevel } from './models';

const props = defineProps<{
  modelValue: boolean;
  pepper: Pepper;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const activeSlide = ref('info');

// Вычисляемые свойства
const daysSincePlanting = computed(() => {
  if (!props.pepper.plantingDate) return '-';
  const plantDate = new Date(props.pepper.plantingDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : '-';
});

const locationText = computed(() => {
  const location = props.pepper.location;
  
  // Если location отсутствует
  if (!location) {
    return '-';
  }
  
  // Если location - это строка (старый формат данных)
  if (typeof location === 'string') {
    return location;
  }
  
  // Если location не является объектом
  if (typeof location !== 'object' || Array.isArray(location)) {
    return '-';
  }
  
  // Если location.type отсутствует или не является строкой
  if (!location.type || typeof location.type !== 'string') {
    return '-';
  }
  
  // Обработка типа "горшок"
  if (location.type === 'горшок') {
    const volume = location.potVolume || '-';
    return `Горшок, объем: ${volume}`;
  }
  
  // Для остальных типов - форматируем первую букву заглавной
  const locationType = String(location.type);
  return locationType.charAt(0).toUpperCase() + locationType.slice(1);
});

const totalWatered = computed(() =>
  (props.pepper.wateringHistory || []).reduce((sum, w) => sum + (w.volume || 0), 0),
);

const totalFertilized = computed(() =>
  (props.pepper.fertilizingHistory || []).reduce((sum, f) => sum + (f.grams || 0), 0),
);

const totalTreatments = computed(() => (props.pepper.treatmentHistory || []).length);

const totalObservations = computed(() => (props.pepper.observationLog || []).length);

// Методы
function getHeatLevelInfo(heatLevel: HeatLevel) {
  const heatLevels = {
    'no-heat': { name: 'Без остроты', color: 'green', shuRange: '0 SHU' },
    'very-mild': { name: 'Очень мягкий', color: 'light-green', shuRange: '100-500 SHU' },
    mild: { name: 'Мягкий', color: 'mild-custom', shuRange: '500-2500 SHU' },
    medium: { name: 'Средний', color: 'orange', shuRange: '2500-8000 SHU' },
    hot: { name: 'Острый', color: 'red', shuRange: '8000-50000 SHU' },
    'very-hot': { name: 'Очень острый', color: 'deep-orange', shuRange: '50000-100000 SHU' },
    'extremely-hot': { name: 'Экстремально острый', color: 'purple', shuRange: '100000+ SHU' },
  };
  return heatLevels[heatLevel] || heatLevels['mild'];
}

function getStageColor(stage: Pepper['stage']) {
  const colors = {
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
  return new Date(dateString).toLocaleDateString('ru-RU');
}
</script>

<style scoped>
/* Кастомный темный цвет для тега "Мягкий" */
.mild-heat-chip {
  background-color: #e65100 !important;
  color: #ffffff !important;
}
</style>
