<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор средства обработки</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Поиск -->
        <q-input
          v-model="searchQuery"
          label="Поиск средств обработки"
          outlined
          dense
          clearable
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Фильтр по категориям -->
        <q-btn-group class="q-mb-md">
          <q-btn
            v-for="category in categories"
            :key="category.value"
            :label="category.label"
            :color="selectedCategory === category.value ? 'primary' : 'grey'"
            :outline="selectedCategory !== category.value"
            @click="selectedCategory = category.value"
            size="sm"
          />
        </q-btn-group>

        <!-- Список средств -->
        <div class="treatment-list" style="max-height: 400px; overflow-y: auto">
          <q-list>
            <q-item
              v-for="treatment in filteredTreatments"
              :key="treatment.id"
              clickable
              @click="selectTreatment(treatment)"
              class="q-mb-sm"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ treatment.name }}</q-item-label>
                <q-item-label caption v-if="treatment.description">
                  {{ treatment.description }}
                </q-item-label>
                <q-item-label caption v-if="treatment.activeIngredient">
                  Активное вещество: {{ treatment.activeIngredient }}
                </q-item-label>
                <q-item-label caption v-if="treatment.manufacturer">
                  Производитель: {{ treatment.manufacturer }}
                </q-item-label>

                <!-- Концентрация -->
                <div class="q-mt-xs" v-if="treatment.concentration">
                  <q-chip
                    size="sm"
                    color="green-1"
                    text-color="green-9"
                    :label="`${treatment.concentration} ${treatment.unit || ''}`"
                  />
                </div>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  :icon="treatment.isFavorite ? 'star' : 'star_border'"
                  :color="treatment.isFavorite ? 'amber' : 'grey'"
                  size="sm"
                  @click.stop="toggleFavorite(treatment.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Кнопка добавления нового средства -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            color="secondary"
            icon="add"
            label="Добавить новое средство"
            @click="showAddNew = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления нового средства -->
    <q-dialog v-model="showAddNew" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Добавить новое средство</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="addNewTreatment" class="q-gutter-md">
            <q-input
              v-model="newTreatment.name"
              label="Название средства"
              outlined
              :rules="[(val) => !!val || 'Название обязательно']"
            />

            <q-input
              v-model="newTreatment.description"
              label="Описание (необязательно)"
              type="textarea"
              outlined
              rows="2"
            />

            <q-input
              v-model="newTreatment.activeIngredient"
              label="Активное вещество (необязательно)"
              outlined
            />

            <q-input
              v-model="newTreatment.manufacturer"
              label="Производитель (необязательно)"
              outlined
            />

            <q-select
              v-model="newTreatment.category"
              :options="categoryOptions"
              label="Категория"
              outlined
              :rules="[(val) => !!val || 'Категория обязательна']"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model.number="newTreatment.concentration"
                  label="Концентрация"
                  type="number"
                  outlined
                  suffix="%"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="newTreatment.unit"
                  :options="unitOptions"
                  label="Единица измерения"
                  outlined
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Добавить" color="primary" @click="addNewTreatment" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useTreatmentLibrary, type TreatmentAgent } from 'stores/treatment-library';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', treatment: TreatmentAgent): void;
}>();

const $q = useQuasar();
const treatmentLibrary = useTreatmentLibrary();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const showAddNew = ref(false);

// Новое средство
const newTreatment = ref({
  name: '',
  description: '',
  activeIngredient: '',
  manufacturer: '',
  category: 'other' as TreatmentAgent['category'],
  concentration: null as number | null,
  unit: 'ml/l' as TreatmentAgent['unit'],
});

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Фунгициды', value: 'fungicide' },
  { label: 'Инсектициды', value: 'insecticide' },
  { label: 'Гербициды', value: 'herbicide' },
  { label: 'Пестициды', value: 'pesticide' },
  { label: 'Био', value: 'bio' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.slice(1).map((c) => ({
  label: c.label,
  value: c.value,
}));

const unitOptions = [
  { label: 'мл/л', value: 'ml/l' },
  { label: 'г/л', value: 'g/l' },
  { label: 'ppm', value: 'ppm' },
  { label: 'Другое', value: 'other' },
];

// Инициализация библиотеки при первом открытии
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && treatmentLibrary.treatments.length === 0) {
      treatmentLibrary.initializeTreatments();
    }
  },
);

// Фильтрация средств
const filteredTreatments = computed(() => {
  let result = treatmentLibrary.treatments;

  // Фильтр по категории
  if (selectedCategory.value !== 'all') {
    result = result.filter((t) => t.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value) {
    result = treatmentLibrary.searchTreatments(searchQuery.value);
  }

  return result;
});

// Методы
function selectTreatment(treatment: TreatmentAgent) {
  emit('select', treatment);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  treatmentLibrary.toggleFavorite(id);
}

function addNewTreatment() {
  if (!newTreatment.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Название средства обязательно',
      icon: 'error',
    });
    return;
  }

  const treatment = treatmentLibrary.addTreatment({
    name: newTreatment.value.name,
    description: newTreatment.value.description || undefined,
    activeIngredient: newTreatment.value.activeIngredient || undefined,
    manufacturer: newTreatment.value.manufacturer || undefined,
    category: newTreatment.value.category,
    concentration: newTreatment.value.concentration || undefined,
    unit: newTreatment.value.unit,
    isFavorite: false,
  });

  // Сбрасываем форму
  newTreatment.value = {
    name: '',
    description: '',
    activeIngredient: '',
    manufacturer: '',
    category: 'other',
    concentration: null,
    unit: 'ml/l',
  };

  showAddNew.value = false;

  $q.notify({
    color: 'positive',
    message: 'Средство добавлено в библиотеку',
    icon: 'check_circle',
  });
}
</script>

<style scoped>
.treatment-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
