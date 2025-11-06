<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Изменить стадию роста</div>
      </q-card-section>
      <q-card-section>
        <q-select v-model="newStage" :options="stages" label="Новая стадия" outlined />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="cancel" />
        <q-btn flat label="Сохранить" color="primary" @click="saveStage" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pepper } from './models';

interface Props {
  modelValue: boolean;
  currentStage: Pepper['stage'];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', stage: Pepper['stage']): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const newStage = ref<Pepper['stage']>(props.currentStage);

// Синхронизируем newStage при изменении currentStage
watch(
  () => props.currentStage,
  (val) => {
    newStage.value = val;
  },
);

// Константы
const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];

function saveStage() {
  if (newStage.value !== props.currentStage) {
    emit('save', newStage.value);
    showDialog.value = false;
  } else {
    // Если стадия не изменилась, просто закрываем диалог
    showDialog.value = false;
  }
}

function cancel() {
  // Сбрасываем значение при отмене
  newStage.value = props.currentStage;
  showDialog.value = false;
}
</script>
