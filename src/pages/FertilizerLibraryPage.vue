<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-my-none">Библиотека удобрений</h4>
          <p class="text-grey-6 q-mt-sm">
            Управляйте библиотекой удобрений для ваших растений.
          </p>
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-auto">
              <q-badge color="primary" outline>
                Удобрений в базе: {{ filteredFertilizers.length }}
              </q-badge>
            </div>
          </div>
        </div>
        <div>
          <div class="row q-col-gutter-sm">
            <q-btn
              v-if="isAdmin"
              color="secondary"
              icon="cloud_download"
              label="Инициализировать библиотеку"
              @click="handleInitialize"
              :loading="store.loading && isInitializing"
            />
            <q-btn
              color="primary"
              icon="add"
              label="Добавить удобрение"
              @click="showAddDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Загрузка удобрений...</div>
    </div>

    <div v-else-if="store.error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">{{ store.error }}</div>
      <q-btn color="primary" label="Повторить" @click="store.fetchFertilizers" class="q-mt-md" />
    </div>

    <div v-else>
      <!-- Панель поиска и фильтрации -->
      <div class="row q-col-gutter-md q-mb-md items-end">
        <div class="col-12 col-md-6">
          <q-input
            v-model="searchQuery"
            label="Поиск по названию"
            outlined
            dense
            clearable
            debounce="300"
            @update:model-value="handleSearch"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedCategory"
            :options="categoryOptions"
            label="Фильтр по категории"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="handleSearch"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-btn
            flat
            icon="refresh"
            label="Обновить"
            @click="store.fetchFertilizers"
            class="full-width"
          />
        </div>
      </div>

      <!-- Список удобрений -->
      <div v-if="filteredFertilizers.length === 0" class="text-center q-pa-xl">
        <q-icon name="science" size="100px" color="grey-4" />
        <div class="text-h6 q-mt-md text-grey-6">Удобрения не найдены</div>
        <div class="text-body2 text-grey-5 q-mt-sm">
          {{ searchQuery || selectedCategory ? 'Попробуйте изменить параметры поиска' : 'Добавьте первое удобрение' }}
        </div>
      </div>

      <div v-else class="row q-col-gutter-md">
        <div
          v-for="fertilizer in filteredFertilizers"
          :key="fertilizer.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <FertilizerCard
            :fertilizer="fertilizer"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle-favorite="handleToggleFavorite"
          />
        </div>
      </div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <FertilizerFormDialog
      v-model="showAddDialog"
      :fertilizer="editingFertilizer"
      :loading="store.loading"
      @save="handleSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useFertilizerLibraryFirestore } from 'stores/fertilizer-library-firestore';
import { useUserStore } from 'stores/user-store';
import type { Fertilizer } from 'stores/fertilizer-library-firestore';
import FertilizerCard from 'components/FertilizerCard.vue';
import FertilizerFormDialog from 'components/FertilizerFormDialog.vue';

const store = useFertilizerLibraryFirestore();
const userStore = useUserStore();
const $q = useQuasar();

const isAdmin = computed(() => userStore.user?.email === 'lowdog136@gmail.com');
const isInitializing = ref(false);

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const showAddDialog = ref(false);
const editingFertilizer = ref<Fertilizer | null>(null);

const categoryOptions = [
  { label: 'Органическое', value: 'organic' },
  { label: 'Минеральное', value: 'mineral' },
  { label: 'Комплексное', value: 'complex' },
  { label: 'Микроэлементы', value: 'micro' },
  { label: 'Другое', value: 'other' },
];

const filteredFertilizers = computed(() => {
  let result = store.fertilizers;

  if (searchQuery.value && searchQuery.value.trim().length > 0) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query) ||
        f.manufacturer?.toLowerCase().includes(query),
    );
  }

  if (selectedCategory.value) {
    result = result.filter((f) => f.category === selectedCategory.value);
  }

  return result;
});

async function handleSearch() {
  // Поиск выполняется через computed свойство
}

async function handleEdit(fertilizer: Fertilizer) {
  editingFertilizer.value = fertilizer;
  showAddDialog.value = true;
}

async function handleSave(fertilizerData: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    if (editingFertilizer.value) {
      await store.updateFertilizer(editingFertilizer.value.id, fertilizerData);
      $q.notify({
        color: 'positive',
        message: 'Удобрение обновлено',
        icon: 'check',
      });
    } else {
      await store.addFertilizer(fertilizerData);
      $q.notify({
        color: 'positive',
        message: 'Удобрение добавлено',
        icon: 'check',
      });
    }
    editingFertilizer.value = null;
    showAddDialog.value = false;
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Ошибка при сохранении',
      icon: 'error',
    });
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteFertilizer(id);
    $q.notify({
      color: 'positive',
      message: 'Удобрение удалено',
      icon: 'check',
    });
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Ошибка при удалении',
      icon: 'error',
    });
  }
}

async function handleToggleFavorite(id: string) {
  try {
    await store.toggleFavorite(id);
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Ошибка при обновлении',
      icon: 'error',
    });
  }
}

async function handleInitialize() {
  $q.dialog({
    title: 'Инициализация библиотеки',
    message: 'Добавить примеры удобрений в библиотеку? Существующие удобрения не будут дублироваться.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    isInitializing.value = true;
    try {
      const result = await store.initializeLibrary();
      $q.notify({
        color: 'positive',
        message: `Инициализация завершена: добавлено ${result.added}, пропущено ${result.skipped}`,
        icon: 'check',
        timeout: 5000,
      });
    } catch (error: any) {
      $q.notify({
        color: 'negative',
        message: error.message || 'Ошибка при инициализации',
        icon: 'error',
      });
    } finally {
      isInitializing.value = false;
    }
  });
}

watch(showAddDialog, (isOpen) => {
  if (!isOpen) {
    editingFertilizer.value = null;
  }
});

onMounted(async () => {
  await store.fetchFertilizers();
  // Подписываемся на изменения в реальном времени
  store.subscribeFertilizers();
});
</script>

