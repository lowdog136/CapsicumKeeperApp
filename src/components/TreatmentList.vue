<template>
  <div>
    <!-- Поиск -->
    <q-input
      v-model="searchQuery"
      label="Поиск средств обработки"
      outlined
      dense
      class="q-mb-sm"
      placeholder="Введите название средства..."
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

    <!-- Список средств -->
    <div class="treatment-list" style="max-height: 400px; overflow-y: auto">
      <q-card
        v-for="treatment in filteredTreatments"
        :key="treatment.id"
        class="treatment-card q-mb-sm"
        clickable
        @click="handleSelect(treatment)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-subtitle2">{{ treatment.name }}</div>
              <div v-if="treatment.description" class="text-caption text-grey-6">
                {{ treatment.description }}
              </div>
              <div class="text-caption">
                <q-chip
                  v-if="treatment.activeIngredient"
                  size="sm"
                  :label="`Активное вещество: ${treatment.activeIngredient}`"
                  color="secondary"
                  text-color="white"
                />
                <q-chip
                  v-if="treatment.concentration"
                  size="sm"
                  :label="`${treatment.concentration}${treatment.unit || ''}`"
                  color="primary"
                  text-color="white"
                />
              </div>
              <div v-if="treatment.manufacturer" class="text-caption text-grey-7">
                {{ treatment.manufacturer }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                dense
                :icon="treatment.isFavorite ? 'favorite' : 'favorite_border'"
                :color="treatment.isFavorite ? 'red' : 'grey'"
                @click.stop="handleToggleFavorite(treatment.id)"
              >
                <q-tooltip>{{
                  treatment.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'
                }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TreatmentAgent } from 'stores/treatment-library';

interface Props {
  treatments: TreatmentAgent[];
  onSearch: (query: string) => TreatmentAgent[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', treatment: TreatmentAgent): void;
  (e: 'toggleFavorite', id: string): void;
}>();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Фунгициды', value: 'fungicide' },
  { label: 'Инсектициды', value: 'insecticide' },
  { label: 'Гербициды', value: 'herbicide' },
  { label: 'Пестициды', value: 'pesticide' },
  { label: 'Био', value: 'bio' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.slice(1).map((c) => ({
  label: c.label,
  value: c.value,
}));

// Фильтрация средств
const filteredTreatments = computed(() => {
  let result = props.treatments;

  // Фильтр по категории
  if (selectedCategory.value) {
    result = result.filter((t) => t.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value) {
    result = props.onSearch(searchQuery.value);
  }

  return result;
});

// Обработчики событий
function handleSelect(treatment: TreatmentAgent) {
  emit('select', treatment);
}

function handleToggleFavorite(id: string) {
  emit('toggleFavorite', id);
}
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
