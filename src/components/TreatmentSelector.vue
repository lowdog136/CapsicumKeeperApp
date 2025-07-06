<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор средства обработки</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Список средств -->
        <TreatmentList
          :treatments="treatmentLibrary.treatments"
          :on-search="treatmentLibrary.searchTreatments"
          @select="selectTreatment"
          @toggle-favorite="toggleFavorite"
        />

        <!-- Кнопка добавления нового средства -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            color="secondary"
            icon="add"
            label="Добавить новое средство"
            @click="showAddDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления нового средства -->
    <AddTreatmentDialog v-model="showAddDialog" @add="addNewTreatment" />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useTreatmentLibrary, type TreatmentAgent } from 'stores/treatment-library';
import TreatmentList from './TreatmentList.vue';
import AddTreatmentDialog from './AddTreatmentDialog.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', treatment: TreatmentAgent): void;
}>();

const $q = useQuasar();
const treatmentLibrary = useTreatmentLibrary();

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
    if (newValue && treatmentLibrary.treatments.length === 0) {
      treatmentLibrary.initializeTreatments();
    }
  },
);

// Методы
function selectTreatment(treatment: TreatmentAgent) {
  emit('select', treatment);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  treatmentLibrary.toggleFavorite(id);
}

function addNewTreatment(treatment: TreatmentAgent) {
  const addedTreatment = treatmentLibrary.addTreatment(treatment);

  $q.notify({
    color: 'positive',
    message: 'Средство добавлено в библиотеку',
    icon: 'check_circle',
  });

  emit('select', addedTreatment);
}

onMounted(() => {
  if (treatmentLibrary.treatments.length === 0) {
    treatmentLibrary.initializeTreatments();
  }
});
</script>

<style scoped>
.treatment-card {
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.treatment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--q-primary);
}

.treatment-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
