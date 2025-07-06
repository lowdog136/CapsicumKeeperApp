<template>
  <div>
    <!-- Поле поиска -->
    <q-input
      v-model="searchQuery"
      label="Поиск проблем растений"
      outlined
      dense
      class="q-mb-sm"
      placeholder="Введите название проблемы..."
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append>
        <q-btn v-if="searchQuery" flat dense icon="clear" @click="searchQuery = ''" size="sm" />
      </template>
    </q-input>

    <!-- Фильтр по категориям -->
    <q-select
      v-model="selectedCategory"
      :options="categoryOptions"
      label="Категория"
      outlined
      dense
      class="q-mb-sm"
      clearable
      placeholder="Все категории"
    />

    <!-- Список проблем -->
    <div class="problem-list">
      <q-card
        v-for="problem in filteredProblems"
        :key="problem.id"
        class="problem-card q-mb-sm"
        clickable
        @click="selectProblem(problem)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-subtitle2">{{ problem.name }}</div>
              <div class="text-caption text-grey-6">
                {{ problem.description }}
              </div>
              <div class="text-caption q-mt-xs">
                <q-chip
                  size="sm"
                  :label="problem.category"
                  :color="getCategoryColor(problem.category)"
                  text-color="white"
                />
                <q-chip
                  size="sm"
                  :label="`Серьезность: ${problem.severity}`"
                  :color="getSeverityColor(problem.severity)"
                  text-color="white"
                />
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                Симптомы: {{ problem.symptoms.slice(0, 2).join(', ') }}
                <span v-if="problem.symptoms.length > 2">...</span>
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                dense
                :icon="problem.isFavorite ? 'favorite' : 'favorite_border'"
                :color="problem.isFavorite ? 'red' : 'grey'"
                @click.stop="toggleFavorite(problem.id)"
              >
                <q-tooltip>{{
                  problem.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'
                }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Кнопка добавления новой проблемы -->
    <q-btn
      flat
      color="primary"
      icon="add"
      label="Добавить новую проблему"
      class="q-mt-sm"
      @click="showAddDialog = true"
    />

    <!-- Диалог добавления новой проблемы -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="text-h6">Добавить новую проблему</q-card-section>
        <q-card-section>
          <q-form @submit="addNewProblem">
            <q-input
              v-model="newProblem.name"
              label="Название*"
              outlined
              dense
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Введите название']"
            />
            <q-input
              v-model="newProblem.description"
              label="Описание*"
              type="textarea"
              outlined
              dense
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Введите описание']"
            />
            <q-select
              v-model="newProblem.category"
              :options="categoryOptions"
              label="Категория*"
              outlined
              dense
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Выберите категорию']"
            />
            <q-select
              v-model="newProblem.severity"
              :options="severityOptions"
              label="Серьезность*"
              outlined
              dense
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Выберите серьезность']"
            />
            <q-input
              v-model="symptomsText"
              label="Симптомы (через запятую)*"
              type="textarea"
              outlined
              dense
              class="q-mb-sm"
              :rules="[(val) => !!val || 'Введите симптомы']"
              placeholder="Например: Желтеют листья, Замедленный рост"
            />
            <q-input
              v-model="causesText"
              label="Причины (через запятую)"
              type="textarea"
              outlined
              dense
              class="q-mb-sm"
              placeholder="Например: Недостаток железа, Высокий pH почвы"
            />
            <q-input
              v-model="solutionsText"
              label="Решения (через запятую)"
              type="textarea"
              outlined
              dense
              class="q-mb-sm"
              placeholder="Например: Внесение хелата железа, Снижение pH"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Добавить" @click="addNewProblem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePlantProblemsLibrary } from 'src/stores/plant-problems-library';
import type { PlantProblem } from 'src/stores/plant-problems-library';

const emit = defineEmits<{
  (e: 'select', problem: PlantProblem): void;
}>();

const problemStore = usePlantProblemsLibrary();
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const showAddDialog = ref(false);

const newProblem = ref({
  name: '',
  description: '',
  category: 'chlorosis' as PlantProblem['category'],
  severity: 'medium' as PlantProblem['severity'],
});

const symptomsText = ref('');
const causesText = ref('');
const solutionsText = ref('');

const categoryOptions = [
  { label: 'Хлорозы', value: 'chlorosis' },
  { label: 'Вредители', value: 'pest' },
  { label: 'Болезни', value: 'disease' },
  { label: 'Дефицит питательных веществ', value: 'deficiency' },
  { label: 'Другие', value: 'other' },
];

const severityOptions = [
  { label: 'Низкая', value: 'low' },
  { label: 'Средняя', value: 'medium' },
  { label: 'Высокая', value: 'high' },
  { label: 'Критическая', value: 'critical' },
];

const filteredProblems = computed(() => {
  let problems = problemStore.problems;

  // Фильтр по поиску
  if (searchQuery.value) {
    problems = problemStore.searchProblems(searchQuery.value);
  }

  // Фильтр по категории
  if (selectedCategory.value) {
    problems = problems.filter((p) => p.category === selectedCategory.value);
  }

  return problems;
});

function selectProblem(problem: PlantProblem) {
  emit('select', problem);
}

function toggleFavorite(id: string) {
  problemStore.toggleFavorite(id);
}

function getCategoryColor(category: string): string {
  const colors = {
    chlorosis: 'orange',
    pest: 'red',
    disease: 'purple',
    deficiency: 'blue',
    other: 'grey',
  };
  return colors[category as keyof typeof colors] || 'grey';
}

function getSeverityColor(severity: string): string {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple',
  };
  return colors[severity as keyof typeof colors] || 'grey';
}

function addNewProblem() {
  const symptoms = symptomsText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const causes = causesText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const solutions = solutionsText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const problem = problemStore.addProblem({
    name: newProblem.value.name,
    description: newProblem.value.description,
    category: newProblem.value.category,
    severity: newProblem.value.severity,
    symptoms,
    causes,
    solutions,
  });

  // Сбрасываем форму
  newProblem.value = {
    name: '',
    description: '',
    category: 'chlorosis',
    severity: 'medium',
  };
  symptomsText.value = '';
  causesText.value = '';
  solutionsText.value = '';

  showAddDialog.value = false;
  emit('select', problem);
}

onMounted(() => {
  if (problemStore.problems.length === 0) {
    problemStore.initializeProblems();
  }
});
</script>

<style scoped>
.problem-card {
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.problem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--q-primary);
}

.problem-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
