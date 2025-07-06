<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 700px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор проблемы растения</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <PlantProblemsList
          :problems="problemsLibrary.problems"
          :on-search="problemsLibrary.searchProblems"
          @select="selectProblem"
          @toggle-favorite="toggleFavorite"
        />

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
    <AddPlantProblemDialog
      v-model="showAddNew"
      :on-add="problemsLibrary.addProblem"
      @added="onProblemAdded"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePlantProblemsLibrary, type PlantProblem } from 'stores/plant-problems-library';
import PlantProblemsList from './PlantProblemsList.vue';
import AddPlantProblemDialog from './AddPlantProblemDialog.vue';

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

const showAddNew = ref(false);

// Инициализация библиотеки при первом открытии
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && problemsLibrary.problems.length === 0) {
      problemsLibrary.initializeProblems();
    }
  },
);

// Методы
function selectProblem(problem: PlantProblem) {
  emit('select', problem);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  problemsLibrary.toggleFavorite(id);
}

function onProblemAdded(problem: PlantProblem) {
  // Проблема уже добавлена в библиотеку через диалог
  // Можно добавить дополнительную логику если нужно
}
</script>

<style scoped>
.problems-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
