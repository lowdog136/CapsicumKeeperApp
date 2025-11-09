<template>
  <q-card class="my-card q-mb-md">
    <div class="pepper-image-container">
      <q-img
        v-if="pepper.photoUrl"
        :src="pepper.photoUrl"
        :alt="pepper.name"
        style="height: 200px; object-fit: cover"
      />
      <div v-else class="default-image">
        <q-icon name="local_florist" size="80px" color="grey-4" />
        <div class="text-grey-5 text-body2 q-mt-sm">Нет фото</div>
      </div>
    </div>

    <q-card-section class="card-content">
      <!-- Заголовок и основные действия -->
      <div :class="['card-header', { 'card-header--mobile': isMobile }]">
        <div class="card-title">
          <div class="text-h6">{{ pepper.name }}</div>
          <q-badge v-if="!isMobile" class="pepper-id-badge" size="sm">{{ pepper.id }}</q-badge>
        </div>
        <div v-if="!isMobile" class="row items-center q-gutter-xs">
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
        <div v-else class="row items-center justify-between q-gutter-sm full-width mobile-header-actions">
          <q-chip dense size="sm" color="primary" text-color="white" icon="tag">
            {{ pepper.id }}
          </q-chip>
          <q-btn flat round dense icon="more_vert">
            <q-menu cover auto-close>
              <q-list dense>
                <q-item clickable v-close-popup @click="editPepper">
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Редактировать</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="showDeleteDialog = true">
                  <q-item-section avatar>
                    <q-icon name="delete" color="negative" />
                  </q-item-section>
                  <q-item-section>Удалить</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-if="pepper.seedlingSlot"
                  clickable
                  v-close-popup
                  @click="openSeedlingTray"
                >
                  <q-item-section avatar>
                    <q-icon name="grid_view" color="primary" />
                  </q-item-section>
                  <q-item-section>Кассета «{{ pepper.seedlingSlot.trayName || 'Без названия' }}»</q-item-section>
                </q-item>
                <q-item
                  v-else
                  clickable
                  v-close-popup
                  @click="assignToSeedlingTray"
                >
                  <q-item-section avatar>
                    <q-icon name="grid_view" color="primary" />
                  </q-item-section>
                  <q-item-section>Поместить в кассету</q-item-section>
                </q-item>
                <q-item
                  v-if="pepper.seedlingSlot"
                  clickable
                  v-close-popup
                  @click="removeFromSeedlingTray"
                >
                  <q-item-section avatar>
                    <q-icon name="close" color="negative" />
                  </q-item-section>
                  <q-item-section>Убрать из кассеты</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="toggleFavorite">
                  <q-item-section avatar>
                    <q-icon :name="pepper.isFavorite ? 'star' : 'star_border'" color="amber" />
                  </q-item-section>
                  <q-item-section>
                    {{ pepper.isFavorite ? 'Убрать из избранного' : 'В избранное' }}
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="showHistory = true">
                  <q-item-section avatar>
                    <q-icon name="history" />
                  </q-item-section>
                  <q-item-section>История ухода</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="showCharts = true">
                  <q-item-section avatar>
                    <q-icon name="analytics" color="info" />
                  </q-item-section>
                  <q-item-section>Графики и статистика</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="showQuickActions = true">
                  <q-item-section avatar>
                    <q-icon name="flash_on" color="accent" />
                  </q-item-section>
                  <q-item-section>Быстрые действия</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Информация о сорте -->
      <div class="q-mb-sm">
        <span class="text-subtitle2">Сорт: </span>{{ pepper.variety }}
        <PepperVarietyInfo :pepper="pepper" />
      </div>

      <!-- Описание -->
      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">Описание</div>
        <div class="text-body2">{{ pepper.description || 'без описания' }}</div>
      </div>

      <!-- Основная информация -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <div class="text-caption text-grey-6 q-mb-xs">Дата посадки</div>
          <div class="text-body2">{{ formatDate(pepper.plantingDate) }}</div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey-6 q-mb-xs">Растет</div>
          <div class="text-body2">{{ daysSincePlanting }} дн.</div>
        </div>
      </div>

      <!-- Место посадки -->
      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">Место посадки</div>
        <div class="row items-center q-gutter-xs">
          <q-chip
            :color="getLocationColor(pepper.location?.type)"
            text-color="white"
            size="sm"
            :label="locationText"
          />
          <q-btn flat round icon="edit" size="xs" @click="changeLocation" />
        </div>
      </div>

      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">Кассета для рассады</div>
        <div v-if="pepper.seedlingSlot" class="row items-center q-gutter-xs">
          <q-chip color="primary" text-color="white" size="sm" icon="grid_view">
            {{ pepper.seedlingSlot.trayName || 'Кассета' }}
            · R{{ pepper.seedlingSlot.row }} · C{{ pepper.seedlingSlot.column }}
          </q-chip>
          <q-btn flat round icon="open_in_new" size="xs" @click="openSeedlingTray" />
          <q-btn flat round icon="close" size="xs" color="negative" @click="removeFromSeedlingTray" />
        </div>
        <div v-else class="row items-center q-gutter-xs">
          <q-chip color="grey-5" text-color="white" size="sm" icon="grid_view">
            Не назначена
          </q-chip>
          <q-btn outline dense size="sm" icon="add" label="Поместить" @click="assignToSeedlingTray" />
        </div>
      </div>

      <!-- Стадия роста -->
      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">Стадия роста</div>
        <div class="row items-center q-gutter-xs">
          <q-chip
            :color="getStageColor(pepper.stage)"
            text-color="white"
            size="sm"
            :label="pepper.stage"
          />
          <q-btn flat round icon="edit" size="xs" @click="changeStage" />
        </div>
      </div>

    </q-card-section>

    <q-separator />

    <!-- Нижний блок: Статистика и действия -->
    <q-card-section class="card-footer q-pt-sm q-pb-sm">
      <!-- Статистика -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div :class="['text-center', isMobile ? 'col-6' : 'col-4']">
          <div 
            class="stat-item cursor-pointer"
            @click="openHistoryTab('watering')"
          >
            <div class="text-caption text-grey-6 q-mb-xs">Поливов</div>
            <div class="text-h6 text-weight-bold">{{ pepper.wateringHistory?.length || 0 }}</div>
          </div>
        </div>
        <div :class="['text-center', isMobile ? 'col-6' : 'col-4']">
          <div 
            class="stat-item cursor-pointer"
            @click="openHistoryTab('fertilizing')"
          >
            <div class="text-caption text-grey-6 q-mb-xs">Удобрений</div>
            <div class="text-h6 text-weight-bold">{{ pepper.fertilizingHistory?.length || 0 }}</div>
          </div>
        </div>
        <div :class="['text-center', isMobile ? 'col-6' : 'col-4']">
          <div 
            class="stat-item cursor-pointer"
            @click="openHistoryTab('observation')"
          >
            <div class="text-caption text-grey-6 q-mb-xs">Наблюдений</div>
            <div class="text-h6 text-weight-bold">{{ pepper.observationLog?.length || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Иконки действий -->
      <div class="row items-center justify-center q-gutter-sm" :class="{'mobile-actions-row': isMobile}">
        <q-btn 
          flat 
          round 
          color="info" 
          icon="analytics" 
          size="sm" 
          @click="showCharts = true"
        >
          <q-tooltip>Графики и статистика</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          round 
          color="secondary" 
          icon="history" 
          size="sm" 
          @click="showHistory = true"
        >
          <q-tooltip>История ухода</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          round 
          color="accent" 
          icon="flash_on" 
          size="sm" 
          @click="showQuickActions = true"
        >
          <q-tooltip>Быстрые действия</q-tooltip>
        </q-btn>
        <q-btn
          v-if="!isMobile"
          flat
          round
          :color="pepper.isFavorite ? 'amber' : 'grey'"
          :icon="pepper.isFavorite ? 'star' : 'star_border'"
          size="sm"
          @click="toggleFavorite"
        >
          <q-tooltip>{{ pepper.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное' }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="!isMobile"
          flat
          round
          color="primary"
          icon="grid_view"
          size="sm"
          @click="pepper.seedlingSlot ? openSeedlingTray() : assignToSeedlingTray()"
        >
          <q-tooltip>
            {{ pepper.seedlingSlot ? 'Открыть кассету' : 'Поместить в кассету' }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <!-- Диалог удаления -->
    <DeletePepperDialog
      v-model="showDeleteDialog"
      :pepper-name="pepper.name"
      @confirm="confirmDelete"
    />

    <!-- Диалог изменения стадии -->
    <ChangeStageDialog v-model="showStageDialog" :current-stage="pepper.stage" @save="saveStage" />

    <!-- Диалог изменения места посадки -->
    <ChangeLocationDialog
      v-model="showLocationDialog"
      :current-location="pepper.location"
      @save="saveLocation"
    />

    <!-- Новые компоненты -->
    <PepperHistoryManager 
      v-model="showHistory" 
      :pepper="pepper" 
      :initial-tab="historyInitialTab"
      @update="handleUpdate" 
    />

    <PepperQuickActions v-model="showQuickActions" :pepper="pepper" @update="handleUpdate" />

    <!-- Графики и статистика -->
    <PepperChartsDialog v-model="showCharts" :pepper="pepper" />
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Pepper, HeatLevel } from './models';
import PepperHistoryManager from './PepperHistoryManager.vue';
import PepperQuickActions from './PepperQuickActions.vue';
import PepperVarietyInfo from './PepperVarietyInfo.vue';
import PepperChartsDialog from './PepperChartsDialog.vue';
import DeletePepperDialog from './DeletePepperDialog.vue';
import ChangeStageDialog from './ChangeStageDialog.vue';
import ChangeLocationDialog from './ChangeLocationDialog.vue';

const props = defineProps<{ pepper: Pepper }>();
const emit = defineEmits<{
  (e: 'update:stage', value: Pepper['stage']): void;
  (e: 'update:location', value: Pepper['location']): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-favorite', id: string): void;
  (e: 'edit', pepper: Pepper): void;
  (e: 'update', updates: Partial<Pepper>): void;
  (e: 'assign-to-seedling-tray', pepperId: string): void;
  (e: 'remove-from-seedling-tray', pepperId: string): void;
  (e: 'open-seedling-tray', payload: { trayId: string; pepperId: string }): void;
}>();

const $q = useQuasar();

// Состояние
const historyInitialTab = ref<'watering' | 'fertilizing' | 'observation'>('watering');
const showDeleteDialog = ref(false);
const showStageDialog = ref(false);
const showLocationDialog = ref(false);
const showHistory = ref(false);
const showQuickActions = ref(false);
const showCharts = ref(false);
const newStage = ref<Pepper['stage']>(props.pepper.stage);

// Вычисляемые свойства
const isMobile = computed(() => $q.screen.lt.sm);

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

function getLocationColor(locationType?: Pepper['location']['type']) {
  if (!locationType) return 'grey';
  const colors: Record<string, string> = {
    грунт: 'brown',
    теплица: 'teal',
    огород: 'green',
    горшок: 'amber',
    'кассета для проращивания': 'blue',
  };
  return colors[locationType] || 'grey';
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

function assignToSeedlingTray() {
  emit('assign-to-seedling-tray', props.pepper.id);
}

function removeFromSeedlingTray() {
  emit('remove-from-seedling-tray', props.pepper.id);
}

function openSeedlingTray() {
  if (props.pepper.seedlingSlot?.trayId) {
    emit('open-seedling-tray', {
      trayId: props.pepper.seedlingSlot.trayId,
      pepperId: props.pepper.id,
    });
  } else {
    assignToSeedlingTray();
  }
}

function changeStage() {
  newStage.value = props.pepper.stage;
  showStageDialog.value = true;
}

function saveStage(stage: Pepper['stage']) {
  if (stage !== props.pepper.stage) {
    emit('update:stage', stage);
    showStageDialog.value = false;
  } else {
    // Если стадия не изменилась, просто закрываем диалог
    showStageDialog.value = false;
  }
}

function changeLocation() {
  showLocationDialog.value = true;
}

function saveLocation(location: Pepper['location']) {
  emit('update:location', location);
  showLocationDialog.value = false;
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

function openHistoryTab(tab: 'watering' | 'fertilizing' | 'observation') {
  historyInitialTab.value = tab;
  showHistory.value = true;
}
</script>

<style scoped>
.my-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.my-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-header--mobile {
  flex-direction: column;
  align-items: stretch;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-header-actions {
  width: 100%;
}

.card-footer {
  margin-top: auto;
}

.pepper-image-container {
  height: 200px;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
}

.default-image {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.stat-item {
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
}

.stat-item:hover {
  background-color: rgba(97, 137, 47, 0.1);
  transform: scale(1.05);
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

  .mobile-actions-row {
    flex-wrap: wrap;
    justify-content: space-around;
  }
}

/* Улучшения для планшетов */
@media (min-width: 600px) and (max-width: 1023px) {
  .my-card .q-img {
    height: 180px !important;
  }
}

/* Кастомный цвет для badge с ID перца */
.pepper-id-badge {
  background-color: #61892f !important;
  color: #ffffff !important;
}
</style>
