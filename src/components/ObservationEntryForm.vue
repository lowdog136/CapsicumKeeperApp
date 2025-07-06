<template>
  <div class="q-gutter-md">
    <q-input
      v-model="form.date"
      label="Дата"
      type="date"
      outlined
      :rules="[(val) => !!val || 'Дата обязательна']"
    />

    <q-input v-model.number="form.height" label="Высота растения (см)" type="number" outlined />

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

    <!-- Селектор проблем -->
    <PlantProblemsSelector v-model="showProblemsSelector" @select="selectProblem" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Observation } from './models';
import type { PlantProblem } from 'stores/plant-problems-library';
import PlantProblemsSelector from './PlantProblemsSelector.vue';

interface Props {
  modelValue: Observation;
}

interface Emits {
  (e: 'update:modelValue', value: Observation): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showProblemsSelector = ref(false);
const selectedProblems = ref<PlantProblem[]>([]);

const form = ref<Observation>({
  date: '',
  height: undefined,
  leafCondition: '',
  note: '',
  problems: undefined,
});

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

// Синхронизируем с v-model
watch(
  () => props.modelValue,
  (newValue) => {
    form.value = { ...newValue };
    if (newValue.problems) {
      selectedProblems.value = newValue.problems;
      updateProblemsField();
    }
  },
  { immediate: true, deep: true },
);

// Эмитим изменения
watch(
  form,
  (newValue) => {
    const cleanValue = { ...newValue };
    if (selectedProblems.value.length > 0) {
      cleanValue.problems = selectedProblems.value;
    }
    emit('update:modelValue', cleanValue);
  },
  { deep: true },
);

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
</script>
