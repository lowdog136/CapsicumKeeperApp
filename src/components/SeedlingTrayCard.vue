<template>
  <q-card class="seedling-tray-card column">
    <q-card-section class="row items-start justify-between q-gutter-sm">
      <div class="column q-gutter-xs">
        <div class="text-subtitle1 text-weight-medium">
          {{ tray.name }}
        </div>
        <div class="row items-center q-gutter-sm text-caption text-grey-6">
          <q-chip
            dense
            color="primary"
            text-color="white"
            icon="grid_view"
            size="sm"
          >
            {{ tray.rows }} × {{ tray.columns }}
          </q-chip>
          <q-chip
            v-if="occupiedCount > 0"
            dense
            color="secondary"
            text-color="white"
            icon="eco"
            size="sm"
          >
            {{ occupiedCount }} / {{ capacity }}
          </q-chip>
        </div>
      </div>
      <div class="column items-end q-gutter-xs text-right">
        <q-badge v-if="tray.color" color="grey-4" text-color="grey-9" outline>
          {{ tray.color }}
        </q-badge>
        <q-badge v-if="tray.location" color="grey-3" text-color="grey-8" outline>
          {{ tray.location }}
        </q-badge>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none q-gutter-sm column">
      <div class="row items-center justify-between text-caption text-grey-7">
        <span v-if="occupiedCount > 0">Занято {{ occupiedCount }} из {{ capacity }}</span>
        <span v-else>Все {{ capacity }} ячеек свободны</span>
        <span>{{ percentOccupied }}%</span>
      </div>
      <q-linear-progress
        :value="occupiedCount / capacity"
        color="primary"
        track-color="grey-3"
        rounded
      />

      <div v-if="tray.notes" class="text-body2 text-grey-7 ellipsis-2-lines">
        {{ tray.notes }}
      </div>
      <div v-else-if="tray.description" class="text-body2 text-grey-7 ellipsis-2-lines">
        {{ tray.description }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="between" class="q-pa-md">
      <q-btn
        color="primary"
        outline
        icon="open_in_new"
        label="Открыть"
        @click="emit('view', tray.id)"
      />
      <div class="row items-center q-gutter-xs">
        <q-btn flat round dense icon="edit" @click="emit('edit', tray.id)" />
        <q-btn
          flat
          round
          dense
          icon="delete"
          color="negative"
          @click="emit('delete', tray.id)"
        />
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SeedlingTray } from 'stores/seedling-trays-firestore';

interface Props {
  tray: SeedlingTray;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'view', trayId: string): void;
  (event: 'edit', trayId: string): void;
  (event: 'delete', trayId: string): void;
}>();

const capacity = computed(() => props.tray.rows * props.tray.columns);
const occupiedCount = computed(() => props.tray.slots.length);
const percentOccupied = computed(() =>
  capacity.value > 0 ? Math.round((occupiedCount.value / capacity.value) * 100) : 0,
);
</script>

<style scoped>
.seedling-tray-card {
  height: 100%;
  display: flex;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


