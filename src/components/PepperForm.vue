<template>
  <q-card class="my-card q-pa-md">
    <q-form @submit.prevent="onSubmit">
      <q-input
        v-model="form.name"
        label="Наименование*"
        :error="!!errors.name"
        :error-message="errors.name"
        required
        class="q-mb-sm"
      />
      <VarietySelector v-model="selectedVariety" :errors="errors" class="q-mb-sm" :useV2="true" />
      <q-input
        v-model="form.description"
        label="Описание*"
        type="textarea"
        :error="!!errors.description"
        :error-message="errors.description"
        required
        class="q-mb-sm"
      />
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">Фото перца</div>
        <ImageUpload
          v-model="form.photoUrl"
          alt="Фото перца"
          @upload-complete="handleImageUploadComplete"
          @upload-error="handleImageUploadError"
        />
      </div>
      <q-input
        v-model="form.stage"
        :options="stages"
        label="Стадия роста*"
        :error="!!errors.stage"
        :error-message="errors.stage"
        required
        class="q-mb-sm"
      />
      <q-input
        v-model="form.plantingDate"
        label="Дата посадки*"
        type="date"
        :error="!!errors.plantingDate"
        :error-message="errors.plantingDate"
        required
        class="q-mb-sm"
      />
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">История поливок</div>
        <q-input
          v-model="wateringDate"
          label="Дата поливки*"
          type="date"
          :error="!!wateringError"
          :error-message="wateringError"
          class="q-mb-xs"
        />
        <q-input
          v-model.number="wateringVolume"
          label="Объем воды (мл)"
          type="number"
          class="q-mb-xs"
        />
        <q-btn flat color="positive" @click="addWatering" size="sm">Добавить поливку</q-btn>
        <q-list v-if="form.wateringHistory.length" dense class="q-mt-xs">
          <q-item v-for="(item, idx) in form.wateringHistory" :key="idx">
            <q-item-section
              >{{ item.date
              }}<span v-if="item.volume"> — {{ item.volume }} мл</span></q-item-section
            >
          </q-item>
        </q-list>
      </div>
      <q-card-section class="q-pa-md bg-grey-1 rounded-borders q-mb-md">
        <div class="text-subtitle2 q-mb-sm row items-center">
          <q-icon name="spa" class="q-mr-xs" /> Посадка и условия
        </div>
        <q-row class="q-gutter-md items-end">
          <q-col :cols="form.location.type === 'горшок' ? 6 : 12">
            <q-select
              v-model="form.location.type"
              :options="locationTypes"
              label="Место посадки*"
              :error="!!errors.locationType"
              :error-message="errors.locationType"
              required
              outlined
              prepend-inner-icon="spa"
              hint="Выберите, где будет расти растение"
              :placeholder="'Выберите место'"
            />
          </q-col>
          <q-slide-transition>
            <template v-if="form.location.type === 'горшок'">
              <q-col :cols="3">
                <q-input
                  v-model="form.location.potVolume"
                  label="Объем горшка (например, 2.5 л)"
                  outlined
                  prepend-inner-icon="format_color_fill"
                  placeholder="например, 2.5 л"
                  hint="Укажите объем в литрах"
                  :dense="$q.screen.lt.md"
                >
                  <template v-slot:append>
                    <q-btn
                      v-if="form.location.potVolume"
                      flat
                      dense
                      icon="clear"
                      @click="form.location.potVolume = ''"
                      size="sm"
                    >
                      <q-tooltip>Очистить</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </q-col>
              <q-col :cols="3">
                <div class="q-mb-xs">
                  <div class="row items-center q-mb-xs">
                    <q-icon name="water_drop" size="18px" class="q-mr-xs" />
                    <span>Дренаж и улучшение грунта</span>
                  </div>
                  <SoilExtrasSelector v-model="form.soilExtras" />
                  <div class="row q-gutter-xs q-mt-xs">
                    <q-btn
                      v-if="form.soilExtras.hasDrainage || form.soilExtras.hasSoilImprovement"
                      flat
                      dense
                      icon="clear"
                      size="sm"
                      @click="
                        form.soilExtras = {
                          hasDrainage: false,
                          drainage: null,
                          hasSoilImprovement: false,
                          soilImprovement: null,
                        }
                      "
                    >
                      <q-tooltip>Очистить дренаж и улучшение</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-col>
            </template>
          </q-slide-transition>
        </q-row>
      </q-card-section>
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">История удобрений</div>
        <q-input
          v-model="fertilizerDate"
          label="Дата внесения удобрения*"
          type="date"
          :error="!!fertilizerError"
          :error-message="fertilizerError"
          class="q-mb-xs"
        />
        <q-select
          v-model="fertilizerNote"
          :options="fertilizerHistoryList"
          use-input
          input-debounce="0"
          label="Комментарий к удобрению"
          class="q-mb-xs"
          @new-value="(val) => (fertilizerNote = val)"
        />
        <div class="row q-col-gutter-xs q-mb-xs">
          <q-input
            v-model.number="fertilizerN"
            label="N (%)"
            type="number"
            style="max-width: 80px"
            dense
            outlined
          />
          <q-input
            v-model.number="fertilizerP"
            label="P (%)"
            type="number"
            style="max-width: 80px"
            dense
            outlined
          />
          <q-input
            v-model.number="fertilizerK"
            label="K (%)"
            type="number"
            style="max-width: 80px"
            dense
            outlined
          />
          <q-btn
            flat
            size="sm"
            @click="showExtraFertilizer = !showExtraFertilizer"
            :label="showExtraFertilizer ? 'Скрыть доп.' : 'Показать доп.'"
            class="q-ml-sm"
          />
        </div>
        <q-slide-transition>
          <div v-show="showExtraFertilizer" class="row q-col-gutter-xs q-mb-xs">
            <q-input
              v-model.number="fertilizerFe"
              label="Fe (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerMn"
              label="Mn (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerB"
              label="B (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerNa"
              label="Na (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerZn"
              label="Zn (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerCu"
              label="Cu (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerMo"
              label="Mo (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerCl"
              label="Cl (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerNi"
              label="Ni (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
            <q-input
              v-model.number="fertilizerSi"
              label="Si (%)"
              type="number"
              style="max-width: 80px"
              dense
              outlined
            />
          </div>
        </q-slide-transition>
        <q-input
          v-model.number="fertilizerGrams"
          label="Граммы (по желанию)"
          type="number"
          class="q-mb-xs"
        />
        <q-btn flat color="positive" @click="addFertilizer" size="sm"
          >Добавить в историю удобрений</q-btn
        >
        <q-list v-if="Object.keys(groupedFertilizingHistory).length" dense class="q-mt-xs">
          <template v-for="(items, date) in groupedFertilizingHistory" :key="date">
            <q-item-label header>{{ date }}</q-item-label>
            <q-item v-for="(item, idx) in items" :key="idx">
              <q-item-section>
                <span v-if="item.grams">{{ item.grams }} г</span>
                <span v-if="item.note">{{ item.note }}</span>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">Обработка</div>
        <q-input
          v-model="treatmentDate"
          label="Дата обработки*"
          type="date"
          :error="!!treatmentError"
          :error-message="treatmentError"
          class="q-mb-xs"
        />
        <q-input
          v-model="treatmentAgent"
          label="Чем обрабатывали*"
          :error="!!treatmentAgentError"
          :error-message="treatmentAgentError"
          class="q-mb-xs"
        />
        <q-input
          v-model.number="treatmentVolume"
          label="Объем (мл, по желанию)"
          type="number"
          class="q-mb-xs"
        />
        <q-btn flat color="positive" @click="addTreatment" size="sm">Добавить обработку</q-btn>
        <q-list v-if="form.treatmentHistory && form.treatmentHistory.length" dense class="q-mt-xs">
          <q-item v-for="(item, idx) in form.treatmentHistory ?? []" :key="idx">
            <q-item-section
              >{{ item.date }} — {{ item.agent
              }}<span v-if="item.volume"> — {{ item.volume }} мл</span></q-item-section
            >
          </q-item>
        </q-list>
      </div>
      <div class="q-mb-sm">
        <div class="text-subtitle2 q-mb-xs">Дневник наблюдений</div>
        <q-input
          v-model="observationDate"
          label="Дата наблюдения*"
          type="date"
          :error="!!observationError"
          :error-message="observationError"
          class="q-mb-xs"
        />
        <q-input
          v-model.number="observationHeight"
          label="Высота куста (см)"
          type="number"
          class="q-mb-xs"
        />
        <q-input
          v-model="observationLeafCondition"
          label="Состояние листьев*"
          :error="!!observationLeafError"
          :error-message="observationLeafError"
          class="q-mb-xs"
        />
        <q-btn flat color="positive" @click="addObservation" size="sm">Добавить наблюдение</q-btn>
        <q-list v-if="form.observationLog && form.observationLog.length" dense class="q-mt-xs">
          <q-item v-for="(item, idx) in form.observationLog" :key="idx">
            <q-item-section>
              {{ item.date }}: {{ item.leafCondition }}
              <span v-if="item.height">({{ item.height }} см)</span>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
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
import { ref, reactive, computed, watch } from 'vue';
import type { Pepper, FertilizerComposition, PepperVariety } from './models';
import SoilExtrasSelector from './SoilExtrasSelector.vue';
import ImageUpload from './ImageUpload.vue';
import VarietySelector from './VarietySelector.vue';

const today = () => new Date().toISOString().slice(0, 10);

const emit = defineEmits(['submit']);

const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];
const locationTypes: Pepper['location']['type'][] = [
  'грунт',
  'теплица',
  'огород',
  'горшок',
  'кассета для проращивания',
];

type SoilExtras = NonNullable<Pepper['soilExtras']>;

const selectedVariety = ref<PepperVariety | null>(null);

const form = ref<Omit<Pepper, 'id' | 'userId'> & { soilExtras: SoilExtras }>({
  name: '',
  variety: '',
  photoUrl: '',
  description: '',
  stage: 'проращивание',
  plantingDate: today(),
  fertilizingHistory: [],
  wateringHistory: [],
  location: { type: 'грунт' },
  treatmentHistory: [],
  observationLog: [],
  soilExtras: {
    hasDrainage: false,
    drainage: null,
    hasSoilImprovement: false,
    soilImprovement: null,
  },
});

const updateVarietyField = computed(() => {
  if (selectedVariety.value) {
    form.value.variety = selectedVariety.value.name;
  }
  return form.value.variety;
});

const errors = reactive({
  name: '',
  variety: '',
  description: '',
  stage: '',
  plantingDate: '',
  locationType: '',
});

const wateringDate = ref(today());
const wateringVolume = ref<number | null>(null);
const wateringError = ref('');
function addWatering() {
  if (!wateringDate.value) {
    wateringError.value = 'Укажите дату поливки';
    return;
  }
  form.value.wateringHistory.push({
    date: wateringDate.value,
    volume: (wateringVolume.value !== null ? wateringVolume.value : undefined) as unknown as number,
  });
  wateringDate.value = '';
  wateringVolume.value = null;
  wateringError.value = '';
}

const FERTILIZER_HISTORY_KEY = 'fertilizerHistoryList';
const fertilizerHistoryList = ref<string[]>([]);

function loadFertilizerHistory() {
  const raw = localStorage.getItem(FERTILIZER_HISTORY_KEY);
  if (raw) {
    try {
      fertilizerHistoryList.value = JSON.parse(raw);
    } catch {
      // ignore
    }
  }
}
function saveFertilizerHistory() {
  localStorage.setItem(FERTILIZER_HISTORY_KEY, JSON.stringify(fertilizerHistoryList.value));
}
loadFertilizerHistory();

const fertilizerDate = ref(today());
const fertilizerNote = ref('');
const fertilizerGrams = ref<number | null>(null);
const fertilizerError = ref('');
const fertilizerN = ref<number | null>(null);
const fertilizerP = ref<number | null>(null);
const fertilizerK = ref<number | null>(null);
const fertilizerFe = ref<number | null>(null);
const fertilizerMn = ref<number | null>(null);
const fertilizerB = ref<number | null>(null);
const fertilizerNa = ref<number | null>(null);
const fertilizerZn = ref<number | null>(null);
const fertilizerCu = ref<number | null>(null);
const fertilizerMo = ref<number | null>(null);
const fertilizerCl = ref<number | null>(null);
const fertilizerNi = ref<number | null>(null);
const fertilizerSi = ref<number | null>(null);

function addFertilizer() {
  if (!fertilizerDate.value) {
    fertilizerError.value = 'Укажите дату внесения удобрения';
    return;
  }
  const composition: FertilizerComposition = {};
  if (fertilizerN.value !== null) composition.N = fertilizerN.value;
  if (fertilizerP.value !== null) composition.P = fertilizerP.value;
  if (fertilizerK.value !== null) composition.K = fertilizerK.value;
  if (fertilizerFe.value !== null) composition.Fe = fertilizerFe.value;
  if (fertilizerMn.value !== null) composition.Mn = fertilizerMn.value;
  if (fertilizerB.value !== null) composition.B = fertilizerB.value;
  if (fertilizerNa.value !== null) composition.Na = fertilizerNa.value;
  if (fertilizerZn.value !== null) composition.Zn = fertilizerZn.value;
  if (fertilizerCu.value !== null) composition.Cu = fertilizerCu.value;
  if (fertilizerMo.value !== null) composition.Mo = fertilizerMo.value;
  if (fertilizerCl.value !== null) composition.Cl = fertilizerCl.value;
  if (fertilizerNi.value !== null) composition.Ni = fertilizerNi.value;
  if (fertilizerSi.value !== null) composition.Si = fertilizerSi.value;
  form.value.fertilizingHistory.push({
    date: fertilizerDate.value,
    note: fertilizerNote.value,
    grams: (fertilizerGrams.value !== null
      ? fertilizerGrams.value
      : undefined) as unknown as number,
    composition,
  });
  if (fertilizerNote.value && !fertilizerHistoryList.value.includes(fertilizerNote.value)) {
    fertilizerHistoryList.value.push(fertilizerNote.value);
    saveFertilizerHistory();
  }
  fertilizerNote.value = '';
  fertilizerGrams.value = null;
  fertilizerError.value = '';
  fertilizerN.value = null;
  fertilizerP.value = null;
  fertilizerK.value = null;
  fertilizerFe.value = null;
  fertilizerMn.value = null;
  fertilizerB.value = null;
  fertilizerNa.value = null;
  fertilizerZn.value = null;
  fertilizerCu.value = null;
  fertilizerMo.value = null;
  fertilizerCl.value = null;
  fertilizerNi.value = null;
  fertilizerSi.value = null;
}

const treatmentDate = ref(today());
const treatmentAgent = ref('');
const treatmentVolume = ref<number | null>(null);
const treatmentError = ref('');
const treatmentAgentError = ref('');
function addTreatment() {
  if (!treatmentDate.value) {
    treatmentError.value = 'Укажите дату обработки';
    return;
  }
  if (!treatmentAgent.value) {
    treatmentAgentError.value = 'Укажите чем обрабатывали';
    return;
  }
  form.value.treatmentHistory!.push({
    date: treatmentDate.value,
    agent: treatmentAgent.value,
    volume: (treatmentVolume.value !== null
      ? treatmentVolume.value
      : undefined) as unknown as number,
  });
  treatmentDate.value = '';
  treatmentAgent.value = '';
  treatmentVolume.value = null;
  treatmentError.value = '';
  treatmentAgentError.value = '';
}

const groupedFertilizingHistory = computed(() => {
  const groups: Record<string, { note?: string; grams?: number }[]> = {};
  for (const item of form.value.fertilizingHistory) {
    if (!item.date) continue;
    if (!groups[item.date]) groups[item.date] = [];
    const entry: { note?: string; grams?: number } = {};
    if (typeof item.note === 'string') entry.note = item.note;
    if (typeof item.grams === 'number') entry.grams = item.grams;
    groups[item.date]!.push(entry);
  }
  return groups;
});

const observationDate = ref(today());
const observationHeight = ref<number | null>(null);
const observationLeafCondition = ref('');
const observationError = ref('');
const observationLeafError = ref('');

function addObservation() {
  observationError.value = !observationDate.value ? 'Укажите дату' : '';
  observationLeafError.value = !observationLeafCondition.value ? 'Укажите состояние листьев' : '';
  if (observationError.value || observationLeafError.value) return;

  if (!form.value.observationLog) form.value.observationLog = [];

  const newObservation: { date: string; height?: number; leafCondition: string } = {
    date: observationDate.value,
    leafCondition: observationLeafCondition.value,
  };

  if (observationHeight.value !== null) {
    newObservation.height = observationHeight.value;
  }

  form.value.observationLog.push(newObservation);

  observationHeight.value = null;
  observationLeafCondition.value = '';
}

function validateForm() {
  errors.name = form.value.name ? '' : 'Укажите наименование';
  errors.variety = selectedVariety.value ? '' : 'Выберите сорт из библиотеки';
  errors.description = form.value.description ? '' : 'Укажите описание';
  errors.stage = form.value.stage ? '' : 'Укажите стадию роста';
  errors.plantingDate = form.value.plantingDate ? '' : 'Укажите дату посадки';
  errors.locationType = form.value.location.type ? '' : 'Укажите место посадки';
  return !Object.values(errors).some(Boolean);
}

function onSubmit() {
  if (!validateForm()) return;

  // Создаем объект перца с данными из выбранного сорта
  const pepperData = {
    ...form.value,
    variety: selectedVariety.value?.name || '',
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

  // Сбрасываем форму
  form.value = {
    name: '',
    variety: '',
    photoUrl: '',
    description: '',
    stage: 'проращивание',
    plantingDate: today(),
    fertilizingHistory: [],
    wateringHistory: [],
    location: { type: 'грунт' },
    treatmentHistory: [],
    observationLog: [],
    soilExtras: {
      hasDrainage: false,
      drainage: null,
      hasSoilImprovement: false,
      soilImprovement: null,
    },
  };
  selectedVariety.value = null;
  fertilizerDate.value = today();
  fertilizerNote.value = '';
  fertilizerGrams.value = null;
}

const showExtraFertilizer = ref(false);

function handleImageUploadComplete(result: { url: string; path: string }) {
  form.value.photoUrl = result.url;
}

function handleImageUploadError(errorMessage: string) {
  console.error('Ошибка загрузки изображения:', errorMessage);
}

// Проверка заполненности обязательных полей
const isFormComplete = computed(() => {
  return (
    form.value.name &&
    selectedVariety.value &&
    form.value.description &&
    form.value.stage &&
    form.value.plantingDate &&
    form.value.location.type
  );
});

defineExpose({
  showExtraFertilizer,
  fertilizerN,
  fertilizerP,
  fertilizerK,
  fertilizerFe,
  fertilizerMn,
  fertilizerB,
  fertilizerNa,
  fertilizerZn,
  fertilizerCu,
  fertilizerMo,
  fertilizerCl,
  fertilizerNi,
  fertilizerSi,
});
</script>

<style scoped>
.my-card {
  max-width: 500px;
  width: 100%;
}
</style>
