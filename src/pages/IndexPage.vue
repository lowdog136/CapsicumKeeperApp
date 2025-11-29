<template>
  <q-page class="index-page q-pa-md">
    <div class="index-wrapper">
      <!-- Приветственный заголовок -->
      <div class="index-hero text-center">
        <div class="row justify-center q-mb-md">
          <q-icon name="local_florist" :size="heroIconSize" color="primary" />
          <div class="build-marker text-grey-5">Build: mobile v3.2.0-rc.4 (2025-11-08)</div>
        </div>
        <h2 class="q-my-none text-primary">CapsicumKeeper</h2>
        <p class="text-h6 text-grey-7 q-mt-sm hero-subtitle">
          Ваш персональный помощник для выращивания перцев
        </p>
        <p class="text-body1 text-grey-6 q-mt-md hero-description">
          Отслеживайте рост, ведите дневник ухода и изучайте разнообразие сортов
        </p>
      </div>

      <div class="index-main">
        <!-- Загрузка авторизации -->
        <div v-if="userStore.loading" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="50px" />
          <div class="q-mt-md">Проверка авторизации...</div>
        </div>

        <!-- Не авторизован -->
        <div v-else-if="!userStore.user" class="guest-block">
          <div class="guest-icon">
            <q-icon name="account_circle" :size="guestIconSize" color="grey-4" />
          </div>
          <div class="guest-text text-grey-6">Добро пожаловать!</div>
          <div class="guest-subtext text-grey-5">
            Войдите в систему, чтобы начать отслеживать свои перцы
          </div>
          <div class="guest-actions"></div>
        </div>

        <!-- Авторизован -->
        <div v-else>
      <!-- Краткая статистика -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="eco" size="48px" color="green" />
              <div class="text-h4 q-mt-sm">{{ activePeppersCount }}</div>
              <div class="text-body2 text-grey-6">Растет перцев</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="favorite" size="48px" color="red" />
              <div class="text-h4 q-mt-sm">{{ favoritePeppersCount }}</div>
              <div class="text-body2 text-grey-6">В избранном</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="library_books" size="48px" color="blue" />
              <div class="text-h4 q-mt-sm">{{ varietiesCount }}</div>
              <div class="text-body2 text-grey-6">Сортов в библиотеке</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Требуют внимания -->
      <div v-if="peppersRequiringAttention.length > 0" class="q-mb-xl">
        <div class="text-h6 q-mb-md">Требуют внимания</div>
        <q-card>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div
                v-for="item in peppersRequiringAttention"
                :key="item.pepper.id"
                class="col-12 col-sm-6 col-md-4"
              >
                <q-card flat bordered>
                  <q-card-section>
                    <div class="row items-center q-gutter-sm">
                      <q-icon
                        :name="getAttentionIcon(item)"
                        :color="getAttentionColor(item)"
                        size="32px"
                      />
                      <div class="col">
                        <div class="text-subtitle2">{{ item.pepper.name }}</div>
                        <div class="text-caption text-grey-6">{{ item.pepper.variety }}</div>
                        <div class="text-caption text-grey-7 q-mt-xs">
                          {{ item.reason }}
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    </div>
  </div>

    <!-- Диалог входа -->
    <q-dialog v-model="showLoginDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Вход в систему</div>
        </q-card-section>
        <q-card-section>
          <p>Для использования приложения необходимо войти в систему.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Войти" color="primary" @click="login" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { usePepperFirestore } from 'stores/pepper-firestore';
import { useUserStore } from 'stores/user-store';
import { useVarietyLibraryV2Store } from 'stores/variety-library-v2';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';
import type { Pepper } from 'src/components/models';
import { getCurrentSoilNutrients } from 'src/utils/nutrient-absorption';

const pepperFirestore = usePepperFirestore();
const userStore = useUserStore();
const varietyStore = useVarietyLibraryV2Store();
const { peppers } = storeToRefs(pepperFirestore);
const $q = useQuasar();
const $router = useRouter();

const showLoginDialog = ref(false);
const heroIconSize = computed(() => ($q.screen.lt.sm ? '48px' : '80px'));
const guestIconSize = computed(() => ($q.screen.lt.sm ? '72px' : '100px'));

// Вычисляемые свойства для статистики
const activePeppersCount = computed(
  () => peppers.value.filter((p) => p.stage !== 'сбор урожая').length,
);

const favoritePeppersCount = computed(() => peppers.value.filter((p) => p.isFavorite).length);

const varietiesCount = computed(() => {
  // Используем allItems если они загружены, иначе items (пагинированные)
  if (varietyStore.allItems.length > 0) {
    return varietyStore.allItems.length;
  }
  // Если allItems не загружены, используем totalCount если он установлен, иначе items.length
  return varietyStore.totalCount > 0 ? varietyStore.totalCount : varietyStore.items.length;
});


// Пороговые значения для питательных веществ (в граммах)
const NUTRIENT_THRESHOLDS = {
  N: 2.0,  // Азот
  P: 1.5,  // Фосфор
  K: 2.0,  // Калий
  Ca: 1.0, // Кальций
  Mg: 0.5, // Магний
  S: 0.5,  // Сера
};

// Интерфейс для перцев, требующих внимания
interface PepperRequiringAttention {
  pepper: Pepper;
  reason: string;
}

// Перцы, требующие внимания
const peppersRequiringAttention = computed<PepperRequiringAttention[]>(() => {
  const now = new Date();
  const attentionPeppers: PepperRequiringAttention[] = [];

  for (const pepper of peppers.value) {
    // Пропускаем перцы на стадии "сбор урожая"
    if (pepper.stage === 'сбор урожая') continue;

    const reasons: string[] = [];

    // Проверка полива по расписанию
    if (pepper.wateringSchedule?.minIntervalHours) {
      const lastWateredAt = pepper.soilNutrients?.lastWateredAt
        ? new Date(pepper.soilNutrients.lastWateredAt)
        : pepper.wateringHistory && pepper.wateringHistory.length > 0
          ? new Date(pepper.wateringHistory[pepper.wateringHistory.length - 1].date)
          : null;

      if (lastWateredAt) {
        const hoursSinceWatering = (now.getTime() - lastWateredAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceWatering >= pepper.wateringSchedule.minIntervalHours) {
          reasons.push('Требуется полив');
        }
      } else if (pepper.wateringSchedule.minIntervalHours > 0) {
        // Если никогда не поливали, но есть расписание - тоже требует внимания
        reasons.push('Требуется полив');
      }
    }

    // Проверка низкого уровня питательных веществ
    if (pepper.soilNutrients) {
      const currentNutrients = getCurrentSoilNutrients(pepper.soilNutrients, pepper.stage);
      const lowElements: string[] = [];

      // Проверяем макроэлементы
      const macroElements: Array<keyof typeof NUTRIENT_THRESHOLDS> = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];
      for (const element of macroElements) {
        const current = currentNutrients[element] ?? 0;
        const threshold = NUTRIENT_THRESHOLDS[element];
        if (current < threshold) {
          const elementNames: Record<string, string> = {
            N: 'азот',
            P: 'фосфор',
            K: 'калий',
            Ca: 'кальций',
            Mg: 'магний',
            S: 'сера',
          };
          lowElements.push(elementNames[element] || element);
        }
      }

      if (lowElements.length > 0) {
        reasons.push(`Низкий уровень: ${lowElements.join(', ')}`);
      }
    }

    if (reasons.length > 0) {
      attentionPeppers.push({
        pepper,
        reason: reasons.join('; '),
      });
    }
  }

  return attentionPeppers;
});

// Вспомогательные функции для отображения
function getAttentionIcon(item: PepperRequiringAttention): string {
  if (item.reason.includes('полив')) {
    return 'water_drop';
  }
  if (item.reason.includes('Низкий уровень')) {
    return 'science';
  }
  return 'warning';
}

function getAttentionColor(item: PepperRequiringAttention): string {
  if (item.reason.includes('полив')) {
    return 'blue';
  }
  if (item.reason.includes('Низкий уровень')) {
    return 'orange';
  }
  return 'warning';
}

// Загружаем данные при изменении авторизации
watch(
  () => userStore.user,
  (newUser) => {
    if (newUser) {
      loadData();
    }
  },
);

onMounted(async () => {
  // Ждем завершения проверки авторизации
  if (!userStore.loading && userStore.user) {
    await loadData();
  }
});

async function loadData() {
  try {
    await Promise.all([
      pepperFirestore.fetchPeppers(),
      varietyStore.fetchFirstPage(),
    ]);
    // Пытаемся загрузить все элементы для точного подсчета (в фоне, не блокируя)
    if (varietyStore.allItems.length === 0) {
      varietyStore.fetchAllItems().catch(() => {
        // Если не удалось загрузить все, используем пагинированные данные
      });
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function login() {
  showLoginDialog.value = false;
  $q.notify({
    color: 'info',
    message: 'Используйте кнопку входа в меню',
    icon: 'info',
  });
}
</script>

<style scoped>
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

/* Более темные кнопки на главной странице */
.darker-primary-btn {
  background-color: #61892f !important;
  color: #ffffff !important;
  
  &:hover {
    background-color: #557a28 !important;
    opacity: 1;
  }
  
  &:active {
    background-color: #4a6b22 !important;
  }
}

.index-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 16px 32px;
}

.index-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.index-hero {
  padding: 28px 0 12px;
}

.index-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 8px;
}

.guest-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 0 32px;
}

.guest-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 12px;
}

.guest-subtext {
  margin-top: 8px;
  margin-bottom: 24px;
  line-height: 1.6;
}

.build-marker {
  margin-top: 24px;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
}

.guest-actions {
  margin-top: auto;
}

@media (min-width: 600px) {
  .index-page {
    padding: 24px 32px 48px;
  }

  .guest-actions {
    margin-top: 48px;
  }
}

.index-hero h2 {
  font-size: clamp(2rem, 7vw, 3rem);
  line-height: 1.1;
}

.index-hero .hero-subtitle {
  font-size: clamp(1.05rem, 4vw, 1.5rem);
}

.index-hero .hero-description {
  font-size: clamp(0.95rem, 3.8vw, 1.1rem);
}

@media (max-width: 599px) {
  .index-hero {
    padding: 48px 0 12px;
  }

  .index-main {
    padding-top: 24px;
  }

  .guest-block {
    padding-top: 40px;
  }

  .index-hero .row {
    margin-bottom: 12px;
  }

  .index-hero h2 {
    font-size: 1.85rem;
  }

  .index-hero .hero-subtitle {
    font-size: 1.05rem;
  }

  .index-hero .hero-description {
    font-size: 0.95rem;
  }

  .guest-action-btn {
    min-height: 54px;
    font-size: 1rem;
  }
}
</style>
