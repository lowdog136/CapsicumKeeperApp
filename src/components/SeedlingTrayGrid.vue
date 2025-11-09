<template>
  <div class="seedling-tray-grid-wrapper">
    <div
      class="seedling-tray-grid"
      :style="gridStyles"
    >
      <div
        v-for="cell in cells"
        :key="`${cell.row}-${cell.column}`"
        class="tray-cell"
      >
        <q-card
          flat
          bordered
          class="tray-cell-card"
          :class="{
            'tray-cell-card--occupied': !!cell.assignment,
            'tray-cell-card--highlighted': highlightPepperId && cell.assignment?.pepperId === highlightPepperId,
          }"
        >
          <q-card-section class="q-pa-sm column q-gutter-xs">
            <div class="row items-center justify-between text-caption text-grey-6">
              <span>R{{ cell.row }} · C{{ cell.column }}</span>
              <q-badge
                v-if="cell.assignment"
                color="secondary"
                text-color="white"
                dense
              >
                {{ cell.assignment.status === 'reserved' ? 'Резерв' : 'Занято' }}
              </q-badge>
            </div>

            <div v-if="cell.assignment" class="column q-gutter-xs">
              <div class="text-body2 text-weight-medium ellipsis">
                {{ cell.assignment.pepperName || 'Неизвестный перец' }}
              </div>
              <div v-if="cell.assignment.pepperVariety" class="text-caption text-grey-6 ellipsis">
                {{ cell.assignment.pepperVariety }}
              </div>
              <div class="text-caption text-grey-6">
                С {{ formatDate(cell.assignment.assignedAt) }}
              </div>
            </div>
            <div v-else class="column items-center justify-center q-gutter-xs text-caption text-grey-6">
              <q-icon name="crop_square" size="32px" color="grey-5" />
              Свободно
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions
            v-if="cell.assignment"
            align="between"
            class="q-pa-xs"
          >
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              icon="visibility"
              @click="emit('view-pepper', cell.assignment!.pepperId)"
            />
            <div class="row items-center q-gutter-xs">
              <q-btn
                flat
                dense
                size="sm"
                icon="swap_horiz"
                @click="emit('request-move', { row: cell.row, column: cell.column, assignment: cell.assignment })"
              />
              <q-btn
                flat
                dense
                size="sm"
                color="negative"
                icon="delete"
                @click="emit('clear-slot', { row: cell.row, column: cell.column, assignment: cell.assignment })"
              />
            </div>
          </q-card-actions>
          <q-card-actions
            v-else
            class="q-pa-xs"
            align="center"
          >
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              icon="add"
              label="Поместить"
              @click="emit('assign', { row: cell.row, column: cell.column })"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import type { SeedlingTray, SeedlingTraySlotAssignment } from 'stores/seedling-trays-firestore';

interface Props {
  tray: SeedlingTray;
  highlightPepperId?: string;
}

const props = defineProps<Props>();

const $q = useQuasar();

const emit = defineEmits<{
  (event: 'assign', payload: { row: number; column: number }): void;
  (
    event: 'view-pepper',
    pepperId: string,
  ): void;
  (
    event: 'request-move',
    payload: { row: number; column: number; assignment: SeedlingTraySlotAssignment },
  ): void;
  (
    event: 'clear-slot',
    payload: { row: number; column: number; assignment?: SeedlingTraySlotAssignment },
  ): void;
}>();

defineOptions({
  name: 'SeedlingTrayGrid',
});

const cells = computed(() => {
  const output: {
    row: number;
    column: number;
    assignment?: SeedlingTraySlotAssignment;
  }[] = [];

  for (let row = 1; row <= props.tray.rows; row += 1) {
    for (let column = 1; column <= props.tray.columns; column += 1) {
      const assignment = props.tray.slots.find(
        (slot) => slot.row === row && slot.column === column,
      );
      output.push({
        row,
        column,
        assignment,
      });
    }
  }
  return output;
});

const gridStyles = computed(() => ({
  '--tray-columns': props.tray.columns,
  '--tray-rows': props.tray.rows,
}));

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    if ($q?.date?.formatDate) {
      return $q.date.formatDate(date, 'DD.MM.YYYY');
    }
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    console.warn('[SeedlingTrayGrid] unable to format date', value, error);
    return '—';
  }
}
</script>

<style scoped>
.seedling-tray-grid-wrapper {
  width: 100%;
  overflow-x: auto;
}

.seedling-tray-grid {
  display: grid;
  grid-template-columns: repeat(var(--tray-columns), minmax(140px, 1fr));
  grid-auto-rows: 1fr;
  gap: 12px;
  padding: 8px 2px;
  min-width: max-content;
}

.tray-cell-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tray-cell-card--occupied {
  border: 1px solid rgba(var(--q-primary-rgb), 0.3);
  background: rgba(var(--q-primary-rgb), 0.04);
}

.tray-cell-card--highlighted {
  box-shadow: 0 0 0 2px rgba(var(--q-secondary-rgb), 0.6);
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .seedling-tray-grid {
    grid-template-columns: repeat(var(--tray-columns), minmax(120px, 1fr));
    gap: 8px;
  }
}
</style>


