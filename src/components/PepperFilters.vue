<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="row q-col-gutter-md">
        <!-- Поиск -->
        <div class="col-12 col-md-4">
          <q-input
            v-model="filters.search"
            placeholder="Поиск по названию или описанию..."
            outlined
            dense
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Фильтр по стадии -->
        <div class="col-12 col-md-2">
          <q-select
            v-model="filters.stage"
            :options="stageOptions"
            outlined
            dense
            clearable
            placeholder="Стадия"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="local_florist" />
            </template>
          </q-select>
        </div>

        <!-- Фильтр по месту посадки -->
        <div class="col-12 col-md-2">
          <q-select
            v-model="filters.location"
            :options="locationOptions"
            outlined
            dense
            clearable
            placeholder="Место"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="place" />
            </template>
          </q-select>
        </div>

        <!-- Фильтр по избранному -->
        <div class="col-12 col-md-2">
          <q-select
            v-model="filters.favorite"
            :options="favoriteOptions"
            outlined
            dense
            clearable
            placeholder="Избранное"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="star" />
            </template>
          </q-select>
        </div>

        <!-- Сортировка -->
        <div class="col-12 col-md-2">
          <q-select
            v-model="filters.sortBy"
            :options="sortOptions"
            outlined
            dense
            placeholder="Сортировка"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="sort" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Дополнительные фильтры -->
      <div class="row q-col-gutter-md q-mt-md" v-if="showAdvancedFilters">
        <div class="col-12 col-md-3">
          <q-input
            v-model="filters.dateFrom"
            type="date"
            outlined
            dense
            placeholder="Дата посадки с"
          >
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-3">
          <q-input
            v-model="filters.dateTo"
            type="date"
            outlined
            dense
            placeholder="Дата посадки до"
          >
            <template v-slot:prepend>
              <q-icon name="event" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-3">
          <q-input
            v-model.number="filters.minAge"
            type="number"
            outlined
            dense
            placeholder="Минимальный возраст (дней)"
          >
            <template v-slot:prepend>
              <q-icon name="schedule" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-3">
          <q-input
            v-model.number="filters.maxAge"
            type="number"
            outlined
            dense
            placeholder="Максимальный возраст (дней)"
          >
            <template v-slot:prepend>
              <q-icon name="schedule" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Кнопки управления -->
      <div class="row items-center justify-between q-mt-md">
        <div class="row items-center q-gutter-sm">
          <q-btn
            flat
            :icon="showAdvancedFilters ? 'expand_less' : 'expand_more'"
            :label="showAdvancedFilters ? 'Скрыть фильтры' : 'Расширенные фильтры'"
            @click="showAdvancedFilters = !showAdvancedFilters"
          />
          <q-btn flat icon="clear_all" label="Сбросить" @click="resetFilters" />
        </div>

        <div class="row items-center q-gutter-sm">
          <q-chip
            v-if="activeFiltersCount > 0"
            color="primary"
            text-color="white"
            :label="`${activeFiltersCount} фильтр${activeFiltersCount > 1 ? 'а' : ''}`"
          />
          <q-btn
            flat
            icon="view_list"
            :label="viewMode === 'grid' ? 'Список' : 'Сетка'"
            @click="toggleViewMode"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pepper } from './models';

const props = defineProps<{
  modelValue: any;
  viewMode?: 'grid' | 'list';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'update:viewMode', value: 'grid' | 'list'): void;
}>();

// Состояние
const showAdvancedFilters = ref(false);
const filters = ref({
  search: '',
  stage: null as string | null,
  location: null as string | null,
  favorite: null as boolean | null,
  sortBy: 'name' as string,
  dateFrom: '',
  dateTo: '',
  minAge: null as number | null,
  maxAge: null as number | null,
});

// Опции для фильтров
const stageOptions = [
  { label: 'Проращивание', value: 'проращивание' },
  { label: 'Рассада', value: 'рассада' },
  { label: 'Вегетация', value: 'вегетация' },
  { label: 'Плодоношение', value: 'плодоношение' },
  { label: 'Сбор урожая', value: 'сбор урожая' },
];

const locationOptions = [
  { label: 'Грунт', value: 'грунт' },
  { label: 'Теплица', value: 'теплица' },
  { label: 'Огород', value: 'огород' },
  { label: 'Горшок', value: 'горшок' },
  { label: 'Кассета для проращивания', value: 'кассета для проращивания' },
];

const favoriteOptions = [
  { label: 'Все', value: null },
  { label: 'Избранные', value: true },
  { label: 'Не избранные', value: false },
];

const sortOptions = [
  { label: 'По названию', value: 'name' },
  { label: 'По дате посадки', value: 'plantingDate' },
  { label: 'По стадии', value: 'stage' },
  { label: 'По возрасту', value: 'age' },
  { label: 'По избранному', value: 'favorite' },
];

// Вычисляемые свойства
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  if (filters.value.stage) count++;
  if (filters.value.location) count++;
  if (filters.value.favorite !== null) count++;
  if (filters.value.dateFrom) count++;
  if (filters.value.dateTo) count++;
  if (filters.value.minAge) count++;
  if (filters.value.maxAge) count++;
  return count;
});

// Методы
function resetFilters() {
  filters.value = {
    search: '',
    stage: null,
    location: null,
    favorite: null,
    sortBy: 'name',
    dateFrom: '',
    dateTo: '',
    minAge: null,
    maxAge: null,
  };
}

function toggleViewMode() {
  const newMode = props.viewMode === 'grid' ? 'list' : 'grid';
  emit('update:viewMode', newMode);
}

// Следим за изменениями фильтров
watch(
  filters,
  (newFilters) => {
    emit('update:modelValue', newFilters);
  },
  { deep: true },
);

// Инициализация
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      filters.value = { ...newValue };
    }
  },
  { immediate: true },
);
</script>
