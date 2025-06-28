<template>
  <div>
    <!-- Поле выбора сорта -->
    <div class="row items-end q-gutter-sm">
      <div class="col">
        <q-input
          v-model="selectedVarietyName"
          label="Сорт перца*"
          :error="!!errors.variety"
          :error-message="errors.variety"
          required
          readonly
          class="q-mb-sm"
          placeholder="Выберите сорт из библиотеки"
        >
          <template v-slot:append>
            <q-btn flat dense icon="search" @click="showVarietyDialog = true" color="primary">
              <q-tooltip>Выбрать из библиотеки</q-tooltip>
            </q-btn>
          </template>
        </q-input>
      </div>
      <div class="col-auto">
        <q-btn
          v-if="selectedVariety"
          flat
          dense
          icon="info"
          @click="showVarietyInfo = true"
          color="info"
        >
          <q-tooltip>Информация о сорте</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Информация о выбранном сорте -->
    <div v-if="selectedVariety" class="q-mb-md">
      <q-card flat bordered class="bg-blue-1">
        <q-card-section class="q-pa-sm">
          <div class="row items-center q-gutter-sm">
            <q-chip
              :color="getHeatLevelInfo(selectedVariety.heatLevel).color"
              text-color="white"
              size="sm"
              :label="getHeatLevelInfo(selectedVariety.heatLevel).name"
            />
            <q-chip
              color="primary"
              text-color="white"
              size="sm"
              :label="selectedVariety.species"
              icon="science"
            />
            <q-chip
              v-if="selectedVariety.origin"
              color="grey"
              text-color="white"
              size="sm"
              :label="selectedVariety.origin"
            />
          </div>
          <div class="text-caption q-mt-xs text-grey-7">
            {{ selectedVariety.description }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Диалог выбора сорта -->
    <q-dialog v-model="showVarietyDialog" maximized>
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
                :options="store.heatLevels"
                option-label="name"
                option-value="level"
                outlined
                dense
                clearable
                placeholder="Острота"
                emit-value
                map-options
              >
                <template v-slot:prepend>
                  <q-icon name="whatshot" />
                </template>
              </q-select>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.species"
                :options="store.species"
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
          <div v-if="store.loading" class="text-center q-pa-xl">
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
              v-for="variety in filteredVarieties"
              :key="variety.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <q-card
                class="variety-selector-card cursor-pointer"
                :class="{ 'selected-variety': selectedVariety?.id === variety.id }"
                @click="selectVariety(variety)"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <h6 class="q-my-none text-weight-bold">{{ variety.name }}</h6>
                    <q-chip
                      :color="getHeatLevelInfo(variety.heatLevel).color"
                      text-color="white"
                      size="sm"
                      :label="getHeatLevelInfo(variety.heatLevel).name"
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

                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Высота</div>
                      <div class="text-body2">
                        {{ variety.plantHeight.min }}-{{ variety.plantHeight.max }}
                        {{ variety.plantHeight.unit }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Созревание</div>
                      <div class="text-body2">
                        {{ variety.daysToMaturity.min }}-{{ variety.daysToMaturity.max }} дней
                      </div>
                    </div>
                  </div>
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

    <!-- Диалог с подробной информацией о сорте -->
    <q-dialog v-model="showVarietyInfo" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedVariety?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="selectedVariety" class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <h6>Описание</h6>
              <p>{{ selectedVariety.description }}</p>

              <h6>Научная классификация</h6>
              <p><strong>Вид:</strong> {{ selectedVariety.species }}</p>
              <p v-if="getSpeciesInfo(selectedVariety.species)?.description">
                {{ getSpeciesInfo(selectedVariety.species)?.description }}
              </p>

              <h6>Характеристики</h6>
              <ul>
                <li>
                  <strong>Острота:</strong>
                  {{ getHeatLevelInfo(selectedVariety.heatLevel).name }} ({{
                    getHeatLevelInfo(selectedVariety.heatLevel).shuRange
                  }})
                </li>
                <li><strong>Цвета:</strong> {{ selectedVariety.color.join(', ') }}</li>
                <li>
                  <strong>Высота:</strong> {{ selectedVariety.plantHeight.min }}-{{
                    selectedVariety.plantHeight.max
                  }}
                  {{ selectedVariety.plantHeight.unit }}
                </li>
                <li>
                  <strong>Созревание:</strong> {{ selectedVariety.daysToMaturity.min }}-{{
                    selectedVariety.daysToMaturity.max
                  }}
                  дней
                </li>
                <li v-if="selectedVariety.origin">
                  <strong>Происхождение:</strong> {{ selectedVariety.origin }}
                </li>
              </ul>
            </div>

            <div class="col-12 col-md-6">
              <h6>Советы по выращиванию</h6>
              <ul>
                <li v-for="tip in selectedVariety.growingTips" :key="tip">{{ tip }}</li>
              </ul>

              <h6>Размер плода</h6>
              <p>
                Длина: {{ selectedVariety.fruitSize.length.min }}-{{
                  selectedVariety.fruitSize.length.max
                }}
                {{ selectedVariety.fruitSize.length.unit }}<br />
                Ширина: {{ selectedVariety.fruitSize.width.min }}-{{
                  selectedVariety.fruitSize.width.max
                }}
                {{ selectedVariety.fruitSize.width.unit }}
              </p>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import type { PepperVariety } from 'src/components/models';

const props = defineProps<{
  modelValue?: PepperVariety | null;
  errors?: { variety?: string };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PepperVariety | null): void;
}>();

const store = useVarietyLibraryStore();
const showVarietyDialog = ref(false);
const showVarietyInfo = ref(false);
const searchTerm = ref('');
const filters = ref({
  heatLevel: null as any,
  species: null as any,
});

// Computed свойства
const selectedVariety = computed({
  get: () => props.modelValue || null,
  set: (value) => emit('update:modelValue', value),
});

const selectedVarietyName = computed(() => selectedVariety.value?.name || '');

const filteredVarieties = computed(() => {
  return store.searchVarieties(searchTerm.value, filters.value);
});

const getHeatLevelInfo = store.getHeatLevelInfo;
const getSpeciesInfo = store.getSpeciesInfo;

// Методы
function selectVariety(variety: PepperVariety) {
  selectedVariety.value = variety;
}

function confirmSelection() {
  if (selectedVariety.value) {
    showVarietyDialog.value = false;
  }
}

// Инициализация
onMounted(async () => {
  if (store.varieties.length === 0) {
    await store.loadVarieties();
  }
});
</script>

<style scoped>
.variety-selector-card {
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.variety-selector-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.selected-variety {
  border-color: var(--q-primary);
  background-color: var(--q-primary);
  color: white;
}

.selected-variety .text-grey-6,
.selected-variety .text-grey-7 {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>
