<template>
  <q-dialog v-model="model">
    <q-card style="width: min(900px, 95vw); max-width: 95vw;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">{{ title }}</div>
          <div class="text-subtitle2 text-grey-6">
            Настройте раствор для массового полива
          </div>
        </div>
        <q-btn flat round dense icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-form ref="formRef" @submit.prevent="handleSubmit">
        <q-card-section class="column q-gutter-md">
          <q-input
            v-model="form.name"
            label="Название раствора"
            outlined
            dense
            :rules="[val => !!val || 'Укажите название']"
          />

          <q-input
            v-model="form.description"
            label="Описание"
            type="textarea"
            outlined
            dense
            autogrow
            :max-length="500"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="form.waterVolumeMl"
                label="Объём воды (мл)"
                type="number"
                outlined
                dense
                :rules="[
                  val => val > 0 || 'Укажите положительный объём',
                ]"
                min="100"
                step="50"
              />
            </div>

            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="form.validForHours"
                label="Годен (часов)"
                type="number"
                outlined
                dense
                min="1"
                hint="Опционально"
              />
            </div>

            <div class="col-12 col-sm-4">
              <q-input
                :model-value="displayNutrientsPerLiter"
                label="Питательность на литр (грамм)"
                outlined
                dense
                readonly
              >
                <template #append>
                  <q-tooltip>
                    Рассчитывается автоматически по ингредиентам (NPK)
                  </q-tooltip>
                </template>
              </q-input>
            </div>
          </div>

          <div class="ingredients-header row items-center justify-between">
            <div class="text-subtitle1">Ингредиенты</div>
            <q-btn color="primary" icon="add" label="Добавить" dense @click="addIngredient" />
          </div>

          <div v-if="form.ingredients.length === 0" class="text-grey-6">
            Добавьте хотя бы один ингредиент раствора (например, удобрение).
          </div>

          <div
            v-for="(ingredient, index) in form.ingredients"
            :key="ingredient.uid"
            class="ingredient-card q-pa-md q-mt-sm rounded-borders"
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">Ингредиент {{ index + 1 }}</div>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                @click="removeIngredient(index)"
              />
            </div>

          <q-select
            v-model="ingredient.fertilizerId"
            :options="filteredFertilizerOptions"
            label="Выберите удобрение из библиотеки"
            outlined
            dense
            use-input
            clearable
            :loading="props.loading"
            emit-value
            map-options
            input-debounce="150"
            @filter="filterFertilizerOptions"
            @update:model-value="(value) => applyFertilizerToIngredient(ingredient, value as string | null)"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

            <div class="row q-col-gutter-md q-mb-sm">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="ingredient.displayName"
                  label="Название"
                  outlined
                  dense
                  :rules="[val => !!val || 'Укажите название']"
                />
              </div>

              <div class="col-6 col-sm-4">
                <q-input
                  v-model.number="ingredient.amount"
                  label="Количество"
                  type="number"
                  outlined
                  dense
                  min="0"
                  step="0.1"
                  :rules="[val => val >= 0 || 'Не может быть отрицательным']"
                />
              </div>

              <div class="col-6 col-sm-4">
                <q-select
                  v-model="ingredient.unit"
                  :options="unitOptions"
                  label="Единица"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>
            </div>

            <q-input
              v-model="ingredient.notes"
              label="Примечание"
              type="textarea"
              outlined
              dense
              autogrow
              :max-length="300"
              class="q-mb-sm"
            />

            <div class="text-caption text-grey-6 q-mb-xs">
              Питательные элементы (на весь ингредиент, граммы)
            </div>

            <div class="row q-col-gutter-md">
              <div
                v-for="field in nutrientFields"
                :key="field.key"
                class="col-6 col-sm-4 col-md-2"
              >
                <q-input
                  v-model.number="ingredient.nutrients[field.key]"
                  :label="field.label"
                  type="number"
                  outlined
                  dense
                  min="0"
                  step="0.001"
                />
              </div>
            </div>
          </div>

          <div class="text-caption text-grey-6">
            Значения NPK нужны, чтобы автоматически оценивать нагрузку на грунт. Можно вводить только
            то, что известно.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-6">
            Общая питательность по ингредиентам:
            <span class="text-weight-medium">{{ displayTotalNutrients }}</span>
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat label="Отмена" color="grey" @click="close" />
            <q-btn color="primary" label="Сохранить" type="submit" :loading="submitting" />
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type {
  FertilizerComposition,
  WateringSolutionIngredient,
  WateringSolutionRecipe,
} from 'components/models';
import type { Fertilizer } from 'stores/fertilizer-library-firestore';

interface Props {
  modelValue: boolean;
  recipe?: WateringSolutionRecipe | null;
  loading?: boolean;
  submitting?: boolean;
  fertilizers?: Fertilizer[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (
    event: 'save',
    payload: {
      name: string;
      description?: string | null;
      waterVolumeMl: number;
      validForHours?: number | null;
      ingredients: WateringSolutionIngredient[];
      nutrientsPerLiter?: FertilizerComposition | null;
      totalNutrients?: FertilizerComposition | null;
    },
  ): void;
  (event: 'cancel'): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const formRef = ref();

const unitOptions = [
  { label: 'Граммы', value: 'g' },
  { label: 'Миллилитры', value: 'ml' },
];

const nutrientFields = [
  { key: 'N', label: 'N (Азот)' },
  { key: 'P', label: 'P (Фосфор)' },
  { key: 'K', label: 'K (Калий)' },
  { key: 'Ca', label: 'Ca (Кальций)' },
  { key: 'Mg', label: 'Mg (Магний)' },
  { key: 'S', label: 'S (Сера)' },
  { key: 'Fe', label: 'Fe (Железо)' },
  { key: 'Mn', label: 'Mn (Марганец)' },
  { key: 'Zn', label: 'Zn (Цинк)' },
  { key: 'Cu', label: 'Cu (Медь)' },
  { key: 'B', label: 'B (Бор)' },
  { key: 'Mo', label: 'Mo (Молибден)' },
  { key: 'Cl', label: 'Cl (Хлор)' },
  { key: 'Co', label: 'Co (Кобальт)' },
  { key: 'Ni', label: 'Ni (Никель)' },
  { key: 'Si', label: 'Si (Кремний)' },
] as const;

type NutrientKey = (typeof nutrientFields)[number]['key'];

interface IngredientFormState extends Omit<WateringSolutionIngredient, 'nutrients'> {
  uid: string;
  nutrients: Record<NutrientKey, number | null>;
}

interface FormState {
  name: string;
  description: string | null;
  waterVolumeMl: number;
  validForHours: number | null;
  ingredients: IngredientFormState[];
}

const defaultState: FormState = {
  name: '',
  description: null,
  waterVolumeMl: 3000,
  validForHours: null,
  ingredients: [],
};

const cloneState = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createEmptyNutrients = (): Record<NutrientKey, number | null> => {
  return nutrientFields.reduce(
    (acc, field) => {
      acc[field.key] = null;
      return acc;
    },
    {} as Record<NutrientKey, number | null>,
  );
};

const $q = useQuasar();

const form = reactive<FormState>(cloneState(defaultState));
const baseFertilizerOptions = computed(() =>
  (props.fertilizers ?? []).map((fertilizer) => ({
    label: fertilizer.name,
    value: fertilizer.id,
    description: fertilizer.description ?? '',
  })),
);
const filteredFertilizerOptions = ref(baseFertilizerOptions.value);

watch(
  baseFertilizerOptions,
  (options) => {
    filteredFertilizerOptions.value = options;
  },
  { immediate: true },
);

const resetForm = () => {
  Object.assign(form, cloneState(defaultState));
};

const initFromRecipe = (recipe: WateringSolutionRecipe | null | undefined) => {
  resetForm();
  if (!recipe) return;
  form.name = recipe.name;
  form.description = recipe.description ?? null;
  form.waterVolumeMl = recipe.waterVolumeMl;
  form.validForHours = recipe.validForHours ?? null;
  form.ingredients = (recipe.ingredients || []).map((item) => {
    const nutrients = createEmptyNutrients();
    if (item.nutrients) {
      Object.entries(item.nutrients).forEach(([key, value]) => {
        if (value != null && key in nutrients) {
          nutrients[key as NutrientKey] = value;
        }
      });
    }
    return {
      ...item,
      uid: crypto.randomUUID(),
      nutrients,
    };
  });
};

watch(
  () => props.recipe,
  (recipe) => {
    if (model.value) {
      initFromRecipe(recipe);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      initFromRecipe(props.recipe);
    } else {
      resetForm();
    }
  },
);

function close() {
  emit('cancel');
  emit('update:modelValue', false);
}

function addIngredient() {
  form.ingredients.push({
    uid: crypto.randomUUID(),
    displayName: '',
    amount: 0,
    unit: 'g',
    notes: null,
    fertilizerId: null,
    nutrients: createEmptyNutrients(),
  } as IngredientFormState);
}

function removeIngredient(index: number) {
  form.ingredients.splice(index, 1);
}

function applyFertilizerToIngredient(ingredient: IngredientFormState, fertilizerId: string | null) {
  if (!fertilizerId) {
    return;
  }
  const fertilizer = props.fertilizers?.find((item) => item.id === fertilizerId);
  if (!fertilizer) {
    return;
  }

  ingredient.displayName = fertilizer.name;
  if (!ingredient.notes || ingredient.notes.length === 0) {
    ingredient.notes = fertilizer.description ?? null;
  }

  nutrientFields.forEach(({ key }) => {
    const value = fertilizer.composition[key];
    ingredient.nutrients[key] = value != null ? Number(value) : null;
  });
}

function filterFertilizerOptions(
  val: string,
  update: (callback: () => void, after?: () => void) => void,
) {
  update(() => {
    const needle = val.toLowerCase().trim();
    if (!needle) {
      filteredFertilizerOptions.value = baseFertilizerOptions.value;
    } else {
      filteredFertilizerOptions.value = baseFertilizerOptions.value.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) ||
          option.description.toLowerCase().includes(needle),
      );
    }
  });
}

const totalNutrientMap = computed(() => {
  const result = nutrientFields.reduce(
    (acc, field) => {
      acc[field.key] = 0;
      return acc;
    },
    {} as Record<NutrientKey, number>,
  );
  form.ingredients.forEach((ingredient) => {
    nutrientFields.forEach(({ key }) => {
      const value = ingredient.nutrients[key];
      if (value != null && !Number.isNaN(value)) {
        result[key] += value;
      }
    });
  });
  return result;
});

const displayTotalNutrients = computed(() => {
  const total = totalNutrientMap.value;
  const entries = Object.entries(total).filter(([, value]) => value > 0.0001);
  if (entries.length === 0) {
    return '—';
  }
  return entries
    .map(([key, value]) => `${key}: ${value.toFixed(1)} г`)
    .join(' · ');
});

const nutrientsPerLiter = computed(() => {
  if (!form.waterVolumeMl || form.waterVolumeMl <= 0) {
    return null;
  }
  const liters = form.waterVolumeMl / 1000;
  if (liters <= 0) return null;
  const total = totalNutrientMap.value;
  const result: FertilizerComposition = {};
  Object.entries(total).forEach(([key, value]) => {
    if (value > 0.0001) {
      result[key] = Number((value / liters).toFixed(3));
    }
  });
  return Object.keys(result).length > 0 ? result : null;
});

const totalNutrients = computed<FertilizerComposition | null>(() => {
  const map = totalNutrientMap.value;
  const result: FertilizerComposition = {};
  Object.entries(map).forEach(([key, value]) => {
    if (value > 0.0001) {
      result[key] = Number(value.toFixed(3));
    }
  });
  return Object.keys(result).length > 0 ? result : null;
});

const displayNutrientsPerLiter = computed(() => {
  const data = nutrientsPerLiter.value;
  if (!data) {
    return '—';
  }
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${value.toFixed(2)} г/л`)
    .join(' · ');
});

async function handleSubmit() {
  const formValid = await (formRef.value as any)?.validate?.();
  if (formValid === false) {
    return;
  }
  if (form.ingredients.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Добавьте хотя бы один ингредиент',
    });
    return;
  }

  const ingredients: WateringSolutionIngredient[] = form.ingredients.map((item) => {
    const nutrients: FertilizerComposition = {};
    nutrientFields.forEach(({ key }) => {
      const value = item.nutrients[key];
      if (value != null && !Number.isNaN(value)) {
        nutrients[key] = Number(value);
      }
    });
    return {
      fertilizerId: item.fertilizerId ?? null,
      displayName: item.displayName,
      amount: item.amount,
      unit: item.unit,
      notes: item.notes ?? null,
      nutrients: Object.keys(nutrients).length > 0 ? nutrients : undefined,
    };
  });

  emit('save', {
    name: form.name,
    description: form.description || null,
    waterVolumeMl: Number(form.waterVolumeMl),
    validForHours: form.validForHours || null,
    ingredients,
    nutrientsPerLiter: nutrientsPerLiter.value,
    totalNutrients: totalNutrients.value,
  });
}
</script>

<style scoped>
.ingredient-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.6);
}

.ingredients-header {
  padding: 8px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
</style>

