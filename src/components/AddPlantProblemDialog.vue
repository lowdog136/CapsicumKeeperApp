<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Добавить новую проблему</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none" style="max-height: 60vh; overflow-y: auto">
        <q-form @submit="addNewProblem" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Название проблемы"
            outlined
            :rules="[(val) => !!val || 'Название обязательно']"
          />

          <q-input
            v-model="form.description"
            label="Описание"
            type="textarea"
            outlined
            rows="3"
            :rules="[(val) => !!val || 'Описание обязательно']"
          />

          <q-select
            v-model="form.category"
            :options="categoryOptions"
            label="Категория"
            outlined
            :rules="[(val) => !!val || 'Категория обязательна']"
          />

          <q-select
            v-model="form.severity"
            :options="severityOptions"
            label="Серьезность"
            outlined
            :rules="[(val) => !!val || 'Серьезность обязательна']"
          />

          <div class="text-subtitle2">Симптомы:</div>
          <q-input v-model="newSymptom" label="Добавить симптом" outlined dense>
            <template v-slot:append>
              <q-btn round dense icon="add" @click="addSymptom" :disable="!newSymptom" />
            </template>
          </q-input>
          <div class="row q-col-gutter-xs">
            <q-chip
              v-for="(symptom, index) in form.symptoms"
              :key="index"
              removable
              @remove="removeSymptom(index)"
              color="orange-1"
              text-color="orange-9"
              :label="symptom"
            />
          </div>

          <div class="text-subtitle2">Причины:</div>
          <q-input v-model="newCause" label="Добавить причину" outlined dense>
            <template v-slot:append>
              <q-btn round dense icon="add" @click="addCause" :disable="!newCause" />
            </template>
          </q-input>
          <div class="row q-col-gutter-xs">
            <q-chip
              v-for="(cause, index) in form.causes"
              :key="index"
              removable
              @remove="removeCause(index)"
              color="red-1"
              text-color="red-9"
              :label="cause"
            />
          </div>

          <div class="text-subtitle2">Решения:</div>
          <q-input v-model="newSolution" label="Добавить решение" outlined dense>
            <template v-slot:append>
              <q-btn round dense icon="add" @click="addSolution" :disable="!newSolution" />
            </template>
          </q-input>
          <div class="row q-col-gutter-xs">
            <q-chip
              v-for="(solution, index) in form.solutions"
              :key="index"
              removable
              @remove="removeSolution(index)"
              color="green-1"
              text-color="green-9"
              :label="solution"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn unelevated label="Добавить" color="primary" @click="addNewProblem" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { PlantProblem } from 'stores/plant-problems-library';

interface Props {
  modelValue: boolean;
  onAdd: (problem: Omit<PlantProblem, 'id' | 'createdAt' | 'updatedAt'>) => PlantProblem;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'added', problem: PlantProblem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const $q = useQuasar();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// Новые поля для добавления
const newSymptom = ref('');
const newCause = ref('');
const newSolution = ref('');

// Форма новой проблемы
const form = ref({
  name: '',
  description: '',
  category: 'other' as PlantProblem['category'],
  severity: 'medium' as PlantProblem['severity'],
  symptoms: [] as string[],
  causes: [] as string[],
  solutions: [] as string[],
});

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Хлорозы', value: 'chlorosis' },
  { label: 'Вредители', value: 'pest' },
  { label: 'Болезни', value: 'disease' },
  { label: 'Дефициты', value: 'deficiency' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.slice(1).map((c) => ({
  label: c.label,
  value: c.value,
}));

const severityOptions = [
  { label: 'Низкая', value: 'low' },
  { label: 'Средняя', value: 'medium' },
  { label: 'Высокая', value: 'high' },
  { label: 'Критическая', value: 'critical' },
];

// Методы для добавления новой проблемы
function addSymptom() {
  if (newSymptom.value.trim()) {
    form.value.symptoms.push(newSymptom.value.trim());
    newSymptom.value = '';
  }
}

function removeSymptom(index: number) {
  form.value.symptoms.splice(index, 1);
}

function addCause() {
  if (newCause.value.trim()) {
    form.value.causes.push(newCause.value.trim());
    newCause.value = '';
  }
}

function removeCause(index: number) {
  form.value.causes.splice(index, 1);
}

function addSolution() {
  if (newSolution.value.trim()) {
    form.value.solutions.push(newSolution.value.trim());
    newSolution.value = '';
  }
}

function removeSolution(index: number) {
  form.value.solutions.splice(index, 1);
}

function addNewProblem() {
  if (!form.value.name || !form.value.description) {
    $q.notify({
      color: 'negative',
      message: 'Заполните название и описание',
      icon: 'error',
    });
    return;
  }

  if (form.value.symptoms.length === 0) {
    $q.notify({
      color: 'negative',
      message: 'Добавьте хотя бы один симптом',
      icon: 'error',
    });
    return;
  }

  const problem = props.onAdd({
    name: form.value.name,
    description: form.value.description,
    category: form.value.category,
    severity: form.value.severity,
    symptoms: [...form.value.symptoms],
    causes: [...form.value.causes],
    solutions: [...form.value.solutions],
    isFavorite: false,
  });

  // Сбрасываем форму
  form.value = {
    name: '',
    description: '',
    category: 'other',
    severity: 'medium',
    symptoms: [],
    causes: [],
    solutions: [],
  };
  newSymptom.value = '';
  newCause.value = '';
  newSolution.value = '';

  showDialog.value = false;

  emit('added', problem);

  $q.notify({
    color: 'positive',
    message: 'Проблема добавлена в библиотеку',
    icon: 'check_circle',
  });
}
</script>
