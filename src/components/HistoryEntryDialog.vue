<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="saveEntry" class="q-gutter-md">
          <!-- Дата -->
          <q-input
            v-model="form.date"
            label="Дата"
            type="date"
            outlined
            :rules="[(val) => !!val || 'Дата обязательна']"
          />

          <!-- Полив -->
          <template v-if="type === 'watering'">
            <q-input
              v-model.number="form.volume"
              label="Объем воды (мл)"
              type="number"
              outlined
              :rules="[(val) => val > 0 || 'Объем должен быть больше 0']"
            />
            <q-input
              v-model="form.note"
              label="Заметка (необязательно)"
              type="textarea"
              outlined
              rows="2"
            />
          </template>

          <!-- Удобрение -->
          <template v-if="type === 'fertilizing'">
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-8">
                <q-input
                  v-model="form.note"
                  label="Название удобрения"
                  outlined
                  :rules="[(val) => !!val || 'Название обязательно']"
                />
              </div>
              <div class="col-4">
                <q-btn
                  color="secondary"
                  icon="library_books"
                  label="Библиотека"
                  @click="showFertilizerSelector = true"
                  class="full-width"
                />
              </div>
            </div>

            <q-input
              v-model.number="form.grams"
              label="Количество (г)"
              type="number"
              outlined
              :rules="[(val) => val > 0 || 'Количество должно быть больше 0']"
            />

            <div class="text-subtitle2 q-mt-md">Состав (%):</div>

            <!-- Макроэлементы -->
            <div class="text-caption text-grey-6 q-mb-sm">Макроэлементы:</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-4" v-for="element in macroElements" :key="element.symbol">
                <q-input
                  v-model.number="form.composition[element.symbol]"
                  :label="`${element.symbol} (${element.name})`"
                  type="number"
                  outlined
                  dense
                  suffix="%"
                />
              </div>
            </div>

            <!-- Микроэлементы -->
            <div class="text-caption text-grey-6 q-mb-sm">Микроэлементы:</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4" v-for="element in microElements" :key="element.symbol">
                <q-input
                  v-model.number="form.composition[element.symbol]"
                  :label="`${element.symbol} (${element.name})`"
                  type="number"
                  outlined
                  dense
                  suffix="%"
                />
              </div>
            </div>
          </template>

          <!-- Обработка -->
          <template v-if="type === 'treatment'">
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-8">
                <q-input
                  v-model="form.agent"
                  label="Средство обработки"
                  outlined
                  :rules="[(val) => !!val || 'Средство обязательно']"
                />
              </div>
              <div class="col-4">
                <q-btn
                  color="secondary"
                  icon="library_books"
                  label="Библиотека"
                  @click="showTreatmentSelector = true"
                  class="full-width"
                />
              </div>
            </div>

            <q-input
              v-model.number="form.volume"
              label="Объем (мл)"
              type="number"
              outlined
              :rules="[(val) => val > 0 || 'Объем должен быть больше 0']"
            />
            <q-input
              v-model="form.note"
              label="Заметка (необязательно)"
              type="textarea"
              outlined
              rows="2"
            />
          </template>

          <!-- Наблюдение -->
          <template v-if="type === 'observation'">
            <q-input
              v-model.number="form.height"
              label="Высота растения (см)"
              type="number"
              outlined
            />
            <q-select
              v-model="form.leafCondition"
              :options="leafConditions"
              label="Состояние листьев"
              outlined
              :rules="[(val) => !!val || 'Состояние листьев обязательно']"
            />

            <!-- Проблемы растений -->
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-8">
                <q-input
                  v-model="form.problems"
                  label="Проблемы растений (необязательно)"
                  outlined
                  placeholder="Нажмите кнопку для выбора из библиотеки"
                  readonly
                />
              </div>
              <div class="col-4">
                <q-btn
                  color="secondary"
                  icon="library_books"
                  label="Библиотека"
                  @click="showProblemsSelector = true"
                  class="full-width"
                />
              </div>
            </div>

            <!-- Выбранные проблемы -->
            <div v-if="selectedProblems.length > 0" class="q-mb-md">
              <div class="text-subtitle2">Выбранные проблемы:</div>
              <div class="row q-col-gutter-xs">
                <q-chip
                  v-for="problem in selectedProblems"
                  :key="problem.id"
                  removable
                  @remove="removeProblem(problem.id)"
                  :color="getSeverityColor(problem.severity)"
                  text-color="white"
                  :label="problem.name"
                />
              </div>
            </div>

            <q-input
              v-model="form.note"
              label="Заметки"
              type="textarea"
              outlined
              rows="3"
              :rules="[(val) => !!val || 'Заметки обязательны']"
            />
          </template>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn unelevated label="Сохранить" color="primary" @click="saveEntry" />
      </q-card-actions>
    </q-card>

    <!-- Селектор удобрений -->
    <FertilizerSelector v-model="showFertilizerSelector" @select="selectFertilizer" />
    <TreatmentSelector v-model="showTreatmentSelector" @select="selectTreatment" />
    <PlantProblemsSelector v-model="showProblemsSelector" @select="selectProblem" />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { WateringEntry, FertilizingEntry, TreatmentEntry, Observation } from './models';
import type { Fertilizer } from 'stores/fertilizer-library';
import type { TreatmentAgent } from 'stores/treatment-library';
import type { PlantProblem } from 'stores/plant-problems-library';
import FertilizerSelector from './FertilizerSelector.vue';
import TreatmentSelector from './TreatmentSelector.vue';
import PlantProblemsSelector from './PlantProblemsSelector.vue';

const props = defineProps<{
  modelValue: boolean;
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation';
  entry?: WateringEntry | FertilizingEntry | TreatmentEntry | Observation;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', entry: WateringEntry | FertilizingEntry | TreatmentEntry | Observation): void;
}>();

const $q = useQuasar();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const showFertilizerSelector = ref(false);
const showTreatmentSelector = ref(false);
const showProblemsSelector = ref(false);

const form = ref<any>({
  date: '',
  volume: null,
  note: '',
  grams: null,
  agent: '',
  height: null,
  leafCondition: '',
  composition: {},
  problems: '',
});

const selectedProblems = ref<PlantProblem[]>([]);

// Элементы для удобрений
const macroElements = [
  { symbol: 'N', name: 'Азот' },
  { symbol: 'P', name: 'Фосфор' },
  { symbol: 'K', name: 'Калий' },
  { symbol: 'Ca', name: 'Кальций' },
  { symbol: 'Mg', name: 'Магний' },
  { symbol: 'S', name: 'Сера' },
];

const microElements = [
  { symbol: 'Fe', name: 'Железо' },
  { symbol: 'Mn', name: 'Марганец' },
  { symbol: 'Zn', name: 'Цинк' },
  { symbol: 'Cu', name: 'Медь' },
  { symbol: 'B', name: 'Бор' },
  { symbol: 'Mo', name: 'Молибден' },
  { symbol: 'Cl', name: 'Хлор' },
  { symbol: 'Co', name: 'Кобальт' },
  { symbol: 'Ni', name: 'Никель' },
  { symbol: 'Si', name: 'Кремний' },
];

// Константы
const leafConditions = [
  'Отличное',
  'Хорошее',
  'Нормальное',
  'Плохое',
  'Очень плохое',
  'Болезнь',
  'Вредители',
];

// Вычисляемые свойства
const dialogTitle = computed(() => {
  const action = props.entry ? 'Редактировать' : 'Добавить';
  const typeName = {
    watering: 'полив',
    fertilizing: 'удобрение',
    treatment: 'обработку',
    observation: 'наблюдение',
  }[props.type];

  return `${action} ${typeName}`;
});

// Методы
function initializeForm() {
  const today = new Date().toISOString().slice(0, 10);

  if (props.entry) {
    // Редактирование существующей записи
    form.value = { ...props.entry };
    // Инициализируем выбранные проблемы для наблюдений
    if (props.type === 'observation' && props.entry.problems) {
      selectedProblems.value = props.entry.problems;
      updateProblemsField();
    }
  } else {
    // Новая запись
    form.value = {
      date: today,
      volume: null,
      note: '',
      grams: null,
      agent: '',
      height: null,
      leafCondition: '',
      composition: {},
      problems: '',
    };
    selectedProblems.value = [];
  }
}

function selectFertilizer(fertilizer: Fertilizer) {
  form.value.note = fertilizer.name;
  form.value.composition = { ...fertilizer.composition };
  showFertilizerSelector.value = false;
}

function selectTreatment(treatment: TreatmentAgent) {
  form.value.agent = treatment.name;
  showTreatmentSelector.value = false;
}

function selectProblem(problem: PlantProblem) {
  // Проверяем, не выбрана ли уже эта проблема
  if (!selectedProblems.value.find((p) => p.id === problem.id)) {
    selectedProblems.value.push(problem);
    updateProblemsField();
  }
  showProblemsSelector.value = false;
}

function removeProblem(problemId: string) {
  const index = selectedProblems.value.findIndex((p) => p.id === problemId);
  if (index !== -1) {
    selectedProblems.value.splice(index, 1);
    updateProblemsField();
  }
}

function updateProblemsField() {
  form.value.problems = selectedProblems.value.map((p) => p.name).join(', ');
}

function getSeverityColor(severity: PlantProblem['severity']) {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple',
  };
  return colors[severity];
}

function saveEntry() {
  // Валидация
  if (!form.value.date) {
    $q.notify({
      color: 'negative',
      message: 'Дата обязательна',
      icon: 'error',
    });
    return;
  }

  // Специфичная валидация по типу
  if (props.type === 'watering' && (!form.value.volume || form.value.volume <= 0)) {
    $q.notify({
      color: 'negative',
      message: 'Объем воды должен быть больше 0',
      icon: 'error',
    });
    return;
  }

  if (
    props.type === 'fertilizing' &&
    (!form.value.note || !form.value.grams || form.value.grams <= 0)
  ) {
    $q.notify({
      color: 'negative',
      message: 'Заполните название и количество удобрения',
      icon: 'error',
    });
    return;
  }

  if (
    props.type === 'treatment' &&
    (!form.value.agent || !form.value.volume || form.value.volume <= 0)
  ) {
    $q.notify({
      color: 'negative',
      message: 'Заполните средство и объем обработки',
      icon: 'error',
    });
    return;
  }

  if (props.type === 'observation' && (!form.value.leafCondition || !form.value.note)) {
    $q.notify({
      color: 'negative',
      message: 'Заполните состояние листьев и заметки',
      icon: 'error',
    });
    return;
  }

  // Создаем чистый объект без undefined значений
  const cleanEntry: any = {
    date: form.value.date,
  };

  // Добавляем поля в зависимости от типа
  if (props.type === 'watering') {
    if (form.value.volume) cleanEntry.volume = form.value.volume;
    if (form.value.note) cleanEntry.note = form.value.note;
  } else if (props.type === 'fertilizing') {
    cleanEntry.note = form.value.note;
    cleanEntry.grams = form.value.grams;
    if (form.value.composition && Object.keys(form.value.composition).length > 0) {
      cleanEntry.composition = {};
      Object.entries(form.value.composition).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleanEntry.composition[key] = Number(value);
        }
      });
    }
  } else if (props.type === 'treatment') {
    cleanEntry.agent = form.value.agent;
    if (form.value.volume) cleanEntry.volume = form.value.volume;
    if (form.value.note) cleanEntry.note = form.value.note;
  } else if (props.type === 'observation') {
    cleanEntry.leafCondition = form.value.leafCondition;
    cleanEntry.note = form.value.note;
    if (form.value.height) cleanEntry.height = form.value.height;
    if (selectedProblems.value.length > 0) {
      cleanEntry.problems = selectedProblems.value;
    }
  }

  // Эмитим событие сохранения
  emit('save', cleanEntry);
  showDialog.value = false;
}

// Инициализация формы при открытии диалога
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      initializeForm();
    }
  },
);
</script>
