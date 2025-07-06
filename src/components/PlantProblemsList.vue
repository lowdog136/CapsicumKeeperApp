<template>
  <div>
    <!-- Поиск -->
    <q-input v-model="searchQuery" label="Поиск проблем" outlined dense clearable class="q-mb-md">
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
          @click="$emit('select', problem)"
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
                @click.stop="$emit('toggleFavorite', problem.id)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PlantProblem } from 'stores/plant-problems-library';

interface Props {
  problems: PlantProblem[];
  onSearch: (query: string) => PlantProblem[];
}

interface Emits {
  (e: 'select', problem: PlantProblem): void;
  (e: 'toggleFavorite', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref('');
const selectedCategory = ref<string>('all');

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Хлорозы', value: 'chlorosis' },
  { label: 'Вредители', value: 'pest' },
  { label: 'Болезни', value: 'disease' },
  { label: 'Дефициты', value: 'deficiency' },
  { label: 'Другие', value: 'other' },
];

// Фильтрация проблем
const filteredProblems = computed(() => {
  let result = props.problems;

  // Фильтр по категории
  if (selectedCategory.value !== 'all') {
    result = result.filter((p) => p.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value) {
    result = props.onSearch(searchQuery.value);
  }

  return result;
});

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
</script>

<style scoped>
.problems-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
