<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <h4 class="q-my-none">Библиотека сортов v2</h4>
      <p class="text-grey-6 q-mt-sm">Новая версия библиотеки сортов с поддержкой пагинации</p>
    </div>

    <div v-if="store.loading" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Загрузка сортов...</div>
    </div>

    <div v-else-if="store.error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">{{ store.error }}</div>
      <q-btn color="primary" label="Повторить" @click="store.fetchFirstPage" class="q-mt-md" />
    </div>

    <div v-else>
      <div class="row q-col-gutter-md">
        <div
          v-for="variety in store.items"
          :key="variety.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card class="q-mb-md variety-card-fixed">
            <q-card-section>
              <div class="text-h6 q-mb-xs">{{ variety.name }}</div>
              <div class="text-caption text-grey-7 q-mb-xs">
                <q-icon name="science" size="16px" class="q-mr-xs" />{{ variety.species }}
              </div>
              <div v-if="variety.description" class="text-body2 q-mb-xs variety-desc-ellipsis">
                {{ variety.description }}
              </div>
              <div v-if="variety.shu" class="q-mb-xs">
                <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Острота:</span>
                <span
                  >{{
                    Array.isArray(variety.shu) ? variety.shu.join(' – ') : variety.shu
                  }}
                  SHU</span
                >
              </div>
              <div v-if="variety.color && variety.color.length" class="q-mb-xs">
                <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Цвета:</span>
                <span>
                  <span
                    v-for="color in variety.color"
                    :key="color"
                    :title="color"
                    class="color-dot"
                    :style="{ backgroundColor: getColorHex(color) }"
                  ></span>
                </span>
              </div>
              <div v-if="variety.length" class="q-mb-xs">
                <q-icon name="straighten" color="teal" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Длина:</span>
                <span>{{ variety.length }} мм</span>
              </div>
              <div v-if="variety.weight" class="q-mb-xs">
                <q-icon name="fitness_center" color="grey" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Вес плода:</span>
                <span>{{ variety.weight }}</span>
              </div>
              <div v-if="getPlantHeight(variety)" class="q-mb-xs">
                <q-icon name="grass" color="green" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Высота куста:</span>
                <span>{{ getPlantHeight(variety) }}</span>
              </div>
              <div v-if="getFruitLength(variety)" class="q-mb-xs">
                <q-icon name="straighten" color="blue" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Длина плода:</span>
                <span>{{ getFruitLength(variety) }}</span>
              </div>
              <div v-if="variety.daysToMaturity" class="q-mb-xs">
                <q-icon name="event" color="orange" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Дни до созревания:</span>
                <span>{{ variety.daysToMaturity }}</span>
              </div>
              <div v-if="variety.origin" class="q-mb-xs">
                <q-icon name="public" color="blue" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Происхождение:</span>
                <span>{{ variety.origin }}</span>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat color="primary" label="Подробнее" @click="openDetails(variety)" />
              <q-btn v-if="isAdmin" flat color="secondary" icon="edit" @click="openEdit(variety)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
      <div class="row justify-center q-mt-lg">
        <q-btn
          :disable="store.loading || store.currentPage === 1"
          icon="chevron_left"
          @click="store.fetchPrevPage"
          flat
          round
          class="q-mr-sm"
        />
        <q-btn
          :disable="store.loading || !store.hasNextPage"
          icon="chevron_right"
          @click="store.fetchNextPage"
          flat
          round
          class="q-ml-sm"
        />
      </div>
    </div>

    <!-- Диалог редактирования цвета -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Редактировать цвета</div>
          <div class="q-mt-md">
            <div class="q-mb-sm">
              <q-select
                v-model="colorInput"
                :options="colorOptions"
                label="Выбрать цвет"
                dense
                emit-value
                map-options
              />
              <q-input v-model="customColor" label="Свой цвет (на русском)" dense class="q-mt-sm" />
              <q-btn flat color="primary" label="Добавить" @click="addColor" class="q-ml-sm" />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="plantHeightSelect"
                :options="plantHeightOptions"
                label="Высота куста"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="plantHeightSelect === 'свой размер'"
                v-model="plantHeightCustom"
                label="Введите свой размер (см или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="fruitLengthSelect"
                :options="fruitLengthOptions"
                label="Длина плода"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="fruitLengthSelect === 'свой размер'"
                v-model="fruitLengthCustom"
                label="Введите свой размер (мм или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="fruitWeightSelect"
                :options="fruitWeightOptions"
                label="Вес плода"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="fruitWeightSelect === 'свой вариант'"
                v-model="fruitWeightCustom"
                label="Введите свой вариант (грамм или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="daysToMaturitySelect"
                :options="daysToMaturityOptions"
                label="Дни до созревания"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="daysToMaturitySelect === 'свой вариант'"
                v-model="daysToMaturityCustom"
                label="Введите свой вариант (например, 80-100 дней)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-input v-model="originInput" label="Происхождение" dense />
            </div>
            <div>
              <span v-for="color in editColors" :key="color" class="q-mr-sm">
                <span
                  class="color-dot"
                  :style="{ backgroundColor: getColorHex(color) }"
                  :title="color"
                ></span>
                <span>{{ color }}</span>
                <q-btn
                  flat
                  dense
                  icon="close"
                  size="xs"
                  color="negative"
                  @click="removeColor(color)"
                />
              </span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Сохранить" color="primary" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог подробностей -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ detailsVariety?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="detailsVariety">
            <div class="q-mb-md text-caption text-grey-7">
              <q-icon name="science" size="16px" class="q-mr-xs" />{{ detailsVariety.species }}
            </div>
            <div class="q-mb-md">{{ detailsVariety.description }}</div>
            <div v-if="detailsVariety.shu" class="q-mb-xs">
              <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Острота:</span>
              <span
                >{{
                  Array.isArray(detailsVariety.shu)
                    ? detailsVariety.shu.join(' – ')
                    : detailsVariety.shu
                }}
                SHU</span
              >
            </div>
            <div v-if="detailsVariety.color && detailsVariety.color.length" class="q-mb-xs">
              <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Цвета:</span>
              <span>
                <span
                  v-for="color in detailsVariety.color"
                  :key="color"
                  :title="color"
                  class="color-dot"
                  :style="{ backgroundColor: getColorHex(color) }"
                ></span>
              </span>
            </div>
            <div v-if="detailsVariety.length" class="q-mb-xs">
              <q-icon name="straighten" color="teal" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Длина:</span>
              <span>{{ detailsVariety.length }} мм</span>
            </div>
            <div v-if="detailsVariety.weight" class="q-mb-xs">
              <q-icon name="fitness_center" color="grey" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Вес плода:</span>
              <span>{{ detailsVariety.weight }}</span>
            </div>
            <div v-if="getPlantHeight(detailsVariety)" class="q-mb-xs">
              <q-icon name="grass" color="green" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Высота куста:</span>
              <span>{{ getPlantHeight(detailsVariety) }}</span>
            </div>
            <div v-if="getFruitLength(detailsVariety)" class="q-mb-xs">
              <q-icon name="straighten" color="blue" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Длина плода:</span>
              <span>{{ getFruitLength(detailsVariety) }}</span>
            </div>
            <div v-if="detailsVariety.daysToMaturity" class="q-mb-xs">
              <q-icon name="event" color="orange" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Дни до созревания:</span>
              <span>{{ detailsVariety.daysToMaturity }}</span>
            </div>
            <div v-if="detailsVariety.origin" class="q-mb-xs">
              <q-icon name="public" color="blue" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Происхождение:</span>
              <span>{{ detailsVariety.origin }}</span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useVarietyLibraryV2Store } from 'stores/variety-library-v2';
import { useUserStore } from 'stores/user-store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from 'src/boot/firebase';

const store = useVarietyLibraryV2Store();
const userStore = useUserStore();

const editingVariety = ref(null as any);
const showEditDialog = ref(false);
const editColors = ref<string[]>([]);
const colorInput = ref('');
const showDetailsDialog = ref(false);
const detailsVariety = ref(null as any);
const colorOptions = [
  'красный',
  'оранжевый',
  'желтый',
  'зелёный',
  'зеленый',
  'фиолетовый',
  'пурпурный',
  'белый',
  'чёрный',
  'черный',
  'коричневый',
  'шоколадный',
  'розовый',
  'синий',
  'голубой',
  'кремовый',
];
const customColor = ref('');
const plantHeightOptions = ['до 50 см', 'от 50 см до 1м', 'выше 1м', 'свой размер'];
const fruitLengthOptions = [
  'до 5 см',
  'от 5 до 10 см',
  'больше 10 см',
  'больше 20 см',
  'свой размер',
];
const fruitWeightOptions = [
  'до 10 грамм',
  'от 10 грамм до 50 грамм',
  'от 50 грамм до 100 грамм',
  'больше 100 грамм',
  'больше 200 грамм',
  'свой вариант',
];
const plantHeightSelect = ref('');
const plantHeightCustom = ref('');
const fruitLengthSelect = ref('');
const fruitLengthCustom = ref('');
const fruitWeightSelect = ref('');
const fruitWeightCustom = ref('');
const daysToMaturityOptions = [
  '30-60 дней',
  '60-90 дней',
  '90-120 дней',
  'больше 120 дней',
  'свой вариант',
];
const daysToMaturitySelect = ref('');
const daysToMaturityCustom = ref('');
const originInput = ref('');

const isAdmin = computed(() => userStore.user?.email === 'lowdog136@gmail.com');

function openEdit(variety: any) {
  editingVariety.value = { ...variety };
  editColors.value = Array.isArray(variety.color) ? [...variety.color] : [];
  // Высота куста
  if (typeof variety.plantHeight === 'string' && plantHeightOptions.includes(variety.plantHeight)) {
    plantHeightSelect.value = variety.plantHeight;
    plantHeightCustom.value = '';
  } else if (variety.plantHeight) {
    plantHeightSelect.value = 'свой размер';
    plantHeightCustom.value = String(variety.plantHeight);
  } else {
    plantHeightSelect.value = '';
    plantHeightCustom.value = '';
  }
  // Длина плода
  if (typeof variety.fruitLength === 'string' && fruitLengthOptions.includes(variety.fruitLength)) {
    fruitLengthSelect.value = variety.fruitLength;
    fruitLengthCustom.value = '';
  } else if (variety.fruitLength) {
    fruitLengthSelect.value = 'свой размер';
    fruitLengthCustom.value = String(variety.fruitLength);
  } else {
    fruitLengthSelect.value = '';
    fruitLengthCustom.value = '';
  }
  // Вес плода
  if (typeof variety.weight === 'string' && fruitWeightOptions.includes(variety.weight)) {
    fruitWeightSelect.value = variety.weight;
    fruitWeightCustom.value = '';
  } else if (variety.weight) {
    fruitWeightSelect.value = 'свой вариант';
    fruitWeightCustom.value = String(variety.weight);
  } else {
    fruitWeightSelect.value = '';
    fruitWeightCustom.value = '';
  }
  // Дни до созревания
  if (
    typeof variety.daysToMaturity === 'string' &&
    daysToMaturityOptions.includes(variety.daysToMaturity)
  ) {
    daysToMaturitySelect.value = variety.daysToMaturity;
    daysToMaturityCustom.value = '';
  } else if (variety.daysToMaturity) {
    daysToMaturitySelect.value = 'свой вариант';
    daysToMaturityCustom.value = String(variety.daysToMaturity);
  } else {
    daysToMaturitySelect.value = '';
    daysToMaturityCustom.value = '';
  }
  // Происхождение
  originInput.value = variety.origin || '';
  showEditDialog.value = true;
  customColor.value = '';
}
async function saveEdit() {
  if (!editingVariety.value) return;
  const docRef = doc(db, 'varieties_v2', editingVariety.value.id);
  const updateData: any = { color: editColors.value };
  // Высота куста
  if (plantHeightSelect.value === 'свой размер' && plantHeightCustom.value) {
    updateData.plantHeight = plantHeightCustom.value;
  } else if (plantHeightSelect.value) {
    updateData.plantHeight = plantHeightSelect.value;
  }
  // Длина плода
  if (fruitLengthSelect.value === 'свой размер' && fruitLengthCustom.value) {
    updateData.fruitLength = fruitLengthCustom.value;
  } else if (fruitLengthSelect.value) {
    updateData.fruitLength = fruitLengthSelect.value;
  }
  // Вес плода
  if (fruitWeightSelect.value === 'свой вариант' && fruitWeightCustom.value) {
    updateData.weight = fruitWeightCustom.value;
  } else if (fruitWeightSelect.value) {
    updateData.weight = fruitWeightSelect.value;
  }
  // Дни до созревания
  if (daysToMaturitySelect.value === 'свой вариант' && daysToMaturityCustom.value) {
    updateData.daysToMaturity = daysToMaturityCustom.value;
  } else if (daysToMaturitySelect.value) {
    updateData.daysToMaturity = daysToMaturitySelect.value;
  }
  // Происхождение
  updateData.origin = originInput.value;
  await updateDoc(docRef, updateData);
  editingVariety.value.color = [...editColors.value];
  editingVariety.value.plantHeight = updateData.plantHeight;
  editingVariety.value.fruitLength = updateData.fruitLength;
  editingVariety.value.weight = updateData.weight;
  editingVariety.value.daysToMaturity = updateData.daysToMaturity;
  editingVariety.value.origin = updateData.origin;
  showEditDialog.value = false;
  if (store.currentPage > 1) {
    await store.fetchPrevPage();
    await store.fetchNextPage();
  } else {
    await store.fetchFirstPage();
  }
}
function addColor() {
  if (colorInput.value && !editColors.value.includes(colorInput.value)) {
    editColors.value.push(colorInput.value);
    colorInput.value = '';
  }
  if (customColor.value && !editColors.value.includes(customColor.value)) {
    editColors.value.push(customColor.value);
    customColor.value = '';
  }
}
function removeColor(color: string) {
  editColors.value = editColors.value.filter((c) => c !== color);
}
function openDetails(variety: any) {
  detailsVariety.value = variety;
  showDetailsDialog.value = true;
}

function getColorHex(color: string) {
  const map: Record<string, string> = {
    красный: '#e53935',
    оранжевый: '#fb8c00',
    желтый: '#fdd835',
    зеленый: '#43a047',
    зелёный: '#43a047',
    фиолетовый: '#8e24aa',
    пурпурный: '#ad1457',
    белый: '#fafafa',
    черный: '#212121',
    чёрный: '#212121',
    коричневый: '#6d4c41',
    шоколадный: '#795548',
    розовый: '#ec407a',
    синий: '#1e88e5',
    голубой: '#00bcd4',
    кремовый: '#fff9c4',
  };
  return map[color.toLowerCase()] || '#bdbdbd';
}

function getPlantHeight(variety: any) {
  if (typeof variety.plantHeight === 'number') return `${variety.plantHeight} см`;
  if (typeof variety.plantHeight === 'string') return variety.plantHeight;
  if (Array.isArray(variety.plantHeight)) return variety.plantHeight.join('–') + ' см';
  if (typeof variety.plantHeight === 'object' && variety.plantHeight) {
    if (variety.plantHeight.min && variety.plantHeight.max)
      return `${variety.plantHeight.min}–${variety.plantHeight.max} см`;
    if (variety.plantHeight.value) return `${variety.plantHeight.value} см`;
  }
  return '';
}
function getFruitLength(variety: any) {
  if (typeof variety.fruitLength === 'number') return `${variety.fruitLength} мм`;
  if (typeof variety.fruitLength === 'string') return variety.fruitLength;
  if (Array.isArray(variety.fruitLength)) return variety.fruitLength.join('–') + ' мм';
  if (typeof variety.fruitLength === 'object' && variety.fruitLength) {
    if (variety.fruitLength.min && variety.fruitLength.max)
      return `${variety.fruitLength.min}–${variety.fruitLength.max} мм`;
    if (variety.fruitLength.value) return `${variety.fruitLength.value} мм`;
  }
  return '';
}

onMounted(() => {
  store.fetchFirstPage();
});
</script>

<style scoped>
.variety-card-fixed {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.variety-desc-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px;
}
.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 4px;
  border: 1px solid #ccc;
  vertical-align: middle;
}
</style>
