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
          :model-value="problemsText"
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
import { ref, watch, nextTick, computed } from 'vue';
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

// Computed для отображения проблем в виде строки
const problemsText = computed(() => {
  return selectedProblems.value.map((p) => p.name).join(', ');
});

// Флаг для предотвращения циклических обновлений
const isUpdating = ref(false);

// Синхронизируем с v-model
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isUpdating.value && newValue) {
      // Проверяем, отличаются ли значения перед обновлением
      const currentStr = JSON.stringify({
        date: form.value.date,
        height: form.value.height,
        leafCondition: form.value.leafCondition,
        note: form.value.note,
        problems: selectedProblems.value,
      });
      const newProblems = Array.isArray(newValue.problems) ? newValue.problems : [];
      const newStr = JSON.stringify({
        date: newValue.date,
        height: newValue.height,
        leafCondition: newValue.leafCondition,
        note: newValue.note,
        problems: newProblems,
      });
      
      if (currentStr !== newStr) {
        isUpdating.value = true;
        form.value = {
          date: newValue.date,
          height: newValue.height,
          leafCondition: newValue.leafCondition,
          note: newValue.note,
        };
        if (Array.isArray(newValue.problems)) {
          selectedProblems.value = newValue.problems;
        } else {
          selectedProblems.value = [];
        }
        nextTick(() => {
          isUpdating.value = false;
        });
      }
    }
  },
  { immediate: true, deep: true },
);

// Эмитим изменения при изменении form (кроме problems, которые управляются через selectedProblems)
watch(
  () => [form.value.date, form.value.height, form.value.leafCondition, form.value.note],
  () => {
    if (!isUpdating.value) {
      emitFormUpdate();
    }
  },
  { deep: true },
);

// Эмитим изменения при изменении selectedProblems
watch(
  selectedProblems,
  () => {
    if (!isUpdating.value) {
      emitFormUpdate();
    }
  },
  { deep: true },
);

// Функция для эмита обновлений формы
function emitFormUpdate() {
  if (!isUpdating.value) {
    isUpdating.value = true;
    const cleanValue: Observation = {
      date: form.value.date,
      leafCondition: form.value.leafCondition,
      height: form.value.height,
      note: form.value.note,
      problems: selectedProblems.value.length > 0 ? selectedProblems.value : undefined,
    };
    emit('update:modelValue', cleanValue);
    // Сбрасываем флаг после следующего тика
    nextTick(() => {
      isUpdating.value = false;
    });
  }
}

function selectProblem(problem: PlantProblem) {
  // Проверяем, не выбрана ли уже эта проблема
  if (!selectedProblems.value.find((p) => p.id === problem.id)) {
    selectedProblems.value.push(problem);
  }
  showProblemsSelector.value = false;
}

function removeProblem(problemId: string) {
  const index = selectedProblems.value.findIndex((p) => p.id === problemId);
  if (index !== -1) {
    selectedProblems.value.splice(index, 1);
  }
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
