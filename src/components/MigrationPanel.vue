<template>
  <q-card class="migration-panel">
    <q-card-section>
      <div class="text-h6">Миграция данных</div>
      <div class="text-body2 q-mt-sm">
        Если ваши перцы не отображаются, возможно, они были созданы до добавления системы
        пользователей. Нажмите кнопку ниже, чтобы привязать существующие перцы к вашему аккаунту.
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        :loading="migrating"
        :disable="migrating"
        color="primary"
        @click="handleMigration"
        :label="migrating ? 'Миграция...' : 'Мигрировать перцы'"
      />
    </q-card-actions>

    <q-card-section v-if="migrationResult" class="q-pt-none">
      <q-banner :class="migrationResult.success ? 'bg-positive' : 'bg-negative'" class="text-white">
        {{ migrationResult.message }}
      </q-banner>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePepperFirestore } from 'src/stores/pepper-firestore';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const pepperStore = usePepperFirestore();

const migrating = ref(false);
const migrationResult = ref<{
  success: boolean;
  message: string;
} | null>(null);

const handleMigration = async () => {
  migrating.value = true;
  migrationResult.value = null;

  try {
    const migratedCount = await pepperStore.migrateExistingPeppers();

    if (migratedCount > 0) {
      migrationResult.value = {
        success: true,
        message: `Успешно мигрировано ${migratedCount} перцев! Теперь они привязаны к вашему аккаунту.`,
      };
      $q.notify({
        type: 'positive',
        message: `Мигрировано ${migratedCount} перцев`,
      });
    } else {
      migrationResult.value = {
        success: true,
        message: 'Нет перцев для миграции. Все ваши перцы уже привязаны к аккаунту.',
      };
    }
  } catch (error) {
    console.error('Migration error:', error);
    migrationResult.value = {
      success: false,
      message: `Ошибка миграции: ${(error as Error).message}`,
    };
    $q.notify({
      type: 'negative',
      message: 'Ошибка при миграции перцев',
    });
  } finally {
    migrating.value = false;
  }
};
</script>

<style scoped>
.migration-panel {
  max-width: 500px;
  margin: 0 auto;
}
</style>
