<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 700px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор проблемы растения</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Поиск -->
        <q-input
          v-model="searchQuery"
          label="Поиск проблем"
          outlined
          dense
          clearable
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Фильтр по категориям -->
        <q-btn-group class="q-mb-md">
          <q-btn
            v-for="category in categories"
            :key="category.value"
            :label="category.label"
            :color="selectedCategory === category.value ? 'primary' : 'grey'"
            :outline="selectedCategory !== category.value"
            @click="selectedCategory = category.value"
            size="sm"
          />
        </q-btn-group>

        <!-- Список проблем -->
        <div class="problems-list" style="max-height: 400px; overflow-y: auto">
          <q-list>
            <q-item
              v-for="problem in filteredProblems"
              :key="problem.id"
              clickable
              @click="selectProblem(problem)"
              class="q-mb-sm"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ problem.name }}</q-item-label>
                <q-item-label caption class="q-mt-xs">
                  {{ problem.description }}
                </q-item-label>

                <!-- Симптомы -->
                <div class="q-mt-xs">
                  <div class="text-caption text-weight-medium">Симптомы:</div>
                  <div class="row q-col-gutter-xs">
                    <q-chip
                      v-for="symptom in problem.symptoms.slice(0, 2)"
                      :key="symptom"
                      size="xs"
                      color="orange-1"
                      text-color="orange-9"
                      :label="symptom"
                    />
                    <q-chip
                      v-if="problem.symptoms.length > 2"
                      size="xs"
                      color="grey-1"
                      text-color="grey-7"
                      :label="`+${problem.symptoms.length - 2} еще`"
                    />
                  </div>
                </div>

                <!-- Решения -->
                <div class="q-mt-xs">
                  <div class="text-caption text-weight-medium">Решения:</div>
                  <div class="row q-col-gutter-xs">
                    <q-chip
                      v-for="solution in problem.solutions.slice(0, 2)"
                      :key="solution"
                      size="xs"
                      color="green-1"
                      text-color="green-9"
                      :label="solution"
                    />
                    <q-chip
                      v-if="problem.solutions.length > 2"
                      size="xs"
                      color="grey-1"
                      text-color="grey-7"
                      :label="`+${problem.solutions.length - 2} еще`"
                    />
                  </div>
                </div>
              </q-item-section>

              <q-item-section side>
                <div class="column items-end">
                  <q-btn
                    flat
                    round
                    :icon="problem.isFavorite ? 'star' : 'star_border'"
                    :color="problem.isFavorite ? 'amber' : 'grey'"
                    size="sm"
                    @click.stop="toggleFavorite(problem.id)"
                  />
                  <q-chip
                    :color="getSeverityColor(problem.severity)"
                    text-color="white"
                    size="xs"
                    :label="getSeverityLabel(problem.severity)"
                    class="q-mt-xs"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Кнопка добавления новой проблемы -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            color="secondary"
            icon="add"
            label="Добавить новую проблему"
            @click="showAddNew = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления новой проблемы -->
    <q-dialog v-model="showAddNew" persistent>
      <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Добавить новую проблему</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none" style="max-height: 60vh; overflow-y: auto">
          <q-form @submit="addNewProblem" class="q-gutter-md">
            <q-input
              v-model="newProblem.name"
              label="Название проблемы"
              outlined
              :rules="[(val) => !!val || 'Название обязательно']"
            />

            <q-input
              v-model="newProblem.description"
              label="Описание"
              type="textarea"
              outlined
              rows="3"
              :rules="[(val) => !!val || 'Описание обязательно']"
            />

            <q-select
              v-model="newProblem.category"
              :options="categoryOptions"
              label="Категория"
              outlined
              :rules="[(val) => !!val || 'Категория обязательна']"
            />

            <q-select
              v-model="newProblem.severity"
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
                v-for="(symptom, index) in newProblem.symptoms"
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
                v-for="(cause, index) in newProblem.causes"
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
                v-for="(solution, index) in newProblem.solutions"
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
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePlantProblemsLibrary, type PlantProblem } from 'stores/plant-problems-library';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', problem: PlantProblem): void;
}>();

const $q = useQuasar();
const problemsLibrary = usePlantProblemsLibrary();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const showAddNew = ref(false);

// Новые поля для добавления
const newSymptom = ref('');
const newCause = ref('');
const newSolution = ref('');

// Новая проблема
const newProblem = ref({
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

// Инициализация библиотеки при первом открытии
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && problemsLibrary.problems.length === 0) {
      problemsLibrary.initializeProblems();
    }
  },
);

// Фильтрация проблем
const filteredProblems = computed(() => {
  let result = problemsLibrary.problems;

  // Фильтр по категории
  if (selectedCategory.value !== 'all') {
    result = result.filter((p) => p.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value) {
    result = problemsLibrary.searchProblems(searchQuery.value);
  }

  return result;
});

// Методы
function selectProblem(problem: PlantProblem) {
  emit('select', problem);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  problemsLibrary.toggleFavorite(id);
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

function getSeverityLabel(severity: PlantProblem['severity']) {
  const labels = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
    critical: 'Критическая',
  };
  return labels[severity];
}

// Методы для добавления новой проблемы
function addSymptom() {
  if (newSymptom.value.trim()) {
    newProblem.value.symptoms.push(newSymptom.value.trim());
    newSymptom.value = '';
  }
}

function removeSymptom(index: number) {
  newProblem.value.symptoms.splice(index, 1);
}

function addCause() {
  if (newCause.value.trim()) {
    newProblem.value.causes.push(newCause.value.trim());
    newCause.value = '';
  }
}

function removeCause(index: number) {
  newProblem.value.causes.splice(index, 1);
}

function addSolution() {
  if (newSolution.value.trim()) {
    newProblem.value.solutions.push(newSolution.value.trim());
    newSolution.value = '';
  }
}

function removeSolution(index: number) {
  newProblem.value.solutions.splice(index, 1);
}

function addNewProblem() {
  if (!newProblem.value.name || !newProblem.value.description) {
    $q.notify({
      color: 'negative',
      message: 'Заполните название и описание',
      icon: 'error',
    });
    return;
  }

  if (newProblem.value.symptoms.length === 0) {
    $q.notify({
      color: 'negative',
      message: 'Добавьте хотя бы один симптом',
      icon: 'error',
    });
    return;
  }

  const problem = problemsLibrary.addProblem({
    name: newProblem.value.name,
    description: newProblem.value.description,
    category: newProblem.value.category,
    severity: newProblem.value.severity,
    symptoms: [...newProblem.value.symptoms],
    causes: [...newProblem.value.causes],
    solutions: [...newProblem.value.solutions],
    isFavorite: false,
  });

  // Сбрасываем форму
  newProblem.value = {
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

  showAddNew.value = false;

  $q.notify({
    color: 'positive',
    message: 'Проблема добавлена в библиотеку',
    icon: 'check_circle',
  });
}
</script>

<style scoped>
.problems-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
