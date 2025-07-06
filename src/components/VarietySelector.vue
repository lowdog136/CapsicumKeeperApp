<template>
  <div>
    <!-- Поле выбора сорта -->
    <div class="row items-end q-gutter-sm">
      <div class="col">
        <q-input
          v-model="selectedVarietyName"
          label="Сорт перца*"
          :error="!!errors?.variety"
          :error-message="errors?.variety"
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
              :color="
                useV2
                  ? getHeatLevelInfoV2(selectedVariety.shu ?? selectedVariety.heatLevel).color
                  : getHeatLevelInfoV1(selectedVariety.heatLevel).color
              "
              text-color="white"
              size="sm"
              :label="
                useV2
                  ? getHeatLevelInfoV2(selectedVariety.shu ?? selectedVariety.heatLevel).name
                  : getHeatLevelInfoV1(selectedVariety.heatLevel).name
              "
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
                :options="useV2 ? [] : storeV1.heatLevels"
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
                :options="
                  useV2
                    ? storeV2.allItems.length > 0
                      ? Array.from(new Set(storeV2.allItems.map((v) => v.species)).values())
                          .filter(Boolean)
                          .map((s) => ({ label: s, value: s }))
                      : []
                    : storeV1.species
                "
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
          <div v-if="useV2 ? storeV2.loading : storeV1.loading" class="text-center q-pa-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="q-mt-md">Загрузка сортов...</div>
          </div>

          <div
            v-else-if="useV2 ? filteredVarietiesV2.length === 0 : filteredVarietiesV1.length === 0"
            class="text-center q-pa-xl"
          >
            <q-icon name="search_off" size="100px" color="grey-4" />
            <div class="text-h6 q-mt-md text-grey-6">Сорта не найдены</div>
            <div class="text-body2 text-grey-5">Попробуйте изменить параметры поиска</div>
          </div>

          <div v-else class="row q-col-gutter-md">
            <div
              v-for="variety in useV2
                ? filteredVarietiesV2.slice(0, 12)
                : filteredVarietiesV1.slice(0, 12)"
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
                      :color="
                        useV2
                          ? getHeatLevelInfoV2(variety.shu ?? variety.heatLevel).color
                          : getHeatLevelInfoV1(variety.heatLevel).color
                      "
                      text-color="white"
                      size="sm"
                      :label="
                        useV2
                          ? getHeatLevelInfoV2(variety.shu ?? variety.heatLevel).name
                          : getHeatLevelInfoV1(variety.heatLevel).name
                      "
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
                        <template v-if="useV2">
                          <template
                            v-if="typeof variety.plantHeight === 'object' && variety.plantHeight"
                          >
                            {{ variety.plantHeight.min ?? ''
                            }}<template v-if="variety.plantHeight.max"
                              >-{{ variety.plantHeight.max }}</template
                            >
                            <template v-if="variety.plantHeight.unit">
                              {{ variety.plantHeight.unit }}</template
                            >
                          </template>
                          <template v-else>{{ variety.plantHeight }}</template>
                        </template>
                        <template v-else>
                          {{ variety.plantHeight.min
                          }}<template v-if="variety.plantHeight.max"
                            >-{{ variety.plantHeight.max }}</template
                          >
                          <template v-if="variety.plantHeight.unit">
                            {{ variety.plantHeight.unit }}</template
                          >
                        </template>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Созревание</div>
                      <div class="text-body2">
                        <template v-if="useV2">
                          <template
                            v-if="
                              typeof variety.daysToMaturity === 'object' && variety.daysToMaturity
                            "
                          >
                            {{ variety.daysToMaturity.min ?? ''
                            }}<template v-if="variety.daysToMaturity.max"
                              >-{{ variety.daysToMaturity.max }}</template
                            >
                            дней
                          </template>
                          <template v-else>{{ variety.daysToMaturity }}</template>
                        </template>
                        <template v-else>
                          {{ variety.daysToMaturity.min
                          }}<template v-if="variety.daysToMaturity.max"
                            >-{{ variety.daysToMaturity.max }}</template
                          >
                          дней
                        </template>
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
              <p
                v-if="
                  useV2
                    ? getSpeciesInfoV2(selectedVariety.species)?.label
                    : getSpeciesInfoV1(selectedVariety.species)?.description
                "
              >
                {{
                  useV2
                    ? getSpeciesInfoV2(selectedVariety.species)?.label
                    : getSpeciesInfoV1(selectedVariety.species)?.description
                }}
              </p>

              <h6>Характеристики</h6>
              <ul>
                <li>
                  <strong>Острота:</strong>
                  {{
                    useV2
                      ? getHeatLevelInfoV2(selectedVariety.shu ?? selectedVariety.heatLevel).name
                      : getHeatLevelInfoV1(selectedVariety.heatLevel).name
                  }}
                </li>
                <li v-if="selectedVariety.color">
                  <strong>Цвета:</strong>
                  {{
                    Array.isArray(selectedVariety.color)
                      ? selectedVariety.color.join(', ')
                      : selectedVariety.color
                  }}
                </li>
                <li>
                  <strong>Высота:</strong>
                  {{
                    useV2
                      ? getHeatLevelInfoV2(selectedVariety.shu ?? selectedVariety.heatLevel).name
                      : getHeatLevelInfoV1(selectedVariety.heatLevel).name
                  }}
                </li>
                <li>
                  <strong>Созревание:</strong>
                  {{
                    useV2
                      ? getHeatLevelInfoV2(selectedVariety.shu ?? selectedVariety.heatLevel).name
                      : getHeatLevelInfoV1(selectedVariety.heatLevel).name
                  }}
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
                <template v-if="selectedVariety.fruitSize">
                  Длина:
                  {{
                    selectedVariety.fruitSize.length?.min ??
                    selectedVariety.fruitSize.length?.toString?.() ??
                    ''
                  }}<template v-if="selectedVariety.fruitSize.length?.max"
                    >-{{ selectedVariety.fruitSize.length.max }}</template
                  >
                  {{ selectedVariety.fruitSize.length?.unit }}<br />
                  Ширина:
                  {{
                    selectedVariety.fruitSize.width?.min ??
                    selectedVariety.fruitSize.width?.toString?.() ??
                    ''
                  }}<template v-if="selectedVariety.fruitSize.width?.max"
                    >-{{ selectedVariety.fruitSize.width.max }}</template
                  >
                  {{ selectedVariety.fruitSize.width?.unit }}
                </template>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import { useVarietyLibraryV2Store } from 'src/stores/variety-library-v2';
import type { PepperVariety } from 'src/components/models';

const props = defineProps<{
  modelValue?: any | null;
  errors?: { variety?: string };
  useV2?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any | null): void;
}>();

const useV2 = computed(() => props.useV2 === true);

// Stores
const storeV1 = useVarietyLibraryStore();
const storeV2 = useVarietyLibraryV2Store();

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

// --- V1 ---
const filteredVarietiesV1 = computed(() => {
  return storeV1.searchVarieties(searchTerm.value, filters.value);
});
const getHeatLevelInfoV1 = storeV1.getHeatLevelInfo;
const getSpeciesInfoV1 = storeV1.getSpeciesInfo;

// --- V2 ---
const filteredVarietiesV2 = computed(() => {
  let arr = storeV2.allItems.length > 0 ? storeV2.allItems : storeV2.items;
  if (searchTerm.value) {
    const q = searchTerm.value.trim().toLowerCase();
    arr = arr.filter((v) => v.name?.toLowerCase().includes(q));
  }
  if (filters.value.species) {
    arr = arr.filter((v) => v.species === filters.value.species);
  }
  // TODO: фильтр по heatLevel если появится в v2
  return arr;
});
const getHeatLevelInfoV2 = (level: any) => {
  // В v2 heatLevel может быть просто числом SHU или строкой, адаптировать под нужды UI
  if (!level) return { name: 'Нет данных', color: 'grey' };
  if (typeof level === 'string') return { name: level, color: 'primary' };
  if (typeof level === 'number') return { name: `${level} SHU`, color: 'red' };
  return { name: String(level), color: 'primary' };
};
const getSpeciesInfoV2 = (species: string) => ({ label: species, value: species });

// Методы
function selectVariety(variety: any) {
  selectedVariety.value = variety;
}

function confirmSelection() {
  if (selectedVariety.value) {
    showVarietyDialog.value = false;
  }
}

function handleDoubleClick(variety: any) {
  selectVariety(variety);
  confirmSelection();
}

// Инициализация
onMounted(async () => {
  if (useV2.value) {
    if (storeV2.items.length === 0) {
      await storeV2.fetchFirstPage();
    }
    if (storeV2.allItems.length === 0) {
      await storeV2.fetchAllItems();
    }
  } else {
    if (storeV1.varieties.length === 0) {
      await storeV1.loadVarieties();
    }
  }
});

watch(useV2, async (val) => {
  if (val) {
    if (storeV2.items.length === 0) {
      await storeV2.fetchFirstPage();
    }
    if (storeV2.allItems.length === 0) {
      await storeV2.fetchAllItems();
    }
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
