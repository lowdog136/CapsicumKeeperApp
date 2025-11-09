<template>
  <q-page :class="['pepper-list-page', isMobile ? 'q-pa-sm' : 'q-pa-md']">
    <!-- Заголовок -->
    <div class="text-center q-mb-lg">
      <h4 class="q-my-none">Мои перцы</h4>
      <p class="text-grey-6 q-mt-sm">Управляйте и отслеживайте рост ваших перцев</p>
    </div>

    <!-- Загрузка авторизации -->
    <div v-if="userStore.loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md">Проверка авторизации...</div>
    </div>

    <!-- Не авторизован -->
    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="account_circle" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Требуется авторизация</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        Чтобы отслеживать свои перцы, необходимо авторизоваться
      </div>
    </div>

    <!-- Авторизован -->
    <div v-else>
      <!-- Загрузка перцев -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="50px" />
        <div class="q-mt-md">Загрузка ваших перцев...</div>
      </div>

      <!-- Ошибка загрузки -->
      <div v-else-if="error" class="text-center q-pa-xl">
        <q-icon name="error" size="100px" color="red-4" />
        <div class="text-h6 q-mt-md text-red-6">Ошибка загрузки</div>
        <div class="text-body2 text-grey-5 q-mt-sm">{{ error }}</div>
        <q-btn color="primary" label="Попробовать снова" class="q-mt-md" @click="fetchPeppers" />
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="peppers.length === 0" class="text-center q-pa-xl">
        <q-icon name="local_florist" size="100px" color="grey-4" />
        <div class="text-h6 q-mt-md text-grey-6">У вас пока нет перцев</div>
        <div class="text-body2 text-grey-5 q-mt-sm">
          Добавьте свой первый перец или изучите библиотеку сортов
        </div>

        <!-- Панель миграции -->
        <div class="q-mt-lg">
          <MigrationPanel />
        </div>

        <div class="row justify-center q-mt-lg q-gutter-md">
          <q-btn
            color="primary"
            icon="add"
            label="Добавить перец"
            @click="$router.push('/add-pepper')"
          />
          <q-btn
            color="secondary"
            icon="library_books"
            label="Библиотека сортов"
            @click="$router.push('/variety-library')"
          />
          <q-btn color="accent" icon="science" label="Тестовый перец" @click="createTestPepper" />
          <q-btn color="info" icon="bug_report" label="Дебаг" @click="debugPeppers" />
        </div>
      </div>

      <!-- Список перцев -->
      <div v-else>
      <!-- Фильтры и поиск -->
      <PepperFilters v-model="filters" v-model:view-mode="viewMode" />

      <div class="header-wrapper q-mb-md">
          <h5 class="q-my-none">Ваши перцы ({{ filteredPeppers.length }})</h5>
          <q-btn
            color="primary"
            icon="add"
            label="Добавить перец"
          class="header-action-btn"
            @click="$router.push('/add-pepper')"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="pepper in pagedPeppers"
            :key="pepper.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <div class="pepper-card-wrapper">
              <PepperCard
                :pepper="pepper"
                @update:stage="updateStage(pepper.id, $event)"
                @update:location="updateLocation(pepper.id, $event)"
                @delete="handleDelete"
                @toggle-favorite="handleToggleFavorite"
                @edit="handleEdit"
                @update="(updates) => handleUpdate(pepper.id, updates)"
                @assign-to-seedling-tray="handleAssignToSeedlingTray"
                @remove-from-seedling-tray="handleRemoveFromSeedlingTray"
                @open-seedling-tray="handleOpenSeedlingTray"
              />
            </div>
          </div>
        </div>

        <!-- Пагинация -->
        <div class="row justify-center q-mt-lg" v-if="pageCount > 1">
          <q-pagination
            v-model="page"
            :max="pageCount"
            color="primary"
            input
            boundary-numbers
            size="md"
          />
        </div>
      </div>
    </div>

    <!-- Диалог редактирования перца -->
    <PepperEditForm
      v-if="editingPepper"
      v-model="showEditDialog"
      :pepper="editingPepper"
      @save="saveEdit"
    />
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { usePepperFirestore } from 'stores/pepper-firestore';
import { useUserStore } from 'stores/user-store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import PepperCard from 'components/PepperCard.vue';
import MigrationPanel from 'components/MigrationPanel.vue';
import PepperFilters from 'components/PepperFilters.vue';
import PepperEditForm from 'components/PepperEditForm.vue';
import type { Pepper } from 'components/models';
import { useSeedlingTrayStore } from 'stores/seedling-trays-firestore';
import { ref, computed, onMounted, watch } from 'vue';

const pepperFirestore = usePepperFirestore();
const seedlingTrayStore = useSeedlingTrayStore();
const userStore = useUserStore();
const { peppers, loading, error } = storeToRefs(pepperFirestore);
const $q = useQuasar();
const $router = useRouter();

const page = ref(1);
const viewMode = ref<'grid' | 'list'>('grid');
const filters = ref({
  search: '',
  stage: null as string | null,
  location: null as string | null,
  favorite: null as boolean | null,
  sortBy: 'name' as string,
  dateFrom: '',
  dateTo: '',
  minAge: null as number | null,
  maxAge: null as number | null,
});

// Простое вычисление perPage без реактивности на window.innerWidth
// Это предотвращает ненужные пересчеты computed свойств
const isMobile = computed(() => $q.screen.lt.sm);

const perPage = computed(() => {
  if ($q.screen.lt.sm) return 4;
  if ($q.screen.lt.md) return 6;
  return 8;
});

// Фильтрация и сортировка перцев
const filteredPeppers = computed(() => {
  let result = [...peppers.value];

  // Поиск по названию и описанию
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    result = result.filter(
      (pepper) =>
        pepper.name.toLowerCase().includes(searchTerm) ||
        pepper.description.toLowerCase().includes(searchTerm) ||
        pepper.variety.toLowerCase().includes(searchTerm),
    );
  }

  // Фильтр по стадии
  if (filters.value.stage) {
    result = result.filter((pepper) => pepper.stage === filters.value.stage);
  }

  // Фильтр по месту посадки
  if (filters.value.location) {
    result = result.filter((pepper) => pepper.location?.type === filters.value.location);
  }

  // Фильтр по избранному
  if (filters.value.favorite !== null) {
    result = result.filter((pepper) => pepper.isFavorite === filters.value.favorite);
  }

  // Фильтр по дате посадки
  if (filters.value.dateFrom) {
    result = result.filter((pepper) => pepper.plantingDate >= filters.value.dateFrom);
  }
  if (filters.value.dateTo) {
    result = result.filter((pepper) => pepper.plantingDate <= filters.value.dateTo);
  }

  // Фильтр по возрасту
  if (filters.value.minAge || filters.value.maxAge) {
    result = result.filter((pepper) => {
      const plantDate = new Date(pepper.plantingDate);
      const now = new Date();
      const age = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));

      if (filters.value.minAge && age < filters.value.minAge) return false;
      if (filters.value.maxAge && age > filters.value.maxAge) return false;
      return true;
    });
  }

  // Сортировка - создаем отсортированную копию, не мутируем исходный массив
  // Это предотвращает циклические обновления реактивности
  const sorted = [...result].sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'plantingDate':
        return new Date(a.plantingDate).getTime() - new Date(b.plantingDate).getTime();
      case 'stage':
        return a.stage.localeCompare(b.stage);
      case 'age':
        const ageA = Math.floor(
          (new Date().getTime() - new Date(a.plantingDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        const ageB = Math.floor(
          (new Date().getTime() - new Date(b.plantingDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        return ageA - ageB;
      case 'favorite':
        return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      default:
        return 0;
    }
  });

  return sorted;
});

const pageCount = computed(() => Math.ceil(filteredPeppers.value.length / perPage.value));
const pagedPeppers = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredPeppers.value.slice(start, start + perPage.value);
});

// Загружаем перцы при изменении авторизации
watch(
  () => userStore.user,
  (newUser) => {
    if (newUser) {
      fetchPeppers();
    } else {
      // Сбрасываем данные при выходе
      pepperFirestore.$reset();
    }
  },
);

onMounted(async () => {
  // Ждем завершения проверки авторизации
  if (!userStore.loading && userStore.user) {
    await fetchPeppers();
  }
});

async function fetchPeppers() {
  try {
    await pepperFirestore.fetchPeppers();
  } catch (error) {
    console.error('Error fetching peppers:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка загрузки перцев',
      icon: 'error',
    });
  }
}

async function createTestPepper() {
  try {
    const testPepper = {
      name: 'Тестовый Халапеньо',
      variety: 'Халапеньо',
      photoUrl: '',
      description: 'Тестовый перец для проверки новой структуры данных',
      stage: 'рассада' as const,
      plantingDate: new Date().toISOString(),
      fertilizingHistory: [],
      wateringHistory: [],
      location: {
        type: 'горшок' as const,
        potVolume: '1 литр',
      },
      isFavorite: false,
      soilExtras: {
        hasDrainage: true,
        drainage: 'Керамзит',
        hasSoilImprovement: false,
        soilImprovement: null,
      },
      userId: userStore.user?.uid || '',
    };

    await pepperFirestore.addPepper(testPepper);

    $q.notify({
      color: 'positive',
      message: 'Тестовый перец создан успешно!',
      icon: 'check_circle',
    });
  } catch (error) {
    console.error('Error creating test pepper:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка создания тестового перца',
      icon: 'error',
    });
  }
}

async function debugPeppers() {
  try {
    await pepperFirestore.debugPeppers();
  } catch (error) {
    console.error('Debug error:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка при отладке',
      icon: 'error',
    });
  }
}

function handleAssignToSeedlingTray(pepperId: string) {
  $router.push({ path: '/seedling-trays', query: { assignPepper: pepperId } });
}

function handleOpenSeedlingTray(payload: { trayId: string; pepperId: string }) {
  $router.push({
    path: `/seedling-trays/${payload.trayId}`,
    query: { highlight: payload.pepperId },
  });
}

function handleRemoveFromSeedlingTray(pepperId: string) {
  const pepper = peppers.value.find((p) => p.id === pepperId);
  if (!pepper?.seedlingSlot) {
    return;
  }

  const { trayId, row, column } = pepper.seedlingSlot;
  const tray = seedlingTrayStore.getTrayById(trayId);
  const trayLabel = tray?.name || 'Кассета';

  $q.dialog({
    title: 'Убрать из кассеты',
    message: `Удалить перец «${pepper.name}» из кассеты «${trayLabel}» (R${row} · C${column})?`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Убрать',
    },
  }).onOk(async () => {
    try {
      if (!seedlingTrayStore.getTrayById(trayId)) {
        await seedlingTrayStore.fetchTrays();
      }
      await seedlingTrayStore.clearSlot(trayId, row, column, pepperId);
      $q.notify({
        color: 'positive',
        message: 'Перец убран из кассеты',
        icon: 'check',
      });
    } catch (error: any) {
      console.error('Error removing pepper from tray:', error);
      $q.notify({
        color: 'negative',
        message: error.message || 'Не удалось убрать перец из кассеты',
        icon: 'error',
      });
    }
  });
}

async function updateStage(id: string, newStage: Pepper['stage']) {
  try {
    console.log('🔄 updateStage вызвана:', { id, newStage });
    const pepper = peppers.value.find((p) => p.id === id);
    if (!pepper) {
      throw new Error('Перец не найден');
    }

    console.log('📋 Текущая стадия перца:', pepper.stage);

    // Если стадия изменилась, обновляем стадию и историю
    if (pepper.stage !== newStage) {
      const today = new Date().toISOString().slice(0, 10);
      const newStageHistory = pepper.stageHistory ? [...pepper.stageHistory] : [];
      
      // Добавляем новую запись в историю только если стадия действительно изменилась
      newStageHistory.push({ date: today, stage: newStage });

      console.log('💾 Сохраняем изменения:', { stage: newStage, stageHistory: newStageHistory });

      await pepperFirestore.updatePepper(id, {
        stage: newStage,
        stageHistory: newStageHistory,
      });

      console.log('✅ Стадия успешно обновлена в Firestore');

      $q.notify({
        color: 'positive',
        message: 'Стадия роста обновлена',
        icon: 'check_circle',
      });
    } else {
      console.log('ℹ️ Стадия не изменилась, обновление не требуется');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления стадии:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка обновления стадии: ' + (error as Error).message,
      icon: 'error',
    });
  }
}

async function updateLocation(id: string, newLocation: Pepper['location']) {
  try {
    console.log('🔄 updateLocation вызвана:', { id, newLocation });
    const pepper = peppers.value.find((p) => p.id === id);
    if (!pepper) {
      throw new Error('Перец не найден');
    }

    console.log('📋 Текущее место посадки перца:', pepper.location);

    // Проверяем, изменилось ли место посадки
    const locationChanged =
      pepper.location?.type !== newLocation?.type ||
      pepper.location?.potVolume !== newLocation?.potVolume;

    if (locationChanged) {
      const today = new Date().toISOString().slice(0, 10);
      const newLocationHistory = pepper.locationHistory ? [...pepper.locationHistory] : [];
      
      // Добавляем новую запись в историю
      const locationHistoryEntry: {
        date: string;
        type: Pepper['location']['type'];
        potVolume?: string;
      } = {
        date: today,
        type: newLocation.type,
      };
      if (newLocation.potVolume !== undefined) {
        locationHistoryEntry.potVolume = newLocation.potVolume;
      }
      newLocationHistory.push(locationHistoryEntry);

      console.log('💾 Сохраняем изменения:', { location: newLocation, locationHistory: newLocationHistory });

      await pepperFirestore.updatePepper(id, {
        location: newLocation,
        locationHistory: newLocationHistory,
      });

      console.log('✅ Место посадки успешно обновлено в Firestore');

      $q.notify({
        color: 'positive',
        message: 'Место посадки обновлено',
        icon: 'check_circle',
      });
    } else {
      console.log('ℹ️ Место посадки не изменилось, обновление не требуется');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления места посадки:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка обновления места посадки: ' + (error as Error).message,
      icon: 'error',
    });
  }
}

async function handleDelete(id: string) {
  try {
    await pepperFirestore.deletePepper(id);
    $q.notify({
      color: 'positive',
      message: 'Перец удален',
      icon: 'delete_forever',
    });
  } catch (error) {
    console.error('Error deleting pepper:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка удаления перца',
      icon: 'error',
    });
  }
}

async function handleToggleFavorite(id: string) {
  try {
    const pepper = peppers.value.find((p) => p.id === id);
    if (pepper) {
      await pepperFirestore.updatePepper(id, { isFavorite: !pepper.isFavorite });
      $q.notify({
        color: 'positive',
        message: pepper.isFavorite ? 'Убрано из избранного' : 'Добавлено в избранное',
        icon: 'favorite',
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка обновления избранного',
      icon: 'error',
    });
  }
}

const editingPepper = ref<Pepper | null>(null);
const showEditDialog = ref(false);

function handleEdit(pepper: Pepper) {
  editingPepper.value = pepper;
  showEditDialog.value = true;
}

async function saveEdit(updates: Partial<Pepper>) {
  if (!editingPepper.value) return;

  try {
    await handleUpdate(editingPepper.value.id, updates);
    editingPepper.value = null;
    showEditDialog.value = false;
  } catch (error) {
    console.error('Error saving edit:', error);
  }
}

async function handleUpdate(pepperId: string, updates: Partial<Pepper>) {
  try {
    // Обновляем перец в Firestore напрямую
    await pepperFirestore.updatePepper(pepperId, updates);

    $q.notify({
      color: 'positive',
      message: 'Изменения сохранены',
      icon: 'check_circle',
    });
  } catch (error) {
    console.error('Error updating pepper:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка сохранения изменений',
      icon: 'error',
    });
  }
}
</script>

<style scoped>
.pepper-list-page {
  display: flex;
  flex-direction: column;
}

.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-action-btn {
  flex-shrink: 0;
}

.pepper-card-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pepper-card-wrapper :deep(.my-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

/* Улучшения для мобильных устройств */
@media (max-width: 599px) {
  .header-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .header-action-btn {
    width: 100%;
  }

  .pepper-card-wrapper :deep(.my-card) {
    margin-bottom: 1rem;
  }

  .pepper-card-wrapper :deep(.q-img) {
    height: 150px !important;
  }
}

/* Улучшения для планшетов */
@media (min-width: 600px) and (max-width: 1023px) {
  .pepper-card-wrapper :deep(.q-img) {
    height: 180px !important;
  }
}
</style>
