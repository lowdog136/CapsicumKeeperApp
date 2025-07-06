<template>
  <q-card class="my-card q-pa-md">
    <q-form @submit.prevent="onSubmit">
      <PepperBasicInfo
        v-model="basicInfo"
        :errors="errors.basicInfo"
        v-model:selectedVariety="selectedVariety"
        class="q-mb-md"
      />
      <PepperPlantingInfo v-model="plantingInfo" :errors="errors.plantingInfo" class="q-mb-md" />
      <PepperWateringHistory v-model="wateringHistory" class="q-mb-md" />
      <PepperFertilizerHistory v-model="fertilizerHistory" class="q-mb-md" />
      <PepperTreatmentHistory v-model="treatmentHistory" class="q-mb-md" />
      <PepperObservationHistory v-model="observationHistory" class="q-mb-md" />
      <div class="q-mt-md text-center">
        <q-btn
          type="submit"
          color="positive"
          label="Сохранить"
          icon="save"
          :disable="!isFormComplete"
        />
      </div>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import PepperBasicInfo from './PepperBasicInfo.vue';
import PepperPlantingInfo from './PepperPlantingInfo.vue';
import PepperWateringHistory from './PepperWateringHistory.vue';
import PepperFertilizerHistory from './PepperFertilizerHistory.vue';
import PepperTreatmentHistory from './PepperTreatmentHistory.vue';
import PepperObservationHistory from './PepperObservationHistory.vue';
import type { PepperVariety, Pepper } from './models';

const emit = defineEmits<{ submit: [pepper: Omit<Pepper, 'id' | 'userId'>] }>();

// Метод для очистки формы (будет вызван извне)
function resetForm() {
  // Очищаем основную информацию
  basicInfo.value = {
    name: '',
    description: '',
    photoUrl: '',
  };
  selectedVariety.value = null;

  // Очищаем информацию о посадке
  plantingInfo.value = {
    stage: 'проращивание' as Pepper['stage'],
    plantingDate: new Date().toISOString().slice(0, 10),
    location: { type: 'грунт' as Pepper['location']['type'], potVolume: '' },
    soilExtras: {
      hasDrainage: false,
      drainage: null,
      hasSoilImprovement: false,
      soilImprovement: null,
    },
  };

  // Очищаем истории
  wateringHistory.value = [];
  fertilizerHistory.value = [];
  treatmentHistory.value = [];
  observationHistory.value = [];

  // Очищаем ошибки
  Object.keys(errors.basicInfo).forEach((key) => {
    errors.basicInfo[key as keyof typeof errors.basicInfo] = '';
  });
  Object.keys(errors.plantingInfo).forEach((key) => {
    errors.plantingInfo[key as keyof typeof errors.plantingInfo] = '';
  });
}

// Экспортируем метод для использования извне
defineExpose({ resetForm });

// Основная информация
const basicInfo = ref({
  name: '',
  description: '',
  photoUrl: '',
});
const selectedVariety = ref<PepperVariety | null>(null);

// Информация о посадке
const plantingInfo = ref({
  stage: 'проращивание' as Pepper['stage'],
  plantingDate: new Date().toISOString().slice(0, 10),
  location: { type: 'грунт' as Pepper['location']['type'], potVolume: '' },
  soilExtras: {
    hasDrainage: false,
    drainage: null,
    hasSoilImprovement: false,
    soilImprovement: null,
  },
});

// История полива
const wateringHistory = ref<Array<{ date: string; volume?: number }>>([]);

// История удобрений
const fertilizerHistory = ref<
  Array<{
    date: string;
    note?: string;
    grams?: number;
    composition?: any;
  }>
>([]);

// История обработок
const treatmentHistory = ref<
  Array<{
    date: string;
    agent: string;
    volume?: number;
  }>
>([]);

// История наблюдений
const observationHistory = ref<
  Array<{
    date: string;
    height?: number;
    leafCondition: string;
  }>
>([]);

// Ошибки
const errors = reactive({
  basicInfo: {
    name: '',
    description: '',
    variety: '',
  },
  plantingInfo: {
    stage: '',
    plantingDate: '',
    locationType: '',
  },
});

// Проверка заполненности обязательных полей
const isFormComplete = computed(() => {
  return (
    basicInfo.value.name &&
    selectedVariety.value &&
    basicInfo.value.description &&
    plantingInfo.value.stage &&
    plantingInfo.value.plantingDate &&
    plantingInfo.value.location.type
  );
});

function validateForm() {
  errors.basicInfo.name = basicInfo.value.name ? '' : 'Укажите наименование';
  errors.basicInfo.variety = selectedVariety.value ? '' : 'Выберите сорт из библиотеки';
  errors.basicInfo.description = basicInfo.value.description ? '' : 'Укажите описание';
  errors.plantingInfo.stage = plantingInfo.value.stage ? '' : 'Укажите стадию роста';
  errors.plantingInfo.plantingDate = plantingInfo.value.plantingDate ? '' : 'Укажите дату посадки';
  errors.plantingInfo.locationType = plantingInfo.value.location.type
    ? ''
    : 'Укажите место посадки';
  return (
    !Object.values(errors.basicInfo).some(Boolean) &&
    !Object.values(errors.plantingInfo).some(Boolean)
  );
}

function onSubmit() {
  if (!validateForm()) return;

  // Создаем объект перца с данными из всех блоков
  const pepperData: Omit<Pepper, 'id' | 'userId'> = {
    name: basicInfo.value.name,
    variety: selectedVariety.value?.name || '',
    photoUrl: basicInfo.value.photoUrl,
    description: basicInfo.value.description,
    stage: plantingInfo.value.stage,
    plantingDate: plantingInfo.value.plantingDate,
    fertilizingHistory: fertilizerHistory.value,
    wateringHistory: wateringHistory.value,
    location: plantingInfo.value.location,
    treatmentHistory: treatmentHistory.value,
    observationLog: observationHistory.value,
    soilExtras: plantingInfo.value.soilExtras,
    // Добавляем дополнительную информацию из выбранного сорта
    varietyInfo: selectedVariety.value
      ? {
          id: selectedVariety.value.id,
          species: selectedVariety.value.species || 'Capsicum annuum',
          heatLevel: selectedVariety.value.heatLevel || 'mild',
          origin: selectedVariety.value.origin || '',
          color: selectedVariety.value.color || [],
          plantHeight: selectedVariety.value.plantHeight || { min: 30, max: 60, unit: 'cm' },
          daysToMaturity: selectedVariety.value.daysToMaturity || { min: 70, max: 90 },
          fruitSize: selectedVariety.value.fruitSize || {
            length: { min: 5, max: 10, unit: 'cm' },
            width: { min: 2, max: 4, unit: 'cm' },
          },
          growingTips: selectedVariety.value.growingTips || [],
        }
      : undefined,
  };

  emit('submit', pepperData);
}
</script>

<style scoped>
.my-card {
  max-width: 500px;
  width: 100%;
}
</style>
