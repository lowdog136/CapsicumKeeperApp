<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор удобрения</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Список удобрений -->
        <FertilizerList
          :fertilizers="fertilizerLibrary.fertilizers"
          :on-search="fertilizerLibrary.searchFertilizers"
          @select="selectFertilizer"
          @toggle-favorite="toggleFavorite"
        />

        <!-- Кнопка добавления нового удобрения -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            color="secondary"
            icon="add"
            label="Добавить новое удобрение"
            @click="showAddDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления нового удобрения -->
    <AddFertilizerDialog v-model="showAddDialog" @add="addNewFertilizer" />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useFertilizerLibrary, type Fertilizer } from 'stores/fertilizer-library';
import FertilizerList from './FertilizerList.vue';
import AddFertilizerDialog from './AddFertilizerDialog.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', fertilizer: Fertilizer): void;
}>();

const $q = useQuasar();
const fertilizerLibrary = useFertilizerLibrary();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const showAddDialog = ref(false);

// Инициализация библиотеки при первом открытии
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && fertilizerLibrary.fertilizers.length === 0) {
      fertilizerLibrary.initializeFertilizers();
    }
  },
);

// Методы
function selectFertilizer(fertilizer: Fertilizer) {
  emit('select', fertilizer);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  fertilizerLibrary.toggleFavorite(id);
}

function addNewFertilizer(fertilizer: Fertilizer) {
  const addedFertilizer = fertilizerLibrary.addFertilizer(fertilizer);

  $q.notify({
    color: 'positive',
    message: 'Удобрение добавлено в библиотеку',
    icon: 'check_circle',
  });

  emit('select', addedFertilizer);
}
</script>

<style scoped>
.fertilizer-card {
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.fertilizer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--q-primary);
}

.fertilizer-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
