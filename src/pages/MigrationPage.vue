<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <h4 class="q-my-none">Управление данными</h4>
      <p class="text-grey-6 q-mt-sm">Очистка тестовых данных и управление коллекцией перцев</p>
    </div>

    <!-- Проверка авторизации -->
    <div v-if="userStore.loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md">Проверка авторизации...</div>
    </div>

    <div v-else-if="!userStore.user" class="text-center q-pa-xl">
      <q-icon name="account_circle" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Требуется авторизация</div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        Для управления данными необходимо войти в систему
      </div>
    </div>

    <div v-else>
      <!-- Информация об очистке -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6">Очистка тестовых данных</div>
          <div class="text-body2 q-mt-sm">
            <p>
              Эта функция удалит ВСЕ перцы из базы данных. Используйте только для очистки тестовых
              данных.
            </p>
            <p><strong>Внимание!</strong> Это действие нельзя отменить!</p>
          </div>
        </q-card-section>
      </q-card>

      <!-- Кнопка очистки -->
      <div class="row justify-center">
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 text-center">Очистить все данные</div>
              <div class="text-body2 q-mt-sm text-center">Удалить все перцы из базы данных</div>
            </q-card-section>
            <q-card-actions align="center">
              <q-btn
                :loading="clearing"
                :disable="clearing"
                color="negative"
                icon="delete_forever"
                @click="handleClearAll"
                :label="clearing ? 'Очистка...' : 'Очистить все данные'"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Результат операции -->
      <div v-if="operationResult" class="q-mt-lg">
        <q-banner
          :class="operationResult.success ? 'bg-positive' : 'bg-negative'"
          class="text-white"
        >
          {{ operationResult.message }}
        </q-banner>
      </div>

      <!-- Кнопка возврата -->
      <div class="text-center q-mt-lg">
        <q-btn
          color="secondary"
          icon="arrow_back"
          label="Вернуться на главную"
          @click="$router.push('/')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePepperFirestore } from 'src/stores/pepper-firestore';
import { useUserStore } from 'src/stores/user-store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const $router = useRouter();
const pepperStore = usePepperFirestore();
const userStore = useUserStore();

const clearing = ref(false);
const operationResult = ref<{
  success: boolean;
  message: string;
} | null>(null);

const handleClearAll = async () => {
  // Запрашиваем подтверждение
  const confirmed = await $q.dialog({
    title: 'Подтверждение удаления',
    message:
      'Вы уверены, что хотите удалить ВСЕ перцы из базы данных? Это действие нельзя отменить!',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Удалить все',
      color: 'negative',
    },
  });

  if (!confirmed) return;

  clearing.value = true;
  operationResult.value = null;

  try {
    const deletedCount = await pepperStore.clearAllPeppers();

    operationResult.value = {
      success: true,
      message: `Успешно удалено ${deletedCount} перцев из базы данных.`,
    };
    $q.notify({
      type: 'positive',
      message: `Удалено ${deletedCount} перцев`,
    });
  } catch (error) {
    console.error('Clear error:', error);
    operationResult.value = {
      success: false,
      message: `Ошибка очистки: ${(error as Error).message}`,
    };
    $q.notify({
      type: 'negative',
      message: 'Ошибка при очистке данных',
    });
  } finally {
    clearing.value = false;
  }
};
</script>
