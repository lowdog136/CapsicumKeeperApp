<template>
  <q-page class="mass-watering-page q-pa-md q-pa-sm-md">
    <div class="page-header q-mb-lg">
      <div class="text-h5 text-weight-medium">Массовый полив</div>
      <div class="text-body2 text-grey-6">
        Планируйте растворы, распределяйте полив между растениями и контролируйте нагрузку на грунт.
      </div>
    </div>

    <div v-if="userStore.loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="48px" />
      <div class="text-grey-5 q-mt-sm">Загрузка профиля...</div>
    </div>

    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="lock" size="64px" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">Доступно только авторизованным пользователям</div>
      <div class="text-body2 text-grey-5 q-mt-sm">Войдите, чтобы управлять поливами.</div>
    </div>

    <template v-else>
      <div class="row q-col-gutter-lg q-mb-lg quick-actions">
        <div class="col-12 col-md-6">
          <q-card class="quick-card">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Растворы</div>
              <div class="text-caption text-grey-5">
                Сохраняйте состав и объём растворов, чтобы использовать их повторно.
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn color="primary" icon="add" label="Новый раствор" @click="openCreateRecipe" />
            </q-card-actions>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card class="quick-card">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Замесы и поливы</div>
              <div class="text-caption text-grey-5">
                Планируйте массовый полив, выбирайте растения и распределяйте раствор.
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn
                color="secondary"
                icon="science"
                label="Новый замес"
                :disable="recipes.length === 0 && peppers.length === 0"
                @click="openCreateBatch"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <div class="section-header q-mb-md">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            Сохранённые растворы ({{ recipes.length }})
          </div>
          <div class="text-caption text-grey-5">
            Используйте рецепты, чтобы быстро готовить раствор с нужными параметрами.
          </div>
        </div>
        <q-btn outline dense color="primary" icon="add" label="Добавить" @click="openCreateRecipe" />
      </div>

      <div v-if="loadingRecipes" class="text-center q-py-xl">
        <q-spinner color="primary" size="42px" />
        <div class="text-grey-5 q-mt-sm">Загрузка рецептов...</div>
      </div>

      <div v-else-if="recipes.length === 0" class="empty-state q-mb-xl">
        <q-icon name="inventory_2" size="56px" color="grey-5" />
        <div class="text-body1 text-grey-6 q-mt-sm">Пока нет сохранённых растворов</div>
        <div class="text-caption text-grey-5">
          Создайте первый рецепт или добавьте раствор вручную при создании замеса.
        </div>
      </div>

      <div v-else class="row q-col-gutter-lg q-mb-xl">
        <div v-for="recipe in recipes" :key="recipe.id" class="col-12 col-md-6 col-lg-4">
          <q-card class="recipe-card column full-height">
            <q-card-section class="column q-gutter-xs">
              <div class="row items-center justify-between">
                <div class="text-subtitle1 text-weight-medium">{{ recipe.name }}</div>
                <q-chip dense size="sm" color="primary" text-color="white">
                  {{ recipe.waterVolumeMl }} мл
                </q-chip>
              </div>
              <div class="text-caption text-grey-6">
                {{ recipe.description || 'Без описания' }}
              </div>
              <div class="text-caption text-grey-5">
                Истекает через: {{ displayValid(recipe.validForHours) }}
              </div>
              <template v-for="nutrientSection in [splitNutrientsForDisplay(recipe.nutrientsPerLiter, 'г/л')]">
                <div class="text-caption text-grey-5 q-mt-xs q-mb-xs">
                  Питательность (г/л)
                </div>
                <div
                  class="row q-col-gutter-xs q-mb-xs nutrient-chip-row"
                  v-if="nutrientSection.macros.length"
                >
                  <q-chip
                    v-for="item in nutrientSection.macros"
                    :key="`macro-${item.key}`"
                    dense
                    color="primary"
                    text-color="white"
                    class="nutrient-chip"
                  >
                    {{ item.key }} · {{ item.value }}
                    <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                  </q-chip>
                </div>
                <div
                  class="row q-col-gutter-xs nutrient-chip-row"
                  v-if="nutrientSection.micros.length"
                >
                  <q-chip
                    v-for="item in nutrientSection.micros"
                    :key="`micro-${item.key}`"
                    dense
                    color="teal-6"
                    text-color="white"
                    class="nutrient-chip"
                  >
                    {{ item.key }} · {{ item.value }}
                    <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                  </q-chip>
                </div>
              </template>
            </q-card-section>
            <q-separator />
            <q-card-section class="column q-gutter-xs">
              <div class="text-caption text-grey-5">Ингредиенты:</div>
              <ul class="text-caption text-grey-4 q-pl-md q-mt-none q-mb-none">
                <li v-for="(ingredient, index) in recipe.ingredients" :key="index">
                  {{ ingredient.displayName }} — {{ ingredient.amount }} {{ unitsMap[ingredient.unit] }}
                </li>
              </ul>
            </q-card-section>
            <q-separator />
            <q-card-actions align="between">
              <q-btn flat dense color="primary" icon="edit" label="Изменить" @click="openEditRecipe(recipe)" />
              <q-btn
                flat
                dense
                color="negative"
                icon="delete"
                label="Удалить"
                @click="confirmDeleteRecipe(recipe)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <div class="section-header q-mb-md">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            Замесы растворов ({{ batches.length }})
          </div>
          <div class="text-caption text-grey-5">
            Отслеживайте остатки, историю поливов и статусы каждой партии раствора.
          </div>
        </div>
        <q-btn
          outline
          dense
          color="secondary"
          icon="science"
          label="Новый замес"
          @click="openCreateBatch"
        />
      </div>

      <div v-if="loadingBatches" class="text-center q-py-xl">
        <q-spinner color="secondary" size="42px" />
        <div class="text-grey-5 q-mt-sm">Загрузка замесов...</div>
      </div>

      <div v-else-if="batches.length === 0" class="empty-state q-mb-xl">
        <q-icon name="water_drop" size="56px" color="grey-5" />
        <div class="text-body1 text-grey-6 q-mt-sm">Замесов пока нет</div>
        <div class="text-caption text-grey-5">
          Создайте замес раствора, выберите растения и распределите объём полива.
        </div>
      </div>

      <div v-else class="column q-gutter-lg">
        <q-expansion-item
          v-for="batch in batches"
          :key="batch.id"
          expand-separator
          dense
          switch-toggle-side
          class="batch-expansion"
          @show="ensureBatchEvents(batch.id)"
        >
          <template #header>
            <div class="row items-center full-width">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium">{{ batch.name }}</div>
                <div class="text-caption text-grey-6">
                  Приготовлен: {{ formatDateTime(batch.preparedAt) }} · Остаток:
                  {{ batch.remainingVolumeMl }} мл
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-chip dense :color="statusColor(batch.status)" text-color="white">
                  {{ statusLabel(batch.status) }}
                </q-chip>
                <q-btn
                  size="sm"
                  color="primary"
                  flat
                  dense
                  icon="water_drop"
                  label="Зафиксировать полив"
                  @click.stop="openApplyDialog(batch)"
                  :disable="batch.remainingVolumeMl <= 0"
                />
                <q-btn
                  size="sm"
                  flat
                  dense
                  icon="edit"
                  color="grey-4"
                  @click.stop="openEditBatch(batch)"
                />
                <q-btn
                  size="sm"
                  flat
                  dense
                  icon="delete"
                  color="negative"
                  @click.stop="confirmDeleteBatch(batch)"
                />
              </div>
            </div>
          </template>

          <q-card class="batch-card q-mt-sm">
            <q-card-section class="row q-col-gutter-lg">
              <div class="col-12 col-md-4">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">Параметры</div>
                <div class="text-caption text-grey-6">
                  Рецепт: {{ batch.recipeId ? recipeName(batch.recipeId) : 'Не выбран' }}
                </div>
                <div class="text-caption text-grey-6">
                  Общий объём: {{ batch.totalVolumeMl }} мл
                </div>
                <div class="text-caption text-grey-6">
                  Остаток: {{ batch.remainingVolumeMl }} мл
                </div>
                <div class="text-caption text-grey-6">
                  Годен до: {{ batch.expiresAt ? formatDateTime(batch.expiresAt) : '—' }}
                </div>
                <div class="text-caption text-grey-6">
                  Температура: {{ batch.waterTemperatureC ?? '—' }} °C
                </div>
                <template v-for="nutrientSection in [splitNutrientsForDisplay(batch.nutrientsPerLiter, 'г/л')]">
                  <div
                    class="text-caption text-grey-5 q-mt-sm"
                    v-if="nutrientSection.macros.length || nutrientSection.micros.length"
                  >
                    Питательность раствора (г/л)
                  </div>
                  <div
                    class="row q-col-gutter-xs nutrient-chip-row q-mt-xs"
                    v-if="nutrientSection.macros.length"
                  >
                    <q-chip
                      v-for="item in nutrientSection.macros"
                      :key="`batch-macro-${batch.id}-${item.key}`"
                      dense
                      color="primary"
                      text-color="white"
                      class="nutrient-chip"
                    >
                      {{ item.key }} · {{ item.value }}
                      <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                    </q-chip>
                  </div>
                  <div
                    class="row q-col-gutter-xs nutrient-chip-row"
                    v-if="nutrientSection.micros.length"
                  >
                    <q-chip
                      v-for="item in nutrientSection.micros"
                      :key="`batch-micro-${batch.id}-${item.key}`"
                      dense
                      color="teal-6"
                      text-color="white"
                      class="nutrient-chip"
                    >
                      {{ item.key }} · {{ item.value }}
                      <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                    </q-chip>
                  </div>
                </template>
                <template v-for="nutrientSection in [splitNutrientsForDisplay(batch.totalNutrients, 'г')]">
                  <div
                    class="text-caption text-grey-5 q-mt-sm"
                    v-if="nutrientSection.macros.length || nutrientSection.micros.length"
                  >
                    Питательность партии (г)
                  </div>
                  <div
                    class="row q-col-gutter-xs nutrient-chip-row q-mt-xs"
                    v-if="nutrientSection.macros.length"
                  >
                    <q-chip
                      v-for="item in nutrientSection.macros"
                      :key="`batch-total-macro-${batch.id}-${item.key}`"
                      dense
                      color="secondary"
                      text-color="white"
                      class="nutrient-chip"
                    >
                      {{ item.key }} · {{ item.value }}
                      <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                    </q-chip>
                  </div>
                  <div
                    class="row q-col-gutter-xs nutrient-chip-row"
                    v-if="nutrientSection.micros.length"
                  >
                    <q-chip
                      v-for="item in nutrientSection.micros"
                      :key="`batch-total-micro-${batch.id}-${item.key}`"
                      dense
                      color="deep-purple-6"
                      text-color="white"
                      class="nutrient-chip"
                    >
                      {{ item.key }} · {{ item.value }}
                      <q-tooltip>{{ item.label }} ({{ item.value }} {{ item.unit }})</q-tooltip>
                    </q-chip>
                  </div>
                </template>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">Целевые растения</div>
                <div v-if="batch.targetPlants.length === 0" class="text-caption text-grey-5">
                  Не выбраны — при поливе нужно указать вручную.
                </div>
                <q-list v-else dense>
                  <q-item v-for="target in batch.targetPlants" :key="target.pepperId">
                    <q-item-section>
                      <div class="text-caption text-grey-5">
                        {{ pepperName(target.pepperId) }} — план {{ target.plannedVolumeMl ?? '—' }} мл
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">История поливов</div>
                <div v-if="events[batch.id]?.length">
                  <q-timeline dense color="primary">
                    <q-timeline-entry
                      v-for="event in events[batch.id]"
                      :key="event.id"
                      :title="formatDateTime(event.appliedAt)"
                      :subtitle="`${event.totalVolumeMl} мл · ${event.targets.length} растений`"
                    >
                      <div class="text-caption text-grey-5">
                        {{ event.notes || '— комментариев нет' }}
                      </div>
                    </q-timeline-entry>
                  </q-timeline>
                </div>
                <div v-else class="text-caption text-grey-5">
                  История ещё не загружена или поливов не было.
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>
    </template>

    <WateringSolutionDialog
      v-model="solutionDialog.open"
      :recipe="solutionDialog.recipe"
      :fertilizers="fertilizers"
      :loading="fertilizersLoading"
      :submitting="solutionDialog.loading"
      @save="handleSaveRecipe"
      @cancel="closeSolutionDialog"
    />

    <WateringBatchDialog
      v-model="batchDialog.open"
      :batch="batchDialog.batch"
      :recipes="recipes"
      :peppers="peppers"
      :submitting="batchDialog.loading"
      @save="handleSaveBatch"
      @cancel="closeBatchDialog"
    />

    <ApplyWateringDialog
      v-model="applyDialog.open"
      :batch="applyDialog.batch"
      :peppers="peppers"
      :submitting="applyDialog.loading"
      @submit="handleApplyWatering"
      @cancel="closeApplyDialog"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar, date } from 'quasar';
import WateringSolutionDialog from 'components/WateringSolutionDialog.vue';
import WateringBatchDialog from 'components/WateringBatchDialog.vue';
import ApplyWateringDialog from 'components/ApplyWateringDialog.vue';
import { useUserStore } from 'stores/user-store';
import { usePepperFirestore } from 'stores/pepper-firestore';
import { useMassWateringStore } from 'stores/mass-watering-store';
import { useFertilizerLibraryFirestore } from 'stores/fertilizer-library-firestore';
import type {
  FertilizerComposition,
  WateringBatch,
  WateringSolutionRecipe,
} from 'components/models';

const $q = useQuasar();
const userStore = useUserStore();
const pepperStore = usePepperFirestore();
const massStore = useMassWateringStore();
const fertilizerStore = useFertilizerLibraryFirestore();

const { peppers, loading: peppersLoading } = storeToRefs(pepperStore);
const {
  recipes,
  batches,
  events,
  loadingRecipes,
  loadingBatches,
  error,
} = storeToRefs(massStore);
const { fertilizers, loading: fertilizersLoading } = storeToRefs(fertilizerStore);
let unsubscribeFertilizers: (() => void) | null = null;

watch(
  () => error.value,
  (message) => {
    if (message) {
      $q.notify({ type: 'negative', message });
    }
  },
);

watch(
  () => userStore.user?.uid,
  async (uid) => {
    if (uid) {
      await pepperStore.fetchPeppers();
      massStore.subscribeRecipes();
      massStore.subscribeBatches();
      await fertilizerStore.fetchFertilizers();
      if (unsubscribeFertilizers) {
        unsubscribeFertilizers();
      }
      unsubscribeFertilizers = fertilizerStore.subscribeFertilizers();
    } else {
      massStore.$reset();
      pepperStore.$reset?.();
      if (unsubscribeFertilizers) {
        unsubscribeFertilizers();
        unsubscribeFertilizers = null;
      }
      fertilizers.value = [];
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  massStore.$reset();
  if (unsubscribeFertilizers) {
    unsubscribeFertilizers();
    unsubscribeFertilizers = null;
  }
});

const solutionDialog = reactive({
  open: false,
  recipe: null as WateringSolutionRecipe | null,
  loading: false,
});

const batchDialog = reactive({
  open: false,
  batch: null as WateringBatch | null,
  loading: false,
});

const applyDialog = reactive({
  open: false,
  batch: null as WateringBatch | null,
  loading: false,
});

const unitsMap: Record<string, string> = {
  g: 'г',
  ml: 'мл',
};

const statusColor = (status: WateringBatch['status']) => {
  switch (status) {
    case 'ready':
      return 'positive';
    case 'draft':
      return 'primary';
    case 'applied':
      return 'secondary';
    case 'discarded':
      return 'grey-6';
    case 'expired':
      return 'negative';
    default:
      return 'primary';
  }
};

const statusLabel = (status: WateringBatch['status']) => {
  switch (status) {
    case 'ready':
      return 'Готов';
    case 'draft':
      return 'Черновик';
    case 'applied':
      return 'Использован';
    case 'discarded':
      return 'Списан';
    case 'expired':
      return 'Просрочен';
    default:
      return status;
  }
};

const displayValid = (validForHours: number | null | undefined) => {
  if (!validForHours) return 'не указано';
  if (validForHours < 24) {
    return `${validForHours} ч`;
  }
  const days = Math.round(validForHours / 24);
  return `${days} дн`;
};

const macroKeys = ['N', 'P', 'K', 'Ca', 'Mg', 'S'] as const;
const macroKeySet = new Set<string>(macroKeys);
const nutrientDisplayOrder = [
  'N',
  'P',
  'K',
  'Ca',
  'Mg',
  'S',
  'Fe',
  'Mn',
  'Zn',
  'Cu',
  'B',
  'Mo',
  'Cl',
  'Co',
  'Ni',
  'Si',
] as const;

const nutrientLabels: Record<string, string> = {
  N: 'Азот',
  P: 'Фосфор',
  K: 'Калий',
  Ca: 'Кальций',
  Mg: 'Магний',
  S: 'Сера',
  Fe: 'Железо',
  Mn: 'Марганец',
  Zn: 'Цинк',
  Cu: 'Медь',
  B: 'Бор',
  Mo: 'Молибден',
  Cl: 'Хлор',
  Co: 'Кобальт',
  Ni: 'Никель',
  Si: 'Кремний',
};

const nutrientOrderMap = nutrientDisplayOrder.reduce(
  (acc, key, index) => {
    acc[key] = index;
    return acc;
  },
  {} as Record<string, number>,
);

const formatNutrientValue = (value: number): string => {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  if (value >= 1) return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
  if (value >= 0.1) return value.toFixed(3);
  if (value >= 0.01) return value.toFixed(3);
  return value.toPrecision(2);
};

const splitNutrientsForDisplay = (
  composition: FertilizerComposition | null | undefined,
  unit: string,
) => {
  const macros: { key: string; label: string; value: string; unit: string }[] = [];
  const micros: { key: string; label: string; value: string; unit: string }[] = [];

  if (!composition) {
    return { macros, micros };
  }

  Object.entries(composition)
    .filter(([, rawValue]) => rawValue != null && !Number.isNaN(rawValue))
    .sort(([keyA], [keyB]) => {
      const orderA = nutrientOrderMap[keyA] ?? 999;
      const orderB = nutrientOrderMap[keyB] ?? 999;
      return orderA - orderB;
    })
    .forEach(([key, rawValue]) => {
      const value = Number(rawValue);
      if (Number.isNaN(value)) {
        return;
      }
      const entry = {
        key,
        label: nutrientLabels[key] ?? key,
        value: formatNutrientValue(value),
        unit,
      };
      if (macroKeySet.has(key)) {
        macros.push(entry);
      } else {
        micros.push(entry);
      }
    });

  return { macros, micros };
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return date.formatDate(iso, 'DD.MM.YYYY HH:mm');
  } catch (e) {
    return new Date(iso).toLocaleString('ru-RU');
  }
};

const recipeName = (recipeId: string | null | undefined) => {
  if (!recipeId) return '—';
  return recipes.value.find((recipe) => recipe.id === recipeId)?.name ?? '—';
};

const pepperName = (pepperId: string) => {
  return peppers.value.find((pepper) => pepper.id === pepperId)?.name ?? pepperId;
};

function openCreateRecipe() {
  solutionDialog.recipe = null;
  solutionDialog.open = true;
}

function openEditRecipe(recipe: WateringSolutionRecipe) {
  solutionDialog.recipe = recipe;
  solutionDialog.open = true;
}

function closeSolutionDialog() {
  solutionDialog.open = false;
  solutionDialog.recipe = null;
}

async function handleSaveRecipe(payload: Parameters<typeof massStore.createSolutionRecipe>[0]) {
  try {
    solutionDialog.loading = true;
    if (solutionDialog.recipe) {
      await massStore.updateSolutionRecipe(solutionDialog.recipe.id, payload);
      $q.notify({ type: 'positive', message: 'Раствор обновлён' });
    } else {
      await massStore.createSolutionRecipe(payload);
      $q.notify({ type: 'positive', message: 'Раствор сохранён' });
    }
    closeSolutionDialog();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'Не удалось сохранить раствор' });
  } finally {
    solutionDialog.loading = false;
  }
}

function confirmDeleteRecipe(recipe: WateringSolutionRecipe) {
  $q.dialog({
    title: 'Удалить раствор?',
    message: `Раствор «${recipe.name}» будет удалён без возможности восстановления.`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Удалить' },
  }).onOk(async () => {
    try {
      await massStore.deleteSolutionRecipe(recipe.id);
      $q.notify({ type: 'positive', message: 'Раствор удалён' });
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.message ?? 'Не удалось удалить раствор' });
    }
  });
}

function openCreateBatch() {
  batchDialog.batch = null;
  batchDialog.open = true;
}

function openEditBatch(batch: WateringBatch) {
  batchDialog.batch = batch;
  batchDialog.open = true;
}

function closeBatchDialog() {
  batchDialog.open = false;
  batchDialog.batch = null;
}

async function handleSaveBatch(payload: Parameters<typeof massStore.createWateringBatch>[0]) {
  try {
    batchDialog.loading = true;
    if (batchDialog.batch) {
      await massStore.updateWateringBatch(batchDialog.batch.id, payload);
      $q.notify({ type: 'positive', message: 'Замес обновлён' });
    } else {
      await massStore.createWateringBatch(payload);
      $q.notify({ type: 'positive', message: 'Замес создан' });
    }
    closeBatchDialog();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'Не удалось сохранить замес' });
  } finally {
    batchDialog.loading = false;
  }
}

function confirmDeleteBatch(batch: WateringBatch) {
  $q.dialog({
    title: 'Удалить замес?',
    message: `Замес «${batch.name}» и история поливов будут удалены.`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Удалить' },
  }).onOk(async () => {
    try {
      await massStore.deleteWateringBatch(batch.id);
      $q.notify({ type: 'positive', message: 'Замес удалён' });
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.message ?? 'Не удалось удалить замес' });
    }
  });
}

function openApplyDialog(batch: WateringBatch) {
  applyDialog.batch = batch;
  applyDialog.open = true;
}

function closeApplyDialog() {
  applyDialog.open = false;
  applyDialog.batch = null;
}

async function handleApplyWatering(payload: {
  batchId: string;
  targets: { pepperId: string; volumeMl: number; seedlingSlot?: { trayId: string; row: number; column: number } | undefined }[];
  notes?: string | null;
  appliedAt?: string | null;
}) {
  try {
    applyDialog.loading = true;
    await massStore.applyWatering({
      batchId: payload.batchId,
      appliedAt: payload.appliedAt ?? undefined,
      notes: payload.notes ?? undefined,
      targets: payload.targets.map((target) => ({
        pepperId: target.pepperId,
        volumeMl: target.volumeMl,
        seedlingSlot: target.seedlingSlot,
        consumption: null,
      })),
    });
    $q.notify({ type: 'positive', message: 'Полив зафиксирован' });
    closeApplyDialog();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message ?? 'Не удалось зафиксировать полив' });
  } finally {
    applyDialog.loading = false;
  }
}

function ensureBatchEvents(batchId: string) {
  if (!events.value[batchId]) {
    massStore.fetchEventsForBatch(batchId);
    massStore.subscribeEventsForBatch(batchId);
  }
}
</script>

<style scoped>
.mass-watering-page {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%);
  color: #e2e8f0;
  min-height: 100%;
}

.quick-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.recipe-card,
.batch-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.empty-state {
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  background: rgba(15, 23, 42, 0.5);
}

.batch-expansion :deep(.q-expansion-item__content) {
  background: transparent;
}

.batch-card {
  border-radius: 14px;
}

.nutrient-chip-row {
  flex-wrap: wrap;
}

.nutrient-chip {
  font-size: 12px;
  border-radius: 6px;
  padding: 2px 8px;
}

@media (max-width: 767px) {
  .quick-actions {
    flex-direction: column;
  }
}
</style>

