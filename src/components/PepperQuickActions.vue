<template>
  <q-dialog v-model="showDialog">
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Быстрые действия</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 q-mb-md">{{ pepper.name }}</div>

        <div class="row q-col-gutter-sm">
          <!-- Быстрый полив -->
          <div class="col-12 col-sm-6">
            <q-card class="cursor-pointer" @click="showQuickWatering = true">
              <q-card-section class="text-center">
                <q-icon name="water_drop" size="48px" color="blue" />
                <div class="text-subtitle2 q-mt-sm">Полить</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Быстрое удобрение -->
          <div class="col-12 col-sm-6">
            <q-card class="cursor-pointer" @click="showQuickFertilizing = true">
              <q-card-section class="text-center">
                <q-icon name="eco" size="48px" color="green" />
                <div class="text-subtitle2 q-mt-sm">Удобрить</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Быстрое наблюдение -->
          <div class="col-12 col-sm-6">
            <q-card class="cursor-pointer" @click="showQuickObservation = true">
              <q-card-section class="text-center">
                <q-icon name="visibility" size="48px" color="purple" />
                <div class="text-subtitle2 q-mt-sm">Наблюдение</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Изменить стадию -->
          <div class="col-12 col-sm-6">
            <q-card class="cursor-pointer" @click="showStageChange = true">
              <q-card-section class="text-center">
                <q-icon name="local_florist" size="48px" color="orange" />
                <div class="text-subtitle2 q-mt-sm">Стадия</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Быстрый полив -->
    <q-dialog v-model="showQuickWatering">
      <q-card>
        <q-card-section>
          <div class="text-h6">Быстрый полив</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="quickWatering.volume"
            type="number"
            label="Объем (мл)"
            outlined
            placeholder="200"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" @click="showQuickWatering = false" />
          <q-btn
            unelevated
            label="Полить"
            color="primary"
            @click="addQuickWatering"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Быстрое удобрение -->
    <q-dialog v-model="showQuickFertilizing">
      <q-card>
        <q-card-section>
          <div class="text-h6">Быстрое удобрение</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="quickFertilizing.note"
            label="Название удобрения"
            outlined
            placeholder="Комплексное удобрение"
          />
          <q-input
            v-model.number="quickFertilizing.grams"
            type="number"
            label="Количество (г)"
            outlined
            placeholder="10"
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" @click="showQuickFertilizing = false" />
          <q-btn
            unelevated
            label="Удобрить"
            color="primary"
            @click="addQuickFertilizing"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Быстрое наблюдение -->
    <q-dialog v-model="showQuickObservation">
      <q-card>
        <q-card-section>
          <div class="text-h6">Быстрое наблюдение</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="quickObservation.height"
            type="number"
            label="Высота (см)"
            outlined
            placeholder="15"
          />
          <q-input
            v-model="quickObservation.leafCondition"
            label="Состояние листьев"
            outlined
            placeholder="Хорошее"
            class="q-mt-md"
          />
          <q-input
            v-model="quickObservation.notes"
            label="Заметки"
            type="textarea"
            outlined
            placeholder="Дополнительные наблюдения"
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" @click="showQuickObservation = false" />
          <q-btn
            unelevated
            label="Добавить"
            color="primary"
            @click="addQuickObservation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Изменение стадии -->
    <q-dialog v-model="showStageChange">
      <q-card>
        <q-card-section>
          <div class="text-h6">Изменить стадию роста</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="newStage" :options="stages" label="Новая стадия" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" @click="showStageChange = false" />
          <q-btn unelevated label="Изменить" color="primary" @click="changeStage" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Pepper, WateringEntry, FertilizingEntry, Observation } from './models';

const props = defineProps<{
  modelValue: boolean;
  pepper: Pepper;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update', updates: Partial<Pepper>): void;
}>();

const $q = useQuasar();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const showQuickWatering = ref(false);
const showQuickFertilizing = ref(false);
const showQuickObservation = ref(false);
const showStageChange = ref(false);

const quickWatering = ref({
  volume: 200,
});

const quickFertilizing = ref({
  note: '',
  grams: 10,
});

const quickObservation = ref({
  height: 0,
  leafCondition: '',
  notes: '',
});

const newStage = ref<Pepper['stage']>(props.pepper.stage);

// Константы
const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];

// Методы
function addQuickWatering() {
  const entry: WateringEntry = {
    date: new Date().toISOString().slice(0, 10),
    volume: quickWatering.value.volume,
  };

  const history = [...(props.pepper.wateringHistory || []), entry];
  emit('update', { wateringHistory: history });

  $q.notify({
    color: 'positive',
    message: `Полив добавлен: ${quickWatering.value.volume} мл`,
    icon: 'water_drop',
  });

  // Сброс формы и закрытие диалога
  quickWatering.value.volume = 200;
  showQuickWatering.value = false;
}

function addQuickFertilizing() {
  const entry: FertilizingEntry = {
    date: new Date().toISOString().slice(0, 10),
    note: quickFertilizing.value.note,
    grams: quickFertilizing.value.grams,
  };

  const history = [...(props.pepper.fertilizingHistory || []), entry];
  emit('update', { fertilizingHistory: history });

  $q.notify({
    color: 'positive',
    message: `Удобрение добавлено: ${quickFertilizing.value.note}`,
    icon: 'eco',
  });

  // Сброс формы и закрытие диалога
  quickFertilizing.value.note = '';
  quickFertilizing.value.grams = 10;
  showQuickFertilizing.value = false;
}

function addQuickObservation() {
  const entry: Observation = {
    date: new Date().toISOString().slice(0, 10),
    height: quickObservation.value.height,
    leafCondition: quickObservation.value.leafCondition,
    notes: quickObservation.value.notes,
  };

  const history = [...(props.pepper.observationLog || []), entry];
  emit('update', { observationLog: history });

  $q.notify({
    color: 'positive',
    message: 'Наблюдение добавлено',
    icon: 'visibility',
  });

  // Сброс формы и закрытие диалога
  quickObservation.value.height = 0;
  quickObservation.value.leafCondition = '';
  quickObservation.value.notes = '';
  showQuickObservation.value = false;
}

function changeStage() {
  if (newStage.value !== props.pepper.stage) {
    const today = new Date().toISOString().slice(0, 10);
    const newStageHistory = props.pepper.stageHistory ? [...props.pepper.stageHistory] : [];
    newStageHistory.push({ date: today, stage: newStage.value });

    emit('update', {
      stage: newStage.value,
      stageHistory: newStageHistory,
    });

    $q.notify({
      color: 'positive',
      message: `Стадия изменена на: ${newStage.value}`,
      icon: 'local_florist',
    });
    
    // Закрываем диалог
    showStageChange.value = false;
  } else {
    // Если стадия не изменилась, просто закрываем диалог
    showStageChange.value = false;
  }
}
</script>
