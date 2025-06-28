<template>
  <q-page class="q-pa-md">
    <!-- Заголовок -->
    <div class="text-center q-mb-lg">
      <h4 class="q-my-none">Добро пожаловать в CapsicumKeeper</h4>
      <p class="text-grey-6 q-mt-sm">Отслеживайте рост ваших перцев и изучайте новые сорта</p>
    </div>

    <!-- Загрузка авторизации -->
    <div v-if="userStore.loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md">Проверка авторизации...</div>
    </div>

    <!-- Не авторизован -->
    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="account_circle" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Войдите в систему</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        Чтобы отслеживать свои перцы, необходимо авторизоваться
      </div>
      <div class="row justify-center q-mt-lg q-gutter-md">
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
        </div>
      </div>

      <!-- Список перцев -->
      <div v-else>
        <div class="row items-center justify-between q-mb-md">
          <h5 class="q-my-none">Ваши перцы ({{ peppers.length }})</h5>
          <q-btn
            color="primary"
            icon="add"
            label="Добавить перец"
            @click="$router.push('/add-pepper')"
          />
        </div>

        <div class="row q-gutter-md">
          <div
            v-for="pepper in pagedPeppers"
            :key="pepper.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <PepperCard
              :pepper="pepper"
              @update:stage="updateStage(pepper.id, $event)"
              @delete="handleDelete"
              @toggle-favorite="handleToggleFavorite"
            />
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

    <!-- Быстрые действия -->
    <div class="row q-col-gutter-md q-mt-xl">
      <div class="col-12 col-md-6">
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

      <div class="col-12 col-md-6">
        <q-card class="text-center">
          <q-card-section>
            <q-icon name="favorite" size="48px" color="red" />
            <div class="text-h6 q-mt-sm">Избранные сорта</div>
            <div class="text-body2 text-grey-6 q-mt-sm">Ваши любимые сорта для будущих посадок</div>
            <q-btn
              color="red"
              label="Посмотреть избранное"
              class="q-mt-md"
              @click="$router.push('/favorites')"
            />
          </q-card-section>
        </q-card>
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
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import PepperCard from 'components/PepperCard.vue';
import type { Pepper } from 'components/models';
import { ref, computed, onMounted, watch } from 'vue';

const pepperFirestore = usePepperFirestore();
const userStore = useUserStore();
const { peppers, loading, error } = storeToRefs(pepperFirestore);
const $q = useQuasar();
const $router = useRouter();

const page = ref(1);
const showLoginDialog = ref(false);
const perPage = 8;

const pageCount = computed(() => Math.ceil(peppers.value.length / perPage));
const pagedPeppers = computed(() => {
  const start = (page.value - 1) * perPage;
  return peppers.value.slice(start, start + perPage);
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

function login() {
  showLoginDialog.value = false;
  // Здесь можно добавить логику входа
  $q.notify({
    color: 'info',
    message: 'Используйте кнопку входа в меню',
    icon: 'info',
  });
}

async function updateStage(id: string, newStage: Pepper['stage']) {
  try {
    await pepperFirestore.updatePepper(id, { stage: newStage });
    $q.notify({
      color: 'positive',
      message: 'Стадия роста обновлена',
      icon: 'check_circle',
    });
  } catch (error) {
    console.error('Error updating stage:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка обновления стадии',
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
</script>
