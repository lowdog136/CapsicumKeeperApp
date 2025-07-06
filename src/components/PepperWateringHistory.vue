<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-my-none">История полива</h6>
      <q-btn color="primary" icon="add" label="Добавить полив" @click="showAddDialog = true" />
    </div>

    <div v-if="wateringHistory?.length" class="q-gutter-md">
      <q-card v-for="(entry, index) in wateringHistory" :key="index" class="q-mb-sm">
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
              <div v-if="entry.volume" class="text-caption">Объем: {{ entry.volume }} мл</div>
            </div>
            <div class="row q-gutter-xs">
              <q-btn flat round icon="edit" size="sm" @click="editEntry(index)" />
              <q-btn
                flat
                round
                icon="delete"
                size="sm"
                color="negative"
                @click="deleteEntry(index)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="text-center q-pa-xl">
      <q-icon name="water_drop" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">История полива пуста</div>
      <div class="text-body2 text-grey-5">Добавьте первый полив</div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <HistoryEntryDialog
      v-model="showAddDialog"
      type="watering"
      :entry="editingEntry || undefined"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WateringEntry } from './models';
import HistoryEntryDialog from './HistoryEntryDialog.vue';

interface Props {
  wateringHistory?: WateringEntry[];
}

interface Emits {
  (e: 'update', history: WateringEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showAddDialog = ref(false);
const editingEntry = ref<WateringEntry | null>(null);
const editingIndex = ref<number>(-1);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}

function editEntry(index: number) {
  editingEntry.value = props.wateringHistory?.[index] || null;
  editingIndex.value = index;
  showAddDialog.value = true;
}

function deleteEntry(index: number) {
  const history = [...(props.wateringHistory || [])];
  history.splice(index, 1);
  emit('update', history);
}

function handleSave(entry: WateringEntry) {
  const history = [...(props.wateringHistory || [])];

  if (editingIndex.value >= 0) {
    // Редактирование
    history[editingIndex.value] = entry;
  } else {
    // Добавление
    history.push(entry);
  }

  emit('update', history);
  showAddDialog.value = false;
  editingEntry.value = null;
  editingIndex.value = -1;
}
</script>
