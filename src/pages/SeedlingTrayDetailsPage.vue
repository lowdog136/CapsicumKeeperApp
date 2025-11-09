<template>
  <q-page class="seedling-tray-details q-pa-md">
    <div class="page-header q-mb-md">
      <div class="row items-center q-gutter-sm">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="goBack"
        />
        <div>
          <div class="text-h5 q-mb-xs">
            {{ tray?.name || 'Кассета' }}
          </div>
          <div class="text-body2 text-grey-6">
            {{ trayMeta }}
          </div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          outline
          color="primary"
          icon="edit"
          label="Редактировать"
          @click="openEditDialog"
        />
        <q-btn
          outline
          color="negative"
          icon="delete"
          @click="confirmDelete"
        />
      </div>
    </div>

    <q-banner
      v-if="moveContext"
      class="bg-secondary text-white q-mb-md"
      dense
      rounded
    >
      Перемещение перца
      <strong>{{ moveContext.pepperName || moveContext.pepperId }}</strong>
      — выберите новую ячейку или отмените действие.
      <template #action>
        <q-btn flat dense label="Отменить" color="white" @click="cancelMove" />
      </template>
    </q-banner>

    <q-banner
      v-if="tray?.notes"
      class="bg-grey-2 text-grey-8 q-mb-md"
      dense
      rounded
    >
      {{ tray.notes }}
    </q-banner>

    <div v-if="!tray" class="column items-center q-gutter-sm q-mt-xl">
      <q-spinner color="primary" size="42px" />
      <div class="text-grey-6">Загружаем данные кассеты...</div>
    </div>

    <div v-else class="column q-gutter-lg">
      <SeedlingTrayGrid
        :tray="tray"
        :highlight-pepper-id="highlightedPepperId || undefined"
        @assign="handleAssignRequest"
        @view-pepper="openPepper"
        @clear-slot="handleClearSlot"
        @request-move="startMove"
      />

      <div class="row q-col-gutter-md wrap">
        <q-card class="col-12 col-md-4">
          <q-card-section class="text-subtitle1 text-weight-medium">
            Статистика кассеты
          </q-card-section>
          <q-separator />
          <q-card-section class="column q-gutter-sm">
            <div class="row items-center justify-between">
              <span>Размер</span>
              <span class="text-weight-medium">{{ tray.rows }} × {{ tray.columns }}</span>
            </div>
            <div class="row items-center justify-between">
              <span>Вместимость</span>
              <span class="text-weight-medium">{{ capacity }}</span>
            </div>
            <div class="row items-center justify-between">
              <span>Занятые ячейки</span>
              <span class="text-weight-medium">{{ occupiedCount }}</span>
            </div>
            <div class="row items-center justify-between">
              <span>Свободно</span>
              <span class="text-weight-medium">{{ capacity - occupiedCount }}</span>
            </div>
          </q-card-section>
        </q-card>
        <q-card v-if="tray.description" class="col-12 col-md-4">
          <q-card-section class="text-subtitle1 text-weight-medium">
            Описание
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-body2 text-grey-7">
              {{ tray.description }}
            </div>
          </q-card-section>
        </q-card>
        <q-card class="col-12 col-md-4">
          <q-card-section class="text-subtitle1 text-weight-medium">
            Действия
          </q-card-section>
          <q-separator />
          <q-card-section class="column q-gutter-sm">
            <q-btn
              color="primary"
              icon="add"
              label="Поместить перец"
              @click="openAssignDialogForFirstSlot"
            />
            <q-btn
              outline
              icon="list"
              label="Список перцев"
              @click="goToPeppers"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <SeedlingTrayFormDialog
      v-model="editDialogVisible"
      :tray="tray"
      :loading="actionInProgress"
      @save="handleEditSave"
    />

    <SeedlingSlotAssignDialog
      v-if="selectedSlot"
      v-model="assignDialogVisible"
      :tray-id="trayId"
      :slot="selectedSlot"
      :peppers="availablePeppers"
      :loading="actionInProgress"
      @assign="handleAssignFromDialog"
      @open-pepper="openPepper"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import SeedlingTrayGrid from 'components/SeedlingTrayGrid.vue';
import SeedlingTrayFormDialog from 'components/SeedlingTrayFormDialog.vue';
import SeedlingSlotAssignDialog from 'components/SeedlingSlotAssignDialog.vue';
import {
  useSeedlingTrayStore,
  type SeedlingTray,
  type SeedlingTraySlotAssignment,
} from 'stores/seedling-trays-firestore';
import { usePepperFirestore } from 'stores/pepper-firestore';
import type { Pepper } from 'components/models';

defineOptions({
  name: 'SeedlingTrayDetailsPage',
});

const route = useRoute();
const $router = useRouter();
const $q = useQuasar();

const trayStore = useSeedlingTrayStore();
const pepperStore = usePepperFirestore();

const trayId = computed(() => route.params.id as string);
const tray = computed(() => trayStore.getTrayById(trayId.value) || null);
const capacity = computed(() => (tray.value ? tray.value.rows * tray.value.columns : 0));
const occupiedCount = computed(() => tray.value?.slots.length ?? 0);
const slotMatrix = computed(() => trayStore.getSlotMatrix(trayId.value) ?? []);
const queryHighlight = computed(() =>
  typeof route.query.highlight === 'string' ? (route.query.highlight as string) : null,
);
const highlightedPepperId = computed(() => moveContext.value?.pepperId ?? queryHighlight.value);

const trayMeta = computed(() => {
  if (!tray.value) return '';
  const parts = [`${tray.value.rows} × ${tray.value.columns}`];
  if (tray.value.location) parts.push(tray.value.location);
  if (tray.value.color) parts.push(tray.value.color);
  return parts.join(' · ');
});

const editDialogVisible = ref(false);
const assignDialogVisible = ref(false);
const selectedSlot = ref<{ row: number; column: number } | null>(null);
const actionInProgress = ref(false);
const moveContext = ref<SeedlingTraySlotAssignment | null>(null);

const availablePeppers = computed<Pepper[]>(() => pepperStore.peppers);

onMounted(async () => {
  if (!tray.value) {
    await trayStore.fetchTrays();
  }
  await pepperStore.fetchPeppers();
  trayStore.subscribeTrays();
});

onBeforeUnmount(() => {
  trayStore.unsubscribeTrays();
});

watch(trayId, async (newId, oldId) => {
  if (newId !== oldId) {
    moveContext.value = null;
    selectedSlot.value = null;
    assignDialogVisible.value = false;
    if (!trayStore.getTrayById(newId)) {
      await trayStore.fetchTrays();
    }
  }
});

const goBack = () => {
  $router.back();
};

const openEditDialog = () => {
  editDialogVisible.value = true;
};

const handleEditSave = async (payload: any) => {
  if (!tray.value) return;

  try {
    actionInProgress.value = true;
    const { id, ...updates } = payload;
    await trayStore.updateTray(tray.value.id, updates);
    editDialogVisible.value = false;
    $q.notify({
      color: 'positive',
      message: 'Кассета обновлена',
      icon: 'check',
    });
  } catch (error: any) {
    console.error('[SeedlingTrayDetailsPage] update error:', error);
    $q.notify({
      color: 'negative',
      message: error.message || 'Не удалось обновить кассету',
      icon: 'error',
    });
  } finally {
    actionInProgress.value = false;
  }
};

const confirmDelete = () => {
  if (!tray.value) return;
  $q.dialog({
    title: 'Удаление кассеты',
    message: `Удалить кассету «${tray.value.name}»? Ячейки освободятся, растение останется в списке.`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Удалить',
    },
  }).onOk(async () => {
    try {
      actionInProgress.value = true;
      await trayStore.deleteTray(tray.value!.id);
      $q.notify({
        color: 'positive',
        message: 'Кассета удалена',
        icon: 'check',
      });
      goBack();
    } catch (error: any) {
      console.error('[SeedlingTrayDetailsPage] delete error:', error);
      $q.notify({
        color: 'negative',
        message: error.message || 'Не удалось удалить кассету',
        icon: 'error',
      });
    } finally {
      actionInProgress.value = false;
    }
  });
};

const openAssignDialogForFirstSlot = () => {
  if (!tray.value) return;
  const slot = slotMatrix.value.find((item) => item.status === 'empty');
  if (slot) {
    selectedSlot.value = { row: slot.row, column: slot.column };
    assignDialogVisible.value = true;
    return;
  }
  selectedSlot.value = { row: 1, column: 1 };
  assignDialogVisible.value = true;
};

const handleAssignRequest = async ({ row, column }: { row: number; column: number }) => {
  if (!tray.value) return;

  if (moveContext.value) {
    await assignPepper({
      pepperId: moveContext.value.pepperId,
      row,
      column,
      notes: moveContext.value.notes ?? null,
      pepperName: moveContext.value.pepperName,
      pepperVariety: moveContext.value.pepperVariety,
      status: moveContext.value.status,
      assignedAt: moveContext.value.assignedAt,
    });
    moveContext.value = null;
    return;
  }

  selectedSlot.value = { row, column };
  assignDialogVisible.value = true;
};

const handleAssignFromDialog = async ({
  pepperId,
  notes,
  row,
  column,
}: {
  pepperId: string;
  notes?: string | null;
  row: number;
  column: number;
}) => {
  const pepper = pepperStore.peppers.find((p) => p.id === pepperId);

  await assignPepper({
    pepperId,
    notes: notes ?? null,
    row,
    column,
    pepperName: pepper?.name,
    pepperVariety: pepper?.variety,
  });

  assignDialogVisible.value = false;
  selectedSlot.value = null;
};

const assignPepper = async (payload: {
  pepperId: string;
  notes: string | null;
  row: number;
  column: number;
  pepperName?: string;
  pepperVariety?: string;
  status?: SeedlingTraySlotAssignment['status'];
  assignedAt?: string;
}) => {
  try {
    actionInProgress.value = true;
    await trayStore.assignPepperToSlot({
      trayId: trayId.value,
      row: payload.row,
      column: payload.column,
      pepperId: payload.pepperId,
      pepperName: payload.pepperName,
      pepperVariety: payload.pepperVariety,
      notes: payload.notes,
      status: payload.status,
      assignedAt: payload.assignedAt,
    });
    $q.notify({
      color: 'positive',
      message: 'Росток размещён в кассете',
      icon: 'check',
    });
  } catch (error: any) {
    console.error('[SeedlingTrayDetailsPage] assign error:', error);
    $q.notify({
      color: 'negative',
      message: error.message || 'Не удалось разместить перец',
      icon: 'error',
    });
  } finally {
    actionInProgress.value = false;
  }
};

const handleClearSlot = ({ row, column, assignment }: { row: number; column: number; assignment?: SeedlingTraySlotAssignment }) => {
  if (!tray.value) return;
  const pepperName = assignment?.pepperName || assignment?.pepperId;

  $q.dialog({
    title: 'Освободить ячейку',
    message: pepperName
      ? `Убрать перец «${pepperName}» из ячейки R${row} · C${column}?`
      : `Освободить ячейку R${row} · C${column}?`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Освободить',
    },
  }).onOk(async () => {
    try {
      actionInProgress.value = true;
      await trayStore.clearSlot(trayId.value, row, column, assignment?.pepperId);
      $q.notify({
        color: 'positive',
        message: 'Ячейка освобождена',
        icon: 'check',
      });
    } catch (error: any) {
      console.error('[SeedlingTrayDetailsPage] clear error:', error);
      $q.notify({
        color: 'negative',
        message: error.message || 'Не удалось освободить ячейку',
        icon: 'error',
      });
    } finally {
      actionInProgress.value = false;
    }
  });
};

const openPepper = (pepperId: string) => {
  $router.push({ path: '/peppers', query: { focus: pepperId } });
};

const startMove = ({
  assignment,
}: {
  row: number;
  column: number;
  assignment: SeedlingTraySlotAssignment;
}) => {
  moveContext.value = assignment;
  $q.notify({
    color: 'info',
    message: 'Выберите новую ячейку для перемещения',
    icon: 'open_with',
  });
};

const cancelMove = () => {
  moveContext.value = null;
};

const goToPeppers = () => {
  $router.push('/peppers');
};
</script>

<style scoped>
.seedling-tray-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 600px) {
  .seedling-tray-details {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .row {
    justify-content: space-between;
  }
}
</style>


