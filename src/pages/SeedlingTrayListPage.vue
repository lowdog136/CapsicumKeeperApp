<template>
  <q-page class="seedling-tray-page q-pa-md">
    <div class="page-header q-mb-lg">
      <div class="header-info">
        <h4 class="q-my-none">Кассеты для рассады</h4>
        <p class="text-grey-7 q-mt-xs">
          Организуйте рассаду по кассетам, контролируйте свободные ячейки и распределение растений.
        </p>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-auto">
            <q-badge color="primary" outline>
              Всего кассет: {{ trays.length }}
            </q-badge>
          </div>
          <div class="col-auto" v-if="totalCapacity > 0">
            <q-badge color="secondary" outline>
              Заполнено {{ totalOccupied }} из {{ totalCapacity }} ячеек
            </q-badge>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <q-btn
          color="primary"
          icon="add"
          label="Создать кассету"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <div v-if="loading" class="row q-col-gutter-md q-mt-md">
      <div v-for="n in 3" :key="n" class="col-12 col-md-4">
        <q-skeleton type="rect" height="220px" class="rounded-borders" />
      </div>
    </div>

    <div v-else-if="trays.length === 0" class="empty-state column items-center q-gutter-sm">
      <q-icon name="grid_view" size="64px" color="grey-5" />
      <div class="text-subtitle1 text-grey-7 text-center">
        Пока нет кассет для рассады
      </div>
      <div class="text-body2 text-grey-6 text-center">
        Нажмите «Создать кассету», чтобы добавить первую и начать размещать ростки.
      </div>
      <q-btn color="primary" icon="add" label="Создать кассету" @click="openCreateDialog" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="tray in trays"
        :key="tray.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <SeedlingTrayCard
          :tray="tray"
          @view="openTray"
          @edit="openEditDialog(tray)"
          @delete="confirmDelete(tray)"
        />
      </div>
    </div>

    <SeedlingTrayFormDialog
      v-model="formDialogVisible"
      :tray="editingTray"
      :loading="actionInProgress"
      @save="handleSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useSeedlingTrayStore, type SeedlingTray } from 'stores/seedling-trays-firestore';
import SeedlingTrayCard from 'components/SeedlingTrayCard.vue';
import SeedlingTrayFormDialog from 'components/SeedlingTrayFormDialog.vue';
import { useNotifications } from 'src/composables/useNotifications';
import { useErrorHandler } from 'src/composables/useErrorHandler';

defineOptions({
  name: 'SeedlingTrayListPage',
});

const $q = useQuasar();
const $router = useRouter();
const trayStore = useSeedlingTrayStore();

const formDialogVisible = ref(false);
const editingTray = ref<SeedlingTray | null>(null);
const actionInProgress = ref(false);

const trays = computed(() => trayStore.trays);
const loading = computed(() => trayStore.loading);

const totalCapacity = computed(() =>
  trays.value.reduce((acc, tray) => acc + tray.rows * tray.columns, 0),
);
const totalOccupied = computed(() =>
  trays.value.reduce((acc, tray) => acc + tray.slots.length, 0),
);

onMounted(async () => {
  await trayStore.fetchTrays();
  trayStore.subscribeTrays();
});

onBeforeUnmount(() => {
  trayStore.unsubscribeTrays();
});

const openCreateDialog = () => {
  editingTray.value = null;
  formDialogVisible.value = true;
};

const openEditDialog = (tray: SeedlingTray) => {
  editingTray.value = tray;
  formDialogVisible.value = true;
};

const openTray = (trayId: string) => {
  $router.push({ path: `/seedling-trays/${trayId}` });
};

const { success, error: showError } = useNotifications();
const { handleError } = useErrorHandler();

const handleSave = async (payload: any) => {
  try {
    actionInProgress.value = true;

    if (payload.id) {
      const { id, ...updates } = payload;
      await trayStore.updateTray(id, updates);
      success('Кассета обновлена');
    } else {
      await trayStore.createTray(payload);
      success('Кассета создана');
    }

    formDialogVisible.value = false;
  } catch (err: any) {
    handleError(err, 'Ошибка при сохранении кассеты');
  } finally {
    actionInProgress.value = false;
  }
};

const confirmDelete = (tray: SeedlingTray) => {
  $q.dialog({
    title: 'Удаление кассеты',
    message: `Удалить кассету «${tray.name}»? Ячейки освободятся, но привязанные растения останутся в списке.`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Удалить',
    },
  }).onOk(async () => {
    try {
      actionInProgress.value = true;
      await trayStore.deleteTray(tray.id);
      success('Кассета удалена');
    } catch (err: any) {
      handleError(err, 'Ошибка при удалении кассеты');
    } finally {
      actionInProgress.value = false;
    }
  });
};
</script>

<style scoped>
.seedling-tray-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-info {
  flex: 1 1 280px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  padding: 32px 0;
}

@media (max-width: 600px) {
  .seedling-tray-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .q-btn {
    width: 100%;
  }
}
</style>


