<template>
  <q-dialog v-model="model">
    <q-card style="width: min(920px, 96vw); max-width: 96vw;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">{{ title }}</div>
          <div class="text-subtitle2 text-grey-6">
            Запланируйте массовый полив для выбранных растений
          </div>
        </div>
        <q-btn flat round dense icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-form ref="formRef" @submit.prevent="handleSubmit">
        <q-card-section class="column q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.name"
                label="Название замеса"
                outlined
                dense
                :rules="[val => !!val || 'Укажите название']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.recipeId"
                :options="recipeOptions"
                label="Рецепт раствора"
                outlined
                dense
                emit-value
                map-options
                clearable
                hint="Можно выбрать рецепт или создать кастомный"
                @update:model-value="handleRecipeChange"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section>
                      <div class="text-grey-6">
                        Нет сохранённых рецептов. Создайте новый из раздела «Растворы».
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <q-input
            v-model="form.description"
            label="Описание / цели полива"
            outlined
            dense
            type="textarea"
            autogrow
            :max-length="500"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="form.totalVolumeMl"
                label="Общий объём (мл)"
                type="number"
                outlined
                dense
                :rules="[val => val > 0 || 'Положительный объём обязателен']"
                min="250"
                step="50"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="form.remainingVolumeMl"
                label="Доступно (мл)"
                type="number"
                outlined
                dense
                :rules="[val => val >= 0 || 'Не может быть отрицательным']"
                min="0"
                step="50"
              >
                <template #after>
                  <q-btn
                    flat
                    dense
                    label="= общему"
                    size="sm"
                    @click="form.remainingVolumeMl = form.totalVolumeMl"
                  />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="form.waterTemperatureC"
                label="Температура воды (°C)"
                type="number"
                outlined
                dense
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.preparedAt"
                label="Дата приготовления"
                outlined
                dense
                mask="####-##-##T##:##"
                hint="Формат: ГГГГ-ММ-ДДTчч:мм"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="preparedDate" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.expiresAt"
                label="Использовать до"
                outlined
                dense
                mask="####-##-##T##:##"
                hint="Опционально"
              >
                <template #append>
                  <q-icon name="timer" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="expiresDate" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <div class="targets-section">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle1">Выбор растений</div>
              <q-btn
                color="primary"
                icon="library_add"
                label="Добавить из списка"
                dense
                @click="showSelectPeppers = true"
              />
            </div>

            <div v-if="targetEntries.length === 0" class="text-grey-6">
              Добавьте растения, которые нужно полить.
            </div>

            <q-table
              v-else
              flat
              dense
              :rows="targetEntries"
              :columns="targetColumns"
              row-key="pepperId"
              hide-pagination
              hide-bottom
              :rows-per-page-options="[0]"
            >
              <template #body-cell-volume="propsSlot">
                <q-input
                  v-model.number="propsSlot.row.plannedVolumeMl"
                  type="number"
                  dense
                  min="0"
                  step="10"
                  outlined
                />
              </template>
              <template #body-cell-actions="propsSlot">
                <q-btn
                  flat
                  dense
                  round
                  color="negative"
                  icon="delete"
                  @click="removeTarget(propsSlot.row.pepperId)"
                />
              </template>
            </q-table>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-6">
            Всего выбрано растений:
            <span class="text-weight-medium">{{ targetEntries.length }}</span>
            |
            Плановый объём: {{ plannedVolumeDisplay }}
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat label="Отмена" color="grey" @click="close" />
            <q-btn color="primary" label="Сохранить" type="submit" :loading="submitting" />
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showSelectPeppers">
    <q-card style="width: min(720px, 96vw); max-width: 96vw;">
      <q-card-section class="text-h6">Выбор растений</q-card-section>
      <q-card-section class="column q-gutter-sm" style="max-height: 60vh;">
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Поиск по названию, сорту или описанию"
          clearable
          debounce="200"
        />
        <q-list bordered separator class="rounded-borders">
          <template v-if="filteredPeppers.length === 0">
            <q-item>
              <q-item-section>
                <div class="text-grey-6">Нет перцев, удовлетворяющих поиску.</div>
              </q-item-section>
            </q-item>
          </template>
          <q-item
            v-for="pepper in filteredPeppers"
            :key="pepper.id"
            clickable
            @click="togglePepperSelection(pepper.id)"
          >
            <q-item-section avatar>
              <q-checkbox v-model="selectedPepperIds" :val="pepper.id" dense />
            </q-item-section>
            <q-item-section>
              <div class="text-body1">{{ pepper.name }}</div>
              <div class="text-caption text-grey-6">
                {{ pepper.variety }} · {{ pepper.stage }}
              </div>
            </q-item-section>
            <q-item-section side v-if="pepper.seedlingSlot">
              <q-chip dense size="sm" color="primary" text-color="white">
                {{ pepper.seedlingSlot.trayName || 'Кассета' }} · R{{ pepper.seedlingSlot.row }}
                · C{{ pepper.seedlingSlot.column }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Закрыть" color="grey" @click="showSelectPeppers = false" />
        <q-btn color="primary" label="Добавить выбранные" @click="applySelectedPeppers" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import type { Pepper, WateringBatch, WateringBatchTarget, WateringSolutionRecipe, FertilizerComposition } from 'components/models';

interface Props {
  modelValue: boolean;
  batch?: WateringBatch | null;
  recipes: WateringSolutionRecipe[];
  peppers: Pepper[];
  submitting?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (
    event: 'save',
    payload: {
      name: string;
      description?: string | null;
      recipeId?: string | null;
      preparedAt?: string | null;
      expiresAt?: string | null;
      totalVolumeMl: number;
      remainingVolumeMl: number;
      waterTemperatureC?: number | null;
      nutrientsPerLiter?: FertilizerComposition | null;
      totalNutrients?: FertilizerComposition | null;
      targetPlants: WateringBatchTarget[];
    },
  ): void;
  (event: 'cancel'): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const $q = useQuasar();
const formRef = ref();

interface TargetEntry extends WateringBatchTarget {
  name: string;
  variety: string;
  stage: string;
}

const targetEntries = reactive<TargetEntry[]>([]);

interface FormState {
  name: string;
  description: string | null;
  recipeId: string | null;
  totalVolumeMl: number;
  remainingVolumeMl: number;
  waterTemperatureC: number | null;
  preparedAt: string;
  expiresAt: string | null;
}

const nowIso = () => new Date().toISOString().slice(0, 16);

const form = reactive<FormState>({
  name: '',
  description: null,
  recipeId: null,
  totalVolumeMl: 3000,
  remainingVolumeMl: 3000,
  waterTemperatureC: null,
  preparedAt: nowIso(),
  expiresAt: null,
});

const recipeOptions = computed(() =>
  props.recipes.map((recipe) => ({
    label: `${recipe.name} · ${recipe.waterVolumeMl} мл`,
    value: recipe.id,
  })),
);

const preparedDate = computed({
  get: () => form.preparedAt?.split('T')[0] || '',
  set: (value: string) => {
    if (!value) return;
    const time = form.preparedAt?.split('T')[1] || '07:00';
    form.preparedAt = `${value}T${time}`;
  },
});

const expiresDate = computed({
  get: () => form.expiresAt?.split('T')[0] || '',
  set: (value: string) => {
    if (!value) {
      form.expiresAt = null;
      return;
    }
    const time = form.expiresAt?.split('T')[1] || '21:00';
    form.expiresAt = `${value}T${time}`;
  },
});

const macroFormat = (volume: number | undefined | null) => {
  if (!volume && volume !== 0) return '—';
  if (Number.isNaN(volume)) return '—';
  return `${volume} мл`;
};

const plannedVolumeDisplay = computed(() => {
  const sum = targetEntries.reduce((acc, item) => acc + (item.plannedVolumeMl || 0), 0);
  return macroFormat(Number(sum.toFixed(1)));
});

const search = ref('');
const selectedPepperIds = ref<string[]>([]);
const showSelectPeppers = ref(false);

const filteredPeppers = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.peppers;
  return props.peppers.filter((pepper) => {
    const text = `${pepper.name} ${pepper.variety} ${pepper.description ?? ''}`.toLowerCase();
    return text.includes(query);
  });
});

const title = computed(() => (props.batch ? 'Редактирование замеса' : 'Новый замес'));

const targetColumns: QTableColumn<TargetEntry>[] = [
  { name: 'name', label: 'Растение', field: 'name', align: 'left' },
  { name: 'variety', label: 'Сорт / стадия', field: (row) => `${row.variety} · ${row.stage}` },
  {
    name: 'volume',
    label: 'Плановый объём (мл)',
    field: 'plannedVolumeMl',
    align: 'left',
  },
  { name: 'actions', label: '', field: 'pepperId', align: 'right' },
];

const resetForm = () => {
  form.name = '';
  form.description = null;
  form.recipeId = null;
  form.totalVolumeMl = 3000;
  form.remainingVolumeMl = 3000;
  form.waterTemperatureC = null;
  form.preparedAt = nowIso();
  form.expiresAt = null;
  targetEntries.splice(0, targetEntries.length);
};

const initFromBatch = (batch: WateringBatch | null | undefined) => {
  resetForm();
  if (!batch) return;
  form.name = batch.name;
  form.description = batch.description ?? null;
  form.recipeId = batch.recipeId ?? null;
  form.totalVolumeMl = batch.totalVolumeMl;
  form.remainingVolumeMl = batch.remainingVolumeMl;
  form.waterTemperatureC = batch.waterTemperatureC ?? null;
  form.preparedAt = batch.preparedAt?.slice(0, 16) ?? nowIso();
  form.expiresAt = batch.expiresAt?.slice(0, 16) ?? null;
  targetEntries.splice(0, targetEntries.length);
  batch.targetPlants.forEach((target) => {
    const pepper = props.peppers.find((p) => p.id === target.pepperId);
    if (pepper) {
      targetEntries.push({
        ...target,
        plannedVolumeMl: target.plannedVolumeMl ?? null,
        name: pepper.name,
        variety: pepper.variety,
        stage: pepper.stage,
      });
    }
  });
};

watch(
  () => props.batch,
  (batch) => {
    if (model.value) {
      initFromBatch(batch);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      initFromBatch(props.batch);
    } else {
      resetForm();
    }
  },
);

const selectedRecipe = ref<WateringSolutionRecipe | null>(null);

const handleRecipeChange = (recipeId: string | null) => {
  if (!recipeId) {
    selectedRecipe.value = null;
    return;
  }
  const recipe = props.recipes.find((item) => item.id === recipeId);
  if (recipe) {
    selectedRecipe.value = recipe;
    // Устанавливаем объёмы из рецепта только если список растений пуст
    // Если уже есть растения, не меняем totalVolumeMl (он должен быть суммой плановых объёмов)
    if (targetEntries.length === 0) {
      form.totalVolumeMl = recipe.waterVolumeMl;
      form.remainingVolumeMl = recipe.waterVolumeMl;
    } else {
      // Если уже есть растения, обновляем remainingVolumeMl только если он равен старому totalVolumeMl
      // Это означает, что пользователь еще не менял его вручную
      if (form.remainingVolumeMl === form.totalVolumeMl) {
        // Вычисляем сумму плановых объёмов
        const totalPlanned = targetEntries.reduce(
          (sum, item) => sum + (item.plannedVolumeMl || 0),
          0,
        );
        form.remainingVolumeMl = totalPlanned > 0 ? totalPlanned : recipe.waterVolumeMl;
      }
      // totalVolumeMl не меняем, если уже есть растения - он должен быть суммой плановых объёмов
    }
    if (recipe.validForHours) {
      const prepared = form.preparedAt ? new Date(form.preparedAt) : new Date();
      const expires = new Date(prepared.getTime() + recipe.validForHours * 60 * 60 * 1000);
      form.expiresAt = expires.toISOString().slice(0, 16);
    }
  } else {
    selectedRecipe.value = null;
  }
};

// При изменении рецепта через props.batch тоже обновляем selectedRecipe
watch(
  () => form.recipeId,
  (recipeId) => {
    if (recipeId) {
      const recipe = props.recipes.find((item) => item.id === recipeId);
      selectedRecipe.value = recipe ?? null;
    } else {
      selectedRecipe.value = null;
    }
  },
);

const togglePepperSelection = (pepperId: string) => {
  const list = selectedPepperIds.value;
  const index = list.indexOf(pepperId);
  if (index === -1) {
    list.push(pepperId);
  } else {
    list.splice(index, 1);
  }
};

const applySelectedPeppers = () => {
  if (!selectedPepperIds.value.length) {
    $q.notify({
      type: 'warning',
      message: 'Выберите хотя бы одно растение',
    });
    return;
  }
  selectedPepperIds.value.forEach((pepperId) => {
    if (targetEntries.find((item) => item.pepperId === pepperId)) {
      return;
    }
    const pepper = props.peppers.find((item) => item.id === pepperId);
    if (!pepper) return;
    targetEntries.push({
      pepperId,
      seedlingSlot: pepper.seedlingSlot
        ? {
            trayId: pepper.seedlingSlot.trayId,
            row: pepper.seedlingSlot.row,
            column: pepper.seedlingSlot.column,
          }
        : null,
      plannedVolumeMl: Math.round(form.totalVolumeMl / Math.max(selectedPepperIds.value.length, 1)),
      name: pepper.name,
      variety: pepper.variety,
      stage: pepper.stage,
    });
  });
  selectedPepperIds.value = [];
  showSelectPeppers.value = false;
};

const removeTarget = (pepperId: string) => {
  const index = targetEntries.findIndex((target) => target.pepperId === pepperId);
  if (index !== -1) {
    targetEntries.splice(index, 1);
  }
};

function close() {
  emit('cancel');
  emit('update:modelValue', false);
}

async function handleSubmit() {
  const isValid = await (formRef.value as any)?.validate?.();
  if (isValid === false) {
    return;
  }

  if (targetEntries.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Добавьте растения для полива',
    });
    return;
  }

  // Копируем nutrientsPerLiter и totalNutrients из рецепта, если он выбран
  const nutrientsPerLiter = selectedRecipe.value?.nutrientsPerLiter ?? null;
  const totalNutrients = selectedRecipe.value?.totalNutrients ?? null;

  // Вычисляем сумму плановых объёмов для всех растений
  const totalPlannedVolume = targetEntries.reduce(
    (sum, item) => sum + (item.plannedVolumeMl || 0),
    0,
  );

  // Используем сумму плановых объёмов как totalVolumeMl, если она больше 0
  // Иначе используем значение из формы
  const finalTotalVolume = totalPlannedVolume > 0 ? totalPlannedVolume : Number(form.totalVolumeMl);

  // remainingVolumeMl должен быть равен totalVolumeMl или сумме плановых объёмов
  // Но не больше totalVolumeMl
  const finalRemainingVolume = Math.min(
    Number(form.remainingVolumeMl),
    finalTotalVolume,
  );

  emit('save', {
    name: form.name,
    description: form.description || null,
    recipeId: form.recipeId || null,
    preparedAt: form.preparedAt ? new Date(form.preparedAt).toISOString() : null,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    totalVolumeMl: finalTotalVolume,
    remainingVolumeMl: finalRemainingVolume,
    waterTemperatureC: form.waterTemperatureC ?? null,
    nutrientsPerLiter,
    totalNutrients,
    targetPlants: targetEntries.map((item) => ({
      pepperId: item.pepperId,
      seedlingSlot: item.seedlingSlot ?? null,
      plannedVolumeMl: item.plannedVolumeMl ?? null,
    })),
  });
}
</script>

<style scoped>
.targets-section {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.55);
}
</style>

