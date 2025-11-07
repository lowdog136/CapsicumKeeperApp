<template>
  <div>
    <!-- Поле поиска -->
    <q-input
      v-model="searchQuery"
      label="Поиск удобрений"
      outlined
      dense
      class="q-mb-sm"
      placeholder="Введите название удобрения..."
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

    <!-- Список удобрений -->
    <div class="fertilizer-list">
      <q-card
        v-for="fertilizer in filteredFertilizers"
        :key="fertilizer.id"
        class="fertilizer-card q-mb-sm"
        clickable
        @click="handleSelect(fertilizer)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-subtitle2">{{ fertilizer.name }}</div>
              <div v-if="fertilizer.description" class="text-caption text-grey-6">
                {{ fertilizer.description }}
              </div>
              <div class="text-caption">
                <q-chip
                  v-for="(value, element) in fertilizer.composition"
                  :key="element"
                  size="sm"
                  :label="`${element}: ${value}%`"
                  class="fertilizer-composition-chip"
                  text-color="white"
                />
              </div>
              <div v-if="fertilizer.manufacturer" class="text-caption text-grey-7">
                {{ fertilizer.manufacturer }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                dense
                :icon="fertilizer.isFavorite ? 'favorite' : 'favorite_border'"
                :color="fertilizer.isFavorite ? 'red' : 'grey'"
                @click.stop="handleToggleFavorite(fertilizer.id)"
              >
                <q-tooltip>{{
                  fertilizer.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'
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
import type { Fertilizer } from 'stores/fertilizer-library-firestore';

interface Props {
  fertilizers: Fertilizer[];
  onSearch: (query: string) => Fertilizer[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', fertilizer: Fertilizer): void;
  (e: 'toggleFavorite', id: string): void;
}>();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Комплексные', value: 'complex' },
  { label: 'Минеральные', value: 'mineral' },
  { label: 'Органические', value: 'organic' },
  { label: 'Микроэлементы', value: 'micro' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.slice(1).map((c) => ({
  label: c.label,
  value: c.value,
}));

// Фильтрация удобрений
const filteredFertilizers = computed(() => {
  let result = props.fertilizers;

  // Поиск
  if (searchQuery.value && searchQuery.value.trim().length > 0) {
    result = props.onSearch(searchQuery.value);
  }

  // Фильтр по категории (применяем после поиска)
  if (selectedCategory.value) {
    result = result.filter((f) => f.category === selectedCategory.value);
  }

  return result;
});

// Обработчики событий
function handleSelect(fertilizer: Fertilizer) {
  emit('select', fertilizer);
}

function handleToggleFavorite(id: string) {
  emit('toggleFavorite', id);
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

/* Темно-зеленый цвет для тегов состава удобрений */
.fertilizer-composition-chip {
  background-color: #61892f !important;
  color: #ffffff !important;
}
</style>
