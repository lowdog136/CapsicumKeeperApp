<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">Библиотека сортов перцев</div>

    <!-- Поиск -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchTerm" label="Поиск сортов" outlined dense clearable>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedHeatLevel"
              :options="heatLevelOptions"
              label="Уровень остроты"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="positive"
              label="Добавить сорт"
              icon="add"
              @click="showAddDialog = true"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Загрузка -->
    <div v-if="varietyLibraryStore.loading" class="text-center q-pa-lg">
      <q-spinner-dots color="positive" size="50px" />
      <div class="q-mt-sm">Загрузка сортов...</div>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="filteredVarieties.length === 0" class="text-center q-pa-lg">
      <q-icon name="local_florist" size="64px" color="grey-4" />
      <div class="text-h6 q-mt-sm text-grey-6">Сорта не найдены</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        Попробуйте изменить параметры поиска или добавьте новый сорт
      </div>
      <q-btn
        color="positive"
        label="Добавить первый сорт"
        icon="add"
        class="q-mt-md"
        @click="showAddDialog = true"
      />
    </div>

    <!-- Список сортов -->
    <div v-else>
      <div class="text-caption text-grey-6 q-mb-md">
        Найдено сортов: {{ filteredVarieties.length }}
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="variety in filteredVarieties" :key="variety.id" class="col-12 col-lg-6">
          <q-card class="variety-card q-mb-md">
            <q-card-section horizontal>
              <!-- Изображение -->
              <q-card-section class="q-pt-xs" style="width: 200px">
                <q-img
                  v-if="variety.imageUrl"
                  :src="variety.imageUrl"
                  :ratio="1"
                  class="rounded-borders"
                  spinner-color="positive"
                />
                <div v-else class="placeholder-image">
                  <q-icon name="local_florist" size="48px" color="grey-4" />
                  <div class="text-grey-6 q-mt-sm">Нет фото</div>
                </div>
              </q-card-section>

              <!-- Информация -->
              <q-card-section class="flex-grow">
                <div class="row items-center q-mb-sm">
                  <div class="text-h6">{{ variety.name }}</div>
                  <q-btn
                    flat
                    round
                    :color="variety.isFavorite ? 'amber' : 'grey'"
                    :icon="variety.isFavorite ? 'star' : 'star_border'"
                    @click="toggleFavorite(variety.id)"
                    class="q-ml-sm"
                  />
                </div>

                <div v-if="variety.scientificName" class="text-caption text-grey-6 q-mb-sm">
                  {{ variety.scientificName }}
                </div>

                <!-- Уровень остроты -->
                <div class="q-mb-sm">
                  <q-chip
                    :color="getHeatLevelInfo(variety.heatLevel).color"
                    text-color="white"
                    :label="getHeatLevelInfo(variety.heatLevel).name"
                    size="sm"
                  />
                  <span class="text-caption q-ml-sm">{{
                    getHeatLevelInfo(variety.heatLevel).shuRange
                  }}</span>
                </div>

                <!-- Описание -->
                <div class="text-body2 q-mb-md">{{ variety.description }}</div>

                <!-- Характеристики -->
                <div class="row q-gutter-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Высота растения</div>
                    <div class="text-body2">
                      {{ variety.plantHeight.min }}-{{ variety.plantHeight.max }}
                      {{ variety.plantHeight.unit }}
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Время созревания</div>
                    <div class="text-body2">
                      {{ variety.daysToMaturity.min }}-{{ variety.daysToMaturity.max }} дней
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card-section>

            <!-- Действия -->
            <q-separator />
            <q-card-actions align="right">
              <q-btn flat color="positive" label="Подробнее" @click="showVarietyDetails(variety)" />
              <q-btn flat color="primary" label="Добавить в сад" @click="addToGarden(variety)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Диалог добавления сорта -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Добавить новый сорт</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newVariety.name"
            label="Название сорта *"
            outlined
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="newVariety.description"
            label="Описание *"
            type="textarea"
            outlined
            class="q-mb-md"
          />

          <div class="row q-gutter-md">
            <div class="col-6">
              <q-select
                v-model="newVariety.heatLevel"
                :options="heatLevelOptions"
                label="Уровень остроты *"
                outlined
                dense
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="newVariety.category"
                :options="categoryOptions"
                label="Категория *"
                outlined
                dense
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey" v-close-popup />
          <q-btn
            flat
            label="Добавить"
            color="positive"
            @click="addVariety"
            :loading="varietyLibraryStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог с подробностями -->
    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">{{ selectedVariety?.name }}</div>
          <div v-if="selectedVariety?.scientificName" class="text-caption text-grey-6">
            {{ selectedVariety.scientificName }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-gutter-md">
            <div class="col-6">
              <q-img
                v-if="selectedVariety?.imageUrl"
                :src="selectedVariety.imageUrl"
                :ratio="1"
                class="rounded-borders"
              />
            </div>
            <div class="col-6">
              <div class="text-subtitle2">Характеристики</div>
              <q-list dense>
                <q-item v-if="selectedVariety">
                  <q-item-section>
                    <q-item-label caption>Острота</q-item-label>
                    <q-item-label
                      >{{ getHeatLevelInfo(selectedVariety.heatLevel).name }} ({{
                        getHeatLevelInfo(selectedVariety.heatLevel).shuRange
                      }})</q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item v-if="selectedVariety?.origin">
                  <q-item-section>
                    <q-item-label caption>Происхождение</q-item-label>
                    <q-item-label>{{ selectedVariety.origin }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <div v-if="selectedVariety" class="q-mt-md">
            <div class="text-subtitle2">Описание</div>
            <p>{{ selectedVariety.description }}</p>
          </div>

          <div v-if="selectedVariety?.growingTips?.length" class="q-mt-md">
            <div class="text-subtitle2">Советы по выращиванию</div>
            <q-list dense>
              <q-item v-for="(tip, index) in selectedVariety.growingTips" :key="index">
                <q-item-section avatar>
                  <q-icon name="tips_and_updates" color="positive" />
                </q-item-section>
                <q-item-section>{{ tip }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="positive" v-close-popup />
          <q-btn
            flat
            label="Добавить в сад"
            color="primary"
            @click="addToGarden(selectedVariety!)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { PepperVariety, HeatLevel, PepperCategory } from 'src/components/models';
import { useVarietyLibraryStore } from 'src/stores/variety-library';

const $q = useQuasar();
const varietyLibraryStore = useVarietyLibraryStore();

// Состояние
const searchTerm = ref('');
const selectedHeatLevel = ref<HeatLevel | null>(null);
const showAddDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedVariety = ref<PepperVariety | null>(null);

// Новый сорт
const newVariety = ref({
  name: '',
  description: '',
  heatLevel: 'medium' as HeatLevel,
  category: 'other' as PepperCategory,
  color: ['красный'],
  plantHeight: { min: 30, max: 60, unit: 'cm' as const },
  daysToMaturity: { min: 60, max: 90 },
  fruitSize: {
    length: { min: 5, max: 15, unit: 'cm' as const },
    width: { min: 2, max: 5, unit: 'cm' as const },
  },
  growingTips: [],
  origin: '',
  imageUrl: '',
});

// Computed
const heatLevelOptions = computed(() =>
  varietyLibraryStore.heatLevels.map((h) => ({
    label: `${h.name} (${h.shuRange})`,
    value: h.level,
  })),
);

const categoryOptions = computed(() =>
  varietyLibraryStore.categories.map((c) => ({
    label: c.label,
    value: c.value,
  })),
);

const filteredVarieties = computed(() => {
  let filtered = varietyLibraryStore.varieties;

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      (v) => v.name.toLowerCase().includes(term) || v.description.toLowerCase().includes(term),
    );
  }

  if (selectedHeatLevel.value) {
    filtered = filtered.filter((v) => v.heatLevel === selectedHeatLevel.value);
  }

  return filtered;
});

// Методы
const getHeatLevelInfo = (level: HeatLevel) => {
  return varietyLibraryStore.getHeatLevelInfo(level);
};

const toggleFavorite = async (id: string) => {
  try {
    await varietyLibraryStore.toggleFavorite(id);
    $q.notify({
      color: 'positive',
      message: 'Избранное обновлено',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при обновлении избранного',
    });
  }
};

const addVariety = async () => {
  if (!newVariety.value.name || !newVariety.value.description) {
    $q.notify({
      color: 'negative',
      message: 'Заполните обязательные поля',
    });
    return;
  }

  try {
    await varietyLibraryStore.addVariety(newVariety.value);
    $q.notify({
      color: 'positive',
      message: 'Сорт успешно добавлен',
    });
    showAddDialog.value = false;

    // Сброс формы
    newVariety.value = {
      name: '',
      description: '',
      heatLevel: 'medium',
      category: 'other',
      color: ['красный'],
      plantHeight: { min: 30, max: 60, unit: 'cm' },
      daysToMaturity: { min: 60, max: 90 },
      fruitSize: {
        length: { min: 5, max: 15, unit: 'cm' },
        width: { min: 2, max: 5, unit: 'cm' },
      },
      growingTips: [],
      origin: '',
      imageUrl: '',
    };
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при добавлении сорта',
    });
  }
};

const showVarietyDetails = (variety: PepperVariety) => {
  selectedVariety.value = variety;
  showDetailsDialog.value = true;
};

const addToGarden = (variety: PepperVariety) => {
  $q.notify({
    color: 'positive',
    message: `Сорт "${variety.name}" готов к добавлению в сад`,
  });
};

// Инициализация
onMounted(async () => {
  await varietyLibraryStore.loadVarieties();

  // Если нет сортов, инициализируем примерами
  if (varietyLibraryStore.varieties.length === 0) {
    await varietyLibraryStore.initializeWithExamples();
  }
});
</script>

<style scoped>
.variety-card {
  max-width: 100%;
}

.placeholder-image {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.flex-grow {
  flex: 1;
}
</style>
