<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Редактирование перца</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="saveEdit" class="q-gutter-md">
          <!-- Основная информация -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="editForm.name"
                label="Название перца*"
                outlined
                :rules="[(val) => !!val || 'Название обязательно']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="editForm.variety"
                label="Сорт*"
                outlined
                :rules="[(val) => !!val || 'Сорт обязателен']"
              />
            </div>
          </div>

          <q-input
            v-model="editForm.description"
            label="Описание"
            type="textarea"
            outlined
            rows="3"
          />

          <!-- Фото -->
          <div>
            <div class="text-subtitle2 q-mb-sm">Фото перца</div>
            <ImageUpload
              v-model="editForm.photoUrl"
              alt="Фото перца"
              @upload-complete="handleImageUploadComplete"
              @upload-error="handleImageUploadError"
            />
          </div>

          <!-- Дата посадки -->
          <q-input
            v-model="editForm.plantingDate"
            label="Дата посадки*"
            type="date"
            outlined
            :rules="[(val) => !!val || 'Дата посадки обязательна']"
          />

          <!-- Место посадки -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                v-model="editForm.location.type"
                :options="locationTypes"
                label="Место посадки*"
                outlined
                :rules="[(val) => !!val || 'Место посадки обязательно']"
              />
            </div>
            <div class="col-12 col-md-6" v-if="editForm.location.type === 'горшок'">
              <q-input
                v-model="editForm.location.potVolume"
                label="Объем горшка"
                outlined
                placeholder="например: 3 литра"
              />
            </div>
          </div>

          <!-- Почвенные добавки для горшков -->
          <div v-if="editForm.location.type === 'горшок'">
            <div class="text-subtitle2 q-mb-sm">Почвенные добавки</div>
            <SoilExtrasSelector v-model="editForm.soilExtras" />
          </div>

          <!-- Стадия роста -->
          <q-select
            v-model="editForm.stage"
            :options="stages"
            label="Стадия роста*"
            outlined
            :rules="[(val) => !!val || 'Стадия роста обязательна']"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn unelevated label="Сохранить" color="primary" @click="saveEdit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Pepper } from './models';
import ImageUpload from './ImageUpload.vue';
import SoilExtrasSelector from './SoilExtrasSelector.vue';

const props = defineProps<{
  modelValue: boolean;
  pepper: Pepper;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', updatedPepper: Partial<Pepper>): void;
}>();

const $q = useQuasar();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const editForm = ref({
  name: props.pepper.name,
  variety: props.pepper.variety,
  photoUrl: props.pepper.photoUrl,
  description: props.pepper.description,
  stage: props.pepper.stage,
  plantingDate: props.pepper.plantingDate,
  location: props.pepper.location
    ? { ...props.pepper.location }
    : { type: 'грунт' as Pepper['location']['type'], potVolume: '' },
  soilExtras: props.pepper.soilExtras
    ? { ...props.pepper.soilExtras }
    : {
        hasDrainage: false,
        drainage: null,
        hasSoilImprovement: false,
        soilImprovement: null,
      },
});

// Константы
const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];

const locationTypes = [
  { label: 'Грунт', value: 'грунт' },
  { label: 'Теплица', value: 'теплица' },
  { label: 'Огород', value: 'огород' },
  { label: 'Горшок', value: 'горшок' },
  { label: 'Кассета для проращивания', value: 'кассета для проращивания' },
];

// Следим за изменениями pepper
watch(
  () => props.pepper,
  (val: Pepper) => {
    editForm.value = {
      name: val.name,
      variety: val.variety,
      photoUrl: val.photoUrl,
      description: val.description,
      stage: val.stage,
      plantingDate: val.plantingDate,
      location: val.location
        ? { ...val.location }
        : { type: 'грунт' as Pepper['location']['type'], potVolume: '' },
      soilExtras: val.soilExtras
        ? { ...val.soilExtras }
        : {
            hasDrainage: false,
            drainage: null,
            hasSoilImprovement: false,
            soilImprovement: null,
          },
    };
  },
  { deep: true },
);

// Методы
function saveEdit() {
  const updatedFields: Partial<Pepper> = {
    name: editForm.value.name,
    variety: editForm.value.variety,
    photoUrl: editForm.value.photoUrl,
    description: editForm.value.description,
    plantingDate: editForm.value.plantingDate,
    location: { ...editForm.value.location },
    soilExtras: { ...editForm.value.soilExtras },
  };

  // Если изменилась стадия, добавляем в историю
  if (props.pepper.stage !== editForm.value.stage) {
    const today = new Date().toISOString().slice(0, 10);
    const newStageHistory = props.pepper.stageHistory ? [...props.pepper.stageHistory] : [];
    newStageHistory.push({ date: today, stage: editForm.value.stage });
    updatedFields.stage = editForm.value.stage;
    updatedFields.stageHistory = newStageHistory;
  }

  // Если изменилось место посадки, добавляем в историю
  const locationChanged =
    props.pepper.location?.type !== editForm.value.location?.type ||
    props.pepper.location?.potVolume !== editForm.value.location?.potVolume;
  
  if (locationChanged) {
    const today = new Date().toISOString().slice(0, 10);
    const newLocationHistory = props.pepper.locationHistory ? [...props.pepper.locationHistory] : [];
    const locationHistoryEntry: {
      date: string;
      type: Pepper['location']['type'];
      potVolume?: string;
    } = {
      date: today,
      type: editForm.value.location.type,
    };
    if (editForm.value.location.potVolume !== undefined) {
      locationHistoryEntry.potVolume = editForm.value.location.potVolume;
    }
    newLocationHistory.push(locationHistoryEntry);
    updatedFields.locationHistory = newLocationHistory;
  }

  emit('save', updatedFields);
  showDialog.value = false;
}

function handleImageUploadComplete(result: { url: string; path: string }) {
  editForm.value.photoUrl = result.url;
}

function handleImageUploadError(errorMessage: string) {
  $q.notify({
    color: 'negative',
    message: `Ошибка загрузки изображения: ${errorMessage}`,
  });
}
</script>
