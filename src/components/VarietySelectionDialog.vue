<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выберите сорт из библиотеки</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Поиск и фильтры -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchTerm"
              placeholder="Поиск по названию..."
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.heatLevel"
              :options="heatLevelOptions"
              option-label="name"
              option-value="level"
              outlined
              dense
              clearable
              placeholder="Острота"
              emit-value
              map-options
              :disable="useV2"
            >
              <template v-slot:prepend>
                <q-icon name="whatshot" />
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.species"
              :options="speciesOptions"
              option-label="label"
              option-value="value"
              outlined
              dense
              clearable
              placeholder="Вид"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="science" />
              </template>
            </q-select>
          </div>
        </div>

        <!-- Список сортов -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner-dots size="50px" color="primary" />
          <div class="q-mt-md">Загрузка сортов...</div>
        </div>

        <div v-else-if="filteredVarieties.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="100px" color="grey-4" />
          <div class="text-h6 q-mt-md text-grey-6">Сорта не найдены</div>
          <div class="text-body2 text-grey-5">Попробуйте изменить параметры поиска</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="variety in filteredVarieties.slice(0, 12)"
            :key="variety.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card
              class="variety-selector-card cursor-pointer"
              :class="{ 'selected-variety': selectedVariety?.id === variety.id }"
              @click="selectVariety(variety)"
              @dblclick="handleDoubleClick(variety)"
            >
              <q-card-section>
                <div class="row items-center justify-between q-mb-sm">
                  <h6 class="q-my-none text-weight-bold">{{ variety.name }}</h6>
                  <q-chip
                    :color="getHeatLevelInfo(variety).color"
                    text-color="white"
                    size="sm"
                    :label="getHeatLevelInfo(variety).name"
                  />
                </div>
                <div class="row items-center q-mb-sm">
                  <q-chip
                    color="primary"
                    text-color="white"
                    size="sm"
                    :label="variety.species"
                    icon="science"
                  />
                </div>
                <p class="text-body2 q-mb-sm">{{ variety.description }}</p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn
          unelevated
          label="Выбрать"
          color="primary"
          :disable="!selectedVariety"
          @click="confirmSelection"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue';
import type { PepperVariety } from './models';

interface Props {
  modelValue: boolean;
  varieties: PepperVariety[];
  loading: boolean;
  useV2?: boolean;
  heatLevelOptions?: any[];
  speciesOptions?: any[];
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'select']);

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const searchTerm = ref('');
const filters = ref({ heatLevel: null, species: null });
const selectedVariety = ref<PepperVariety | null>(null);

const filteredVarieties = computed(() => {
  let arr = props.varieties;
  if (searchTerm.value) {
    const q = searchTerm.value.trim().toLowerCase();
    arr = arr.filter((v) => v.name?.toLowerCase().includes(q));
  }
  if (filters.value.species) {
    arr = arr.filter((v) => v.species === filters.value.species);
  }
  if (filters.value.heatLevel) {
    arr = arr.filter((v) => v.heatLevel === filters.value.heatLevel);
  }
  return arr;
});

function getHeatLevelInfo(variety: PepperVariety) {
  if (props.useV2) {
    const level = (variety as any).shu ?? variety.heatLevel;
    if (!level) return { name: 'Нет данных', color: 'grey' };
    if (typeof level === 'string') return { name: level, color: 'primary' };
    if (typeof level === 'number') return { name: `${level} SHU`, color: 'red' };
    return { name: String(level), color: 'primary' };
  } else {
    const heatLevels = [
      { level: 'mild', name: 'Слабая', color: 'green' },
      { level: 'medium', name: 'Средняя', color: 'orange' },
      { level: 'hot', name: 'Острая', color: 'red' },
      { level: 'superhot', name: 'Очень острая', color: 'purple' },
    ];
    const found = heatLevels.find((h) => h.level === variety.heatLevel);
    return found || { name: variety.heatLevel, color: 'primary' };
  }
}

function selectVariety(variety: PepperVariety) {
  selectedVariety.value = variety;
}

function confirmSelection() {
  if (selectedVariety.value) {
    emit('select', selectedVariety.value);
    emit('update:modelValue', false);
  }
}

function handleDoubleClick(variety: PepperVariety) {
  selectVariety(variety);
  confirmSelection();
}
</script>
