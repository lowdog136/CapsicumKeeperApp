<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-my-none">История обработок</h6>
      <q-btn color="primary" icon="add" label="Добавить обработку" @click="showAddDialog = true" />
    </div>

    <div v-if="treatmentHistory?.length" class="q-gutter-md">
      <q-card v-for="(entry, index) in treatmentHistory" :key="index" class="q-mb-sm">
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
              <div class="text-caption text-weight-medium">{{ entry.agent }}</div>
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
      <q-icon name="healing" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">История обработок пуста</div>
      <div class="text-body2 text-grey-5">Добавьте первую обработку</div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <HistoryEntryDialog
      v-model="showAddDialog"
      type="treatment"
      :entry="editingEntry || undefined"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TreatmentEntry } from './models';
import HistoryEntryDialog from './HistoryEntryDialog.vue';

interface Props {
  treatmentHistory?: TreatmentEntry[];
}

interface Emits {
  (e: 'update', history: TreatmentEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showAddDialog = ref(false);
const editingEntry = ref<TreatmentEntry | null>(null);
const editingIndex = ref<number>(-1);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}

function editEntry(index: number) {
  editingEntry.value = props.treatmentHistory?.[index] || null;
  editingIndex.value = index;
  showAddDialog.value = true;
}

function deleteEntry(index: number) {
  const history = [...(props.treatmentHistory || [])];
  history.splice(index, 1);
  emit('update', history);
}

function handleSave(entry: TreatmentEntry) {
  const history = [...(props.treatmentHistory || [])];

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
