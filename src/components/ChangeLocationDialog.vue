<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Изменить место посадки</div>
      </q-card-section>
      <q-card-section>
        <q-select
          v-model="newLocation.type"
          :options="locationTypes"
          label="Место посадки"
          outlined
          emit-value
          map-options
        />
        <q-input
          v-if="newLocation.type === 'горшок'"
          v-model="newLocation.potVolume"
          label="Объем горшка"
          outlined
          placeholder="например: 3 литра"
          class="q-mt-md"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="cancel" />
        <q-btn flat label="Сохранить" color="primary" @click="saveLocation" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pepper } from './models';

interface Props {
  modelValue: boolean;
  currentLocation: Pepper['location'];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', location: Pepper['location']): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const newLocation = ref<Pepper['location']>({
  type: props.currentLocation?.type || 'грунт',
  potVolume: props.currentLocation?.potVolume || '',
});

// Синхронизируем newLocation при изменении currentLocation
watch(
  () => props.currentLocation,
  (val) => {
    newLocation.value = {
      type: val?.type || 'грунт',
      potVolume: val?.potVolume || '',
    };
  },
  { deep: true },
);

// Константы
const locationTypes = [
  { label: 'Грунт', value: 'грунт' },
  { label: 'Теплица', value: 'теплица' },
  { label: 'Огород', value: 'огород' },
  { label: 'Горшок', value: 'горшок' },
  { label: 'Кассета для проращивания', value: 'кассета для проращивания' },
];

function saveLocation() {
  const locationChanged =
    props.currentLocation?.type !== newLocation.value.type ||
    props.currentLocation?.potVolume !== newLocation.value.potVolume;

  if (locationChanged) {
    emit('save', { ...newLocation.value });
    showDialog.value = false;
  } else {
    // Если место не изменилось, просто закрываем диалог
    showDialog.value = false;
  }
}

function cancel() {
  // Сбрасываем значение при отмене
  newLocation.value = {
    type: props.currentLocation?.type || 'грунт',
    potVolume: props.currentLocation?.potVolume || '',
  };
  showDialog.value = false;
}
</script>

