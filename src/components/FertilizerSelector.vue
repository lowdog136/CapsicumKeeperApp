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
          :on-search="searchFertilizers"
          @select="selectFertilizer"
          @toggle-favorite="toggleFavorite"
        />

        <!-- Кнопка добавления нового удобрения -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            class="darker-green-btn"
            icon="add"
            label="Добавить новое удобрение"
            @click="showAddDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления нового удобрения -->
    <FertilizerFormDialog
      v-model="showAddDialog"
      :fertilizer="editingFertilizer"
      :loading="fertilizerLibrary.loading"
      @save="addNewFertilizer"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useFertilizerLibraryFirestore, type Fertilizer } from 'stores/fertilizer-library-firestore';
import FertilizerList from './FertilizerList.vue';
import FertilizerFormDialog from './FertilizerFormDialog.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', fertilizer: Fertilizer): void;
}>();

const $q = useQuasar();
const fertilizerLibrary = useFertilizerLibraryFirestore();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const showAddDialog = ref(false);
const editingFertilizer = ref<Fertilizer | null>(null);

// Загрузка удобрений при первом открытии
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && fertilizerLibrary.fertilizers.length === 0) {
      await fertilizerLibrary.fetchFertilizers();
    }
  },
);

onMounted(async () => {
  if (fertilizerLibrary.fertilizers.length === 0) {
    await fertilizerLibrary.fetchFertilizers();
  }
  // Подписываемся на изменения в реальном времени
  fertilizerLibrary.subscribeFertilizers();
});

// Методы
function selectFertilizer(fertilizer: Fertilizer) {
  emit('select', fertilizer);
  showDialog.value = false;
}

async function toggleFavorite(id: string) {
  try {
    await fertilizerLibrary.toggleFavorite(id);
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Ошибка при обновлении',
      icon: 'error',
    });
  }
}

async function addNewFertilizer(fertilizerData: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const id = await fertilizerLibrary.addFertilizer(fertilizerData);
    
    // Ждем обновления через подписку или перезагружаем список
    await fertilizerLibrary.fetchFertilizers();
    
    const addedFertilizer = fertilizerLibrary.getFertilizerById(id);
    
    if (addedFertilizer) {
      $q.notify({
        color: 'positive',
        message: 'Удобрение добавлено в библиотеку',
        icon: 'check_circle',
      });
      emit('select', addedFertilizer);
      showAddDialog.value = false;
      editingFertilizer.value = null;
    } else {
      // Если не нашли сразу, создаем объект из данных
      const newFertilizer: Fertilizer = {
        id,
        ...fertilizerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      $q.notify({
        color: 'positive',
        message: 'Удобрение добавлено в библиотеку',
        icon: 'check_circle',
      });
      emit('select', newFertilizer);
      showAddDialog.value = false;
      editingFertilizer.value = null;
    }
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Ошибка при добавлении',
      icon: 'error',
    });
  }
}

// Функция поиска для FertilizerList
function searchFertilizers(query: string): Fertilizer[] {
  if (!query || query.trim().length === 0) {
    return fertilizerLibrary.fertilizers;
  }
  const searchLower = query.toLowerCase();
  return fertilizerLibrary.fertilizers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchLower) ||
      f.description?.toLowerCase().includes(searchLower) ||
      f.manufacturer?.toLowerCase().includes(searchLower),
  );
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

/* Темно-зеленая кнопка добавления удобрения */
.darker-green-btn {
  background-color: #61892f !important;
  color: #ffffff !important;
}

.darker-green-btn:hover {
  background-color: #4a6b23 !important;
}
</style>
