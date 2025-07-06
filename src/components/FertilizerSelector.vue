<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 90vw; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор удобрения</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- Поиск -->
        <q-input
          v-model="searchQuery"
          label="Поиск удобрений"
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

        <!-- Список удобрений -->
        <div class="fertilizer-list" style="max-height: 400px; overflow-y: auto">
          <q-list>
            <q-item
              v-for="fertilizer in filteredFertilizers"
              :key="fertilizer.id"
              clickable
              @click="selectFertilizer(fertilizer)"
              class="q-mb-sm"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ fertilizer.name }}</q-item-label>
                <q-item-label caption v-if="fertilizer.description">
                  {{ fertilizer.description }}
                </q-item-label>
                <q-item-label caption v-if="fertilizer.manufacturer">
                  Производитель: {{ fertilizer.manufacturer }}
                </q-item-label>

                <!-- Состав -->
                <div class="q-mt-xs">
                  <q-chip
                    v-for="(value, element) in fertilizer.composition"
                    :key="element"
                    size="sm"
                    color="blue-1"
                    text-color="blue-9"
                    :label="`${element}: ${value}%`"
                  />
                </div>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  :icon="fertilizer.isFavorite ? 'star' : 'star_border'"
                  :color="fertilizer.isFavorite ? 'amber' : 'grey'"
                  size="sm"
                  @click.stop="toggleFavorite(fertilizer.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Кнопка добавления нового удобрения -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            color="secondary"
            icon="add"
            label="Добавить новое удобрение"
            @click="showAddNew = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Диалог добавления нового удобрения -->
    <q-dialog v-model="showAddNew" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Добавить новое удобрение</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="addNewFertilizer" class="q-gutter-md">
            <q-input
              v-model="newFertilizer.name"
              label="Название удобрения"
              outlined
              :rules="[(val) => !!val || 'Название обязательно']"
            />

            <q-input
              v-model="newFertilizer.description"
              label="Описание (необязательно)"
              type="textarea"
              outlined
              rows="2"
            />

            <q-input
              v-model="newFertilizer.manufacturer"
              label="Производитель (необязательно)"
              outlined
            />

            <q-select
              v-model="newFertilizer.category"
              :options="categoryOptions"
              label="Категория"
              outlined
              :rules="[(val) => !!val || 'Категория обязательна']"
            />

            <div class="text-subtitle2 q-mt-md">Состав (%):</div>

            <!-- Макроэлементы -->
            <div class="text-caption text-grey-6">Макроэлементы:</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4" v-for="element in macroElements" :key="element.symbol">
                <q-input
                  v-model.number="newFertilizer.composition[element.symbol]"
                  :label="`${element.symbol} (${element.name})`"
                  type="number"
                  outlined
                  dense
                  suffix="%"
                />
              </div>
            </div>

            <!-- Микроэлементы -->
            <div class="text-caption text-grey-6 q-mt-md">Микроэлементы:</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4" v-for="element in microElements" :key="element.symbol">
                <q-input
                  v-model.number="newFertilizer.composition[element.symbol]"
                  :label="`${element.symbol} (${element.name})`"
                  type="number"
                  outlined
                  dense
                  suffix="%"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Добавить" color="primary" @click="addNewFertilizer" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useFertilizerLibrary, type Fertilizer } from 'stores/fertilizer-library';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', fertilizer: Fertilizer): void;
}>();

const $q = useQuasar();
const fertilizerLibrary = useFertilizerLibrary();

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const showAddNew = ref(false);

// Новое удобрение
const newFertilizer = ref({
  name: '',
  description: '',
  manufacturer: '',
  category: 'other' as Fertilizer['category'],
  composition: {} as any,
});

// Категории
const categories = [
  { label: 'Все', value: 'all' },
  { label: 'Комплексные', value: 'complex' },
  { label: 'Минеральные', value: 'mineral' },
  { label: 'Органические', value: 'organic' },
  { label: 'Микроэлементы', value: 'micro' },
  { label: 'Другие', value: 'other' },
];

const categoryOptions = categories.slice(1).map((c) => ({
  label: c.label,
  value: c.value,
}));

// Элементы
const macroElements = [
  { symbol: 'N', name: 'Азот' },
  { symbol: 'P', name: 'Фосфор' },
  { symbol: 'K', name: 'Калий' },
  { symbol: 'Ca', name: 'Кальций' },
  { symbol: 'Mg', name: 'Магний' },
  { symbol: 'S', name: 'Сера' },
];

const microElements = [
  { symbol: 'Fe', name: 'Железо' },
  { symbol: 'Mn', name: 'Марганец' },
  { symbol: 'Zn', name: 'Цинк' },
  { symbol: 'Cu', name: 'Медь' },
  { symbol: 'B', name: 'Бор' },
  { symbol: 'Mo', name: 'Молибден' },
  { symbol: 'Cl', name: 'Хлор' },
  { symbol: 'Co', name: 'Кобальт' },
  { symbol: 'Ni', name: 'Никель' },
  { symbol: 'Si', name: 'Кремний' },
];

// Инициализация библиотеки при первом открытии
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && fertilizerLibrary.fertilizers.length === 0) {
      fertilizerLibrary.initializeFertilizers();
    }
  },
);

// Фильтрация удобрений
const filteredFertilizers = computed(() => {
  let result = fertilizerLibrary.fertilizers;

  // Фильтр по категории
  if (selectedCategory.value !== 'all') {
    result = result.filter((f) => f.category === selectedCategory.value);
  }

  // Поиск
  if (searchQuery.value) {
    result = fertilizerLibrary.searchFertilizers(searchQuery.value);
  }

  return result;
});

// Методы
function selectFertilizer(fertilizer: Fertilizer) {
  emit('select', fertilizer);
  showDialog.value = false;
}

function toggleFavorite(id: string) {
  fertilizerLibrary.toggleFavorite(id);
}

function addNewFertilizer() {
  if (!newFertilizer.value.name) {
    $q.notify({
      color: 'negative',
      message: 'Название удобрения обязательно',
      icon: 'error',
    });
    return;
  }

  // Очищаем состав от пустых значений
  const cleanComposition: any = {};
  Object.entries(newFertilizer.value.composition).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleanComposition[key] = Number(value);
    }
  });

  const fertilizer = fertilizerLibrary.addFertilizer({
    name: newFertilizer.value.name,
    description: newFertilizer.value.description || undefined,
    manufacturer: newFertilizer.value.manufacturer || undefined,
    category: newFertilizer.value.category,
    composition: cleanComposition,
    isFavorite: false,
  });

  // Сбрасываем форму
  newFertilizer.value = {
    name: '',
    description: '',
    manufacturer: '',
    category: 'other',
    composition: {},
  };

  showAddNew.value = false;

  $q.notify({
    color: 'positive',
    message: 'Удобрение добавлено в библиотеку',
    icon: 'check_circle',
  });
}
</script>

<style scoped>
.fertilizer-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
}
</style>
