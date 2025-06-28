<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h4 class="q-my-none">Библиотека сортов перца</h4>
        <p class="text-grey-6 q-mt-sm">
          Изучите разнообразие сортов перца со всего мира.
          <br />Сорта и описания взяты с сайта
          <a href="https://pepperseeds.ru" target="_blank" class="text-primary">pepperseeds.ru</a>
        </p>
        <div v-if="store.lastCheckDate" class="text-caption text-grey-5 q-mt-xs">
          Последняя проверка: {{ formatDate(store.lastCheckDate) }}
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="download"
          label="Полный импорт"
          @click="importAllVarieties"
          :loading="store.loading"
        />
        <q-btn
          color="info"
          icon="refresh"
          label="Проверить новые"
          @click="checkNewVarieties"
          :loading="store.loading"
        />
        <q-btn color="warning" icon="search" label="Проверить дубликаты" @click="checkDuplicates" />
        <q-btn
          color="warning"
          icon="clean"
          label="Удалить дубликаты"
          @click="removeDuplicates"
          :loading="store.loading"
        />
        <q-btn color="secondary" icon="add" label="Добавить сорт" @click="showAddDialog = true" />
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Поиск -->
          <div class="col-12 col-md-4">
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

          <!-- Фильтр по остроте -->
          <div class="col-12 col-md-2">
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

          <!-- Фильтр по категории -->
          <div class="col-12 col-md-2">
            <q-select
              v-model="filters.category"
              :options="store.categories"
              option-label="label"
              option-value="value"
              outlined
              dense
              clearable
              placeholder="Категория"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="category" />
              </template>
            </q-select>
          </div>

          <!-- Фильтр по виду Capsicum -->
          <div class="col-12 col-md-2">
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
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Только избранные -->
          <div class="col-12 col-md-2">
            <q-toggle v-model="filters.onlyFavorites" label="Только избранные" color="red" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Статистика -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card color="primary" text-color="white">
          <q-card-section>
            <div class="text-h6">{{ filteredVarieties.length }}</div>
            <div class="text-subtitle2">Всего сортов</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card color="red" text-color="white">
          <q-card-section>
            <div class="text-h6">{{ store.favoriteVarieties.length }}</div>
            <div class="text-subtitle2">В избранном</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card color="orange" text-color="white">
          <q-card-section>
            <div class="text-h6">{{ speciesStats.chinense }}</div>
            <div class="text-subtitle2">Capsicum chinense</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card color="green" text-color="white">
          <q-card-section>
            <div class="text-h6">{{ speciesStats.annuum }}</div>
            <div class="text-subtitle2">Capsicum annuum</div>
          </q-card-section>
        </q-card>
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
      <div class="text-body2 text-grey-5">
        Попробуйте изменить параметры поиска или добавить новые сорта
      </div>
    </div>

    <div v-else>
      <div class="row q-col-gutter-md">
        <div
          v-for="variety in paginatedVarieties"
          :key="variety.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <VarietyCard :variety="variety" @add-to-garden="addToGarden" />
        </div>
      </div>
      <div class="row justify-center q-mt-lg">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="6"
          boundary-numbers
          direction-links
          color="primary"
          size="lg"
        />
      </div>
      <div class="text-center q-mt-md text-grey-6">
        Показано {{ startIndex + 1 }}-{{ endIndex }} из {{ filteredVarieties.length }} сортов
      </div>
    </div>

    <!-- Диалог добавления сорта -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Добавить новый сорт</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="newVariety.name" label="Название сорта" outlined dense />
            </div>
            <div class="col-12">
              <q-select
                v-model="newVariety.species"
                :options="store.species"
                option-label="label"
                option-value="value"
                label="Вид Capsicum"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="newVariety.description"
                label="Описание"
                type="textarea"
                outlined
                dense
                rows="3"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="newVariety.heatLevel"
                :options="store.heatLevels"
                option-label="name"
                option-value="level"
                label="Уровень остроты"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="newVariety.category"
                :options="store.categories"
                option-label="label"
                option-value="value"
                label="Категория"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Добавить" color="primary" @click="addVariety" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import VarietyCard from 'src/components/VarietyCard.vue';
import type {
  PepperVariety,
  HeatLevel,
  PepperCategory,
  CapsicumSpecies,
} from 'src/components/models';

const $q = useQuasar();
const store = useVarietyLibraryStore();

const ITEMS_PER_PAGE = 12;
const currentPage = ref(1);

const searchTerm = ref('');
const showAddDialog = ref(false);
const filters = ref({
  heatLevel: null as HeatLevel | null,
  category: null as PepperCategory | null,
  species: null as CapsicumSpecies | null,
  onlyFavorites: false,
});

const newVariety = ref({
  name: '',
  species: 'Capsicum annuum' as CapsicumSpecies,
  description: '',
  heatLevel: 'medium' as HeatLevel,
  category: 'other' as PepperCategory,
});

const filteredVarieties = computed(() => {
  const searchFilters: {
    heatLevel?: HeatLevel;
    category?: PepperCategory;
    species?: CapsicumSpecies;
    onlyFavorites?: boolean;
  } = {};
  if (filters.value.heatLevel) searchFilters.heatLevel = filters.value.heatLevel;
  if (filters.value.category) searchFilters.category = filters.value.category;
  if (filters.value.species) searchFilters.species = filters.value.species;
  if (filters.value.onlyFavorites) searchFilters.onlyFavorites = filters.value.onlyFavorites;
  return store.searchVarieties(searchTerm.value, searchFilters);
});

const totalPages = computed(() => Math.ceil(filteredVarieties.value.length / ITEMS_PER_PAGE));
const startIndex = computed(() => (currentPage.value - 1) * ITEMS_PER_PAGE);
const endIndex = computed(() =>
  Math.min(startIndex.value + ITEMS_PER_PAGE, filteredVarieties.value.length),
);
const paginatedVarieties = computed(() =>
  filteredVarieties.value.slice(startIndex.value, endIndex.value),
);

watch(
  [searchTerm, filters],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

const speciesStats = computed(() => {
  const stats = {
    annuum: 0,
    chinense: 0,
    baccatum: 0,
    pubescens: 0,
    frutescens: 0,
  };

  store.varieties.forEach((variety) => {
    switch (variety.species) {
      case 'Capsicum annuum':
        stats.annuum++;
        break;
      case 'Capsicum chinense':
        stats.chinense++;
        break;
      case 'Capsicum baccatum':
        stats.baccatum++;
        break;
      case 'Capsicum pubescens':
        stats.pubescens++;
        break;
      case 'Capsicum frutescens':
        stats.frutescens++;
        break;
    }
  });

  return stats;
});

const addToGarden = (variety: PepperVariety) => {
  $q.notify({
    color: 'positive',
    message: `Сорт "${variety.name}" добавлен в сад`,
    icon: 'check_circle',
  });
  // Здесь можно добавить логику добавления в сад
};

const addVariety = async () => {
  if (!newVariety.value.name || !newVariety.value.description) {
    $q.notify({
      color: 'negative',
      message: 'Заполните обязательные поля',
      icon: 'error',
    });
    return;
  }

  try {
    const varietyData = {
      ...newVariety.value,
      color: ['красный'], // По умолчанию
      plantHeight: { min: 50, max: 80, unit: 'cm' as const },
      daysToMaturity: { min: 70, max: 90 },
      fruitSize: {
        length: { min: 5, max: 10, unit: 'cm' as const },
        width: { min: 2, max: 4, unit: 'cm' as const },
      },
      growingTips: ['Регулярный полив', 'Солнечное место'],
      origin: 'Не указано',
    };

    await store.addVariety(varietyData);

    // Сброс формы
    newVariety.value = {
      name: '',
      species: 'Capsicum annuum',
      description: '',
      heatLevel: 'medium',
      category: 'other',
    };

    showAddDialog.value = false;

    $q.notify({
      color: 'positive',
      message: 'Сорт успешно добавлен',
      icon: 'check_circle',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при добавлении сорта',
      icon: 'error',
    });
  }
};

const importAllVarieties = async () => {
  try {
    const result = await store.importAllFromPepperSeeds();
    $q.notify({
      color: 'positive',
      message: `Импортировано ${result.added} новых сортов, пропущено ${result.skipped} существующих`,
      icon: 'download_done',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при импорте сортов',
      icon: 'error',
    });
  }
};

const checkNewVarieties = async () => {
  try {
    const result = await store.checkForNewVarieties();
    if (result.hasNew) {
      $q.notify({
        color: 'info',
        message: `Найдено ${result.new} новых сортов! Нажмите "Полный импорт" для добавления.`,
        icon: 'info',
        timeout: 5000,
      });
    } else {
      $q.notify({
        color: 'positive',
        message: 'Новых сортов не найдено',
        icon: 'check_circle',
      });
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при проверке новых сортов',
      icon: 'error',
    });
  }
};

const checkDuplicates = () => {
  const duplicateCheck = store.checkForDuplicates();

  if (duplicateCheck.hasDuplicates) {
    $q.notify({
      color: 'warning',
      message: `Найдено ${duplicateCheck.count} дубликатов: ${duplicateCheck.duplicates.map((d) => d.name).join(', ')}`,
      icon: 'warning',
      timeout: 8000,
    });
  } else {
    $q.notify({
      color: 'positive',
      message: 'Дубликаты не найдены',
      icon: 'check_circle',
    });
  }
};

const removeDuplicates = async () => {
  try {
    console.log('Начинаем удаление дубликатов...');
    const removedCount = await store.removeDuplicates();

    if (removedCount > 0) {
      $q.notify({
        color: 'positive',
        message: `Успешно удалено ${removedCount} дубликатов`,
        icon: 'check_circle',
      });
    } else {
      $q.notify({
        color: 'info',
        message: 'Дубликаты не найдены',
        icon: 'info',
      });
    }
  } catch (error) {
    console.error('Ошибка при удалении дубликатов:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка при удалении дубликатов',
      icon: 'error',
    });
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(async () => {
  await store.loadVarieties();
  store.loadLastCheckDate();
});
</script>
