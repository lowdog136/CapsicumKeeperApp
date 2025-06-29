<template>
  <q-page class="q-pa-md">
    <!-- Приветственный заголовок -->
    <div class="text-center q-mb-xl">
      <div class="row justify-center q-mb-md">
        <q-icon name="local_florist" size="80px" color="primary" />
      </div>
      <h2 class="q-my-none text-primary">CapsicumKeeper</h2>
      <p class="text-h6 text-grey-7 q-mt-sm">Ваш персональный помощник для выращивания перцев</p>
      <p class="text-body1 text-grey-6 q-mt-md">
        Отслеживайте рост, ведите дневник ухода и изучайте разнообразие сортов
      </p>
    </div>

    <!-- Загрузка авторизации -->
    <div v-if="userStore.loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md">Проверка авторизации...</div>
    </div>

    <!-- Не авторизован -->
    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="account_circle" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Добро пожаловать!</div>
      <div class="text-body2 text-grey-5 q-mt-sm q-mb-lg">
        Войдите в систему, чтобы начать отслеживать свои перцы
      </div>
      <div class="row justify-center q-gutter-md">
        <q-btn color="primary" icon="login" label="Войти" @click="showLoginDialog = true" />
        <q-btn
          color="secondary"
          icon="library_books"
          label="Библиотека сортов"
          @click="$router.push('/variety-library')"
        />
      </div>
    </div>

    <!-- Авторизован -->
    <div v-else>
      <!-- Краткая статистика -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="local_florist" size="48px" color="primary" />
              <div class="text-h4 q-mt-sm">{{ peppers.length }}</div>
              <div class="text-body2 text-grey-6">Ваших перцев</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="favorite" size="48px" color="red" />
              <div class="text-h4 q-mt-sm">{{ favoritePeppersCount }}</div>
              <div class="text-body2 text-grey-6">В избранном</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="eco" size="48px" color="green" />
              <div class="text-h4 q-mt-sm">{{ activePeppersCount }}</div>
              <div class="text-body2 text-grey-6">Активных</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="library_books" size="48px" color="blue" />
              <div class="text-h4 q-mt-sm">{{ varietiesCount }}</div>
              <div class="text-body2 text-grey-6">Сортов в библиотеке</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Быстрые действия -->
      <div class="row q-col-gutter-md q-mb-xl" v-if="userStore.user">
        <div class="col-12 col-md-6">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="list" size="48px" color="primary" />
              <div class="text-h6 q-mt-sm">Мои перцы</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Просмотрите и управляйте своими перцами
              </div>
              <q-btn
                color="primary"
                label="Перейти к списку"
                class="q-mt-md"
                @click="$router.push('/peppers')"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="add" size="48px" color="green" />
              <div class="text-h6 q-mt-sm">Добавить перец</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Добавьте новый перец в свою коллекцию
              </div>
              <q-btn
                color="green"
                label="Добавить"
                class="q-mt-md"
                @click="$router.push('/add-pepper')"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Дополнительные возможности -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="library_books" size="48px" color="primary" />
              <div class="text-h6 q-mt-sm">Библиотека сортов</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Изучите разнообразие сортов перцев со всего мира
              </div>
              <q-btn
                color="primary"
                label="Перейти в библиотеку"
                class="q-mt-md"
                @click="$router.push('/variety-library')"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4" v-if="userStore.user">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="favorite" size="48px" color="red" />
              <div class="text-h6 q-mt-sm">Избранные сорта</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Ваши любимые сорта для будущих посадок
              </div>
              <q-btn
                color="red"
                label="Посмотреть избранное"
                class="q-mt-md"
                @click="$router.push('/favorites')"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12" :class="userStore.user ? 'col-md-4' : 'col-md-8'">
          <q-card class="text-center">
            <q-card-section>
              <q-icon name="assignment" size="48px" color="orange" />
              <div class="text-h6 q-mt-sm">Дорожная карта</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Планы развития и новые функции приложения
              </div>
              <q-btn
                color="orange"
                label="Посмотреть планы"
                class="q-mt-md"
                @click="$router.push('/roadmap')"
              />
            </q-card-section>
          </q-card>
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
import { useVarietyLibraryStore } from 'stores/variety-library';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';

const pepperFirestore = usePepperFirestore();
const userStore = useUserStore();
const varietyStore = useVarietyLibraryStore();
const { peppers } = storeToRefs(pepperFirestore);
const { varieties } = storeToRefs(varietyStore);
const $q = useQuasar();
const $router = useRouter();

const showLoginDialog = ref(false);

// Вычисляемые свойства для статистики
const favoritePeppersCount = computed(() => peppers.value.filter((p) => p.isFavorite).length);

const activePeppersCount = computed(
  () => peppers.value.filter((p) => p.stage !== 'сбор урожая').length,
);

const varietiesCount = computed(() => varieties.value.length);

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
    await Promise.all([pepperFirestore.fetchPeppers(), varietyStore.loadVarieties()]);
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
</style>
