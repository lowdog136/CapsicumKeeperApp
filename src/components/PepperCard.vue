<template>
  <q-card class="my-card q-mb-md">
    <q-img
      :src="pepper.photoUrl || 'https://via.placeholder.com/400x200?text=No+Image'"
      :alt="pepper.name"
      style="height: 200px; object-fit: cover"
    />

    <q-card-section>
      <!-- Заголовок и основные действия -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-h6">{{ pepper.name }}</div>
        <div class="row items-center q-gutter-xs">
          <q-badge color="positive" size="sm">{{ pepper.id }}</q-badge>
          <q-btn flat round icon="edit" size="sm" @click="editPepper" />
          <q-btn
            flat
            round
            icon="delete"
            size="sm"
            color="negative"
            @click="showDeleteDialog = true"
          />
        </div>
      </div>

      <!-- Информация о сорте -->
      <div class="q-mb-sm">
        <span class="text-subtitle2">Сорт: </span>{{ pepper.variety }}

        <!-- Информация о сорте из библиотеки -->
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

      <!-- Описание -->
      <div class="q-mb-sm">
        <span>{{ pepper.description }}</span>
      </div>

      <!-- Основная информация -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <div class="text-caption text-grey-6">Дата посадки</div>
          <div class="text-body2">{{ formatDate(pepper.plantingDate) }}</div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey-6">Растет</div>
          <div class="text-body2">{{ daysSincePlanting }} дн.</div>
        </div>
      </div>

      <!-- Место посадки -->
      <div class="q-mb-sm">
        <div class="text-caption text-grey-6">Место посадки</div>
        <div class="text-body2">{{ locationText }}</div>
      </div>

      <!-- Стадия роста -->
      <div class="q-mb-sm">
        <div class="text-caption text-grey-6">Стадия роста</div>
        <div class="row items-center q-gutter-sm">
          <q-chip
            :color="getStageColor(pepper.stage)"
            text-color="white"
            size="sm"
            :label="pepper.stage"
          />
          <q-btn flat round icon="edit" size="xs" @click="changeStage" />
        </div>
      </div>

      <!-- Краткая статистика -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-4">
          <div class="text-caption text-grey-6">Поливов</div>
          <div class="text-body2">{{ pepper.wateringHistory?.length || 0 }}</div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-6">Удобрений</div>
          <div class="text-body2">{{ pepper.fertilizingHistory?.length || 0 }}</div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-6">Наблюдений</div>
          <div class="text-body2">{{ pepper.observationLog?.length || 0 }}</div>
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
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat round color="primary" icon="info" @click="showDetails = true" class="q-mr-auto" />
      <q-btn flat round color="info" icon="analytics" @click="showCharts = true" />
      <q-btn flat round color="secondary" icon="history" @click="showHistory = true" />
      <q-btn flat round color="accent" icon="flash_on" @click="showQuickActions = true" />
      <q-btn
        flat
        round
        :color="pepper.isFavorite ? 'amber' : 'grey'"
        :icon="pepper.isFavorite ? 'star' : 'star_border'"
        @click="toggleFavorite"
      />
    </q-card-actions>

    <!-- Диалог удаления -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="red" text-color="white" />
          <span class="q-ml-sm">Вы уверены, что хотите удалить "{{ pepper.name }}"?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="red" @click="confirmDelete" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог изменения стадии -->
    <q-dialog v-model="showStageDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Изменить стадию роста</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="newStage" :options="stages" label="Новая стадия" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Сохранить" color="primary" @click="saveStage" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Новые компоненты -->
    <PepperDetailsDialog v-model="showDetails" :pepper="pepper" />

    <PepperHistoryManager v-model="showHistory" :pepper="pepper" @update="handleUpdate" />

    <PepperQuickActions v-model="showQuickActions" :pepper="pepper" @update="handleUpdate" />

    <!-- Заглушка для графиков -->
    <q-dialog v-model="showCharts">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Графики роста "{{ pepper.name }}"</div>
        </q-card-section>
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="analytics" size="100px" color="grey-4" />
          <div class="text-h6 q-mt-md text-grey-6">Графики в разработке</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            Здесь будут отображаться графики роста, полива и удобрений
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Pepper, HeatLevel } from './models';
import PepperDetailsDialog from './PepperDetailsDialog.vue';
import PepperHistoryManager from './PepperHistoryManager.vue';
import PepperQuickActions from './PepperQuickActions.vue';

const props = defineProps<{ pepper: Pepper }>();
const emit = defineEmits<{
  (e: 'update:stage', value: Pepper['stage']): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-favorite', id: string): void;
  (e: 'edit', pepper: Pepper): void;
  (e: 'update', updates: Partial<Pepper>): void;
}>();

const $q = useQuasar();

// Состояние
const showDeleteDialog = ref(false);
const showStageDialog = ref(false);
const showDetails = ref(false);
const showHistory = ref(false);
const showQuickActions = ref(false);
const showCharts = ref(false);
const newStage = ref<Pepper['stage']>(props.pepper.stage);

// Константы
const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];

// Вычисляемые свойства
const daysSincePlanting = computed(() => {
  if (!props.pepper.plantingDate) return '-';
  const plantDate = new Date(props.pepper.plantingDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : '-';
});

const locationText = computed(() => {
  if (props.pepper.location?.type === 'горшок') {
    return `Горшок, объем: ${props.pepper.location?.potVolume ?? '-'}`;
  }
  return props.pepper.location?.type
    ? props.pepper.location.type.charAt(0).toUpperCase() + props.pepper.location.type.slice(1)
    : '-';
});

const lastWatering = computed(() => {
  const history = props.pepper.wateringHistory;
  return history && history.length ? history[history.length - 1] : null;
});

const lastFertilizing = computed(() => {
  const history = props.pepper.fertilizingHistory;
  return history && history.length ? history[history.length - 1] : null;
});

// Методы
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

function editPepper() {
  emit('edit', props.pepper);
}

function confirmDelete() {
  emit('delete', props.pepper.id);
}

function toggleFavorite() {
  emit('toggle-favorite', props.pepper.id);
}

function changeStage() {
  newStage.value = props.pepper.stage;
  showStageDialog.value = true;
}

function saveStage() {
  if (newStage.value !== props.pepper.stage) {
    emit('update:stage', newStage.value);
  }
}

function handleUpdate(updates: Partial<Pepper>) {
  // Эмитим событие для обновления перца
  emit('update', updates);
  $q.notify({
    color: 'positive',
    message: 'Изменения сохранены',
    icon: 'check_circle',
  });
}
</script>

<style scoped>
.my-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.my-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Улучшения для мобильных устройств */
@media (max-width: 599px) {
  .my-card {
    margin-bottom: 1rem;
  }

  .my-card .q-img {
    height: 150px !important;
  }

  .my-card .q-card-section {
    padding: 12px;
  }

  .my-card .text-h6 {
    font-size: 1.1rem;
  }

  .my-card .text-subtitle2 {
    font-size: 0.9rem;
  }

  .my-card .text-caption {
    font-size: 0.75rem;
  }
}

/* Улучшения для планшетов */
@media (min-width: 600px) and (max-width: 1023px) {
  .my-card .q-img {
    height: 180px !important;
  }
}
</style>
