<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 900px; max-width: 95vw; max-height: 90vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">История ухода за "{{ localPepper.name }}"</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto">
        <q-tabs
          v-model="activeTab"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="watering" icon="water_drop" label="Полив" />
          <q-tab name="fertilizing" icon="eco" label="Удобрения" />
          <q-tab name="treatment" icon="healing" label="Обработки" />
          <q-tab name="observation" icon="visibility" label="Наблюдения" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- Полив -->
          <q-tab-panel name="watering" class="q-pa-none">
            <PepperWateringHistory
              :watering-history="localPepper.wateringHistory"
              @update="updateWateringHistory"
            />
          </q-tab-panel>

          <!-- Удобрения -->
          <q-tab-panel name="fertilizing" class="q-pa-none">
            <PepperFertilizingHistoryManager
              :fertilizing-history="localPepper.fertilizingHistory"
              @update="updateFertilizingHistory"
            />
          </q-tab-panel>

          <!-- Обработки -->
          <q-tab-panel name="treatment" class="q-pa-none">
            <PepperTreatmentHistoryManager
              :treatment-history="localPepper.treatmentHistory"
              @update="updateTreatmentHistory"
            />
          </q-tab-panel>

          <!-- Наблюдения -->
          <q-tab-panel name="observation" class="q-pa-none">
            <PepperObservationHistoryManager
              :observation-log="localPepper.observationLog"
              @update="updateObservationHistory"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type {
  Pepper,
  WateringEntry,
  FertilizingEntry,
  TreatmentEntry,
  Observation,
} from './models';
import type { PlantProblem } from 'stores/plant-problems-library';
import HistoryEntryDialog from './HistoryEntryDialog.vue';
import PepperWateringHistory from './PepperWateringHistory.vue';
import PepperFertilizingHistoryManager from './PepperFertilizingHistoryManager.vue';
import PepperTreatmentHistoryManager from './PepperTreatmentHistoryManager.vue';
import PepperObservationHistoryManager from './PepperObservationHistoryManager.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    pepper: Pepper;
    initialTab?: 'watering' | 'fertilizing' | 'treatment' | 'observation';
  }>(),
  {
    initialTab: 'watering',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update', updates: Partial<Pepper>): void;
}>();

const $q = useQuasar();

// Локальное реактивное состояние, синхронизированное с props
const localPepper = ref<Pepper>({ ...props.pepper });

// Синхронизируем локальное состояние с props
watch(
  () => props.pepper,
  (newPepper) => {
    localPepper.value = { ...newPepper };
  },
  { deep: true },
);

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const activeTab = ref<'watering' | 'fertilizing' | 'treatment' | 'observation'>(props.initialTab);

// Синхронизируем activeTab с initialTab при открытии диалога
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = props.initialTab;
    }
  }
);

watch(
  () => props.initialTab,
  (newTab) => {
    if (showDialog.value) {
      activeTab.value = newTab;
    }
  }
);

// Функции обновления истории
function updateWateringHistory(history: WateringEntry[]) {
  localPepper.value.wateringHistory = history;
  emit('update', { wateringHistory: history });
}

function updateFertilizingHistory(history: FertilizingEntry[]) {
  localPepper.value.fertilizingHistory = history;
  emit('update', { fertilizingHistory: history });
}

function updateTreatmentHistory(history: TreatmentEntry[]) {
  localPepper.value.treatmentHistory = history;
  emit('update', { treatmentHistory: history });
}

function updateObservationHistory(history: Observation[]) {
  localPepper.value.observationLog = history;
  emit('update', { observationLog: history });
}
</script>
