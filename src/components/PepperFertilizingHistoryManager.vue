<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-my-none">История удобрений</h6>
      <q-btn color="primary" icon="add" label="Добавить удобрение" @click="showAddDialog = true" />
    </div>

    <div v-if="fertilizingHistory?.length" class="q-gutter-md">
      <q-card v-for="(entry, index) in fertilizingHistory" :key="index" class="q-mb-sm">
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
              <div v-if="entry.note" class="text-caption">{{ entry.note }}</div>
              <div v-if="entry.grams" class="text-caption">Количество: {{ entry.grams }} г</div>
              <div v-if="entry.composition" class="text-caption">
                <div class="q-mt-xs">
                  <span class="text-weight-medium">Состав:</span>
                  <div class="row q-col-gutter-xs">
                    <q-chip
                      v-for="(value, element) in entry.composition"
                      :key="element"
                      size="xs"
                      color="blue-1"
                      text-color="blue-9"
                      :label="`${element}: ${value}%`"
                    />
                  </div>
                </div>
              </div>
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
      <q-icon name="eco" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">История удобрений пуста</div>
      <div class="text-body2 text-grey-5">Добавьте первое удобрение</div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <HistoryEntryDialog
      v-model="showAddDialog"
      type="fertilizing"
      :entry="editingEntry || undefined"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FertilizingEntry } from './models';
import HistoryEntryDialog from './HistoryEntryDialog.vue';

interface Props {
  fertilizingHistory?: FertilizingEntry[];
}

interface Emits {
  (e: 'update', history: FertilizingEntry[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showAddDialog = ref(false);
const editingEntry = ref<FertilizingEntry | null>(null);
const editingIndex = ref<number>(-1);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}

function editEntry(index: number) {
  editingEntry.value = props.fertilizingHistory?.[index] || null;
  editingIndex.value = index;
  showAddDialog.value = true;
}

function deleteEntry(index: number) {
  const history = [...(props.fertilizingHistory || [])];
  history.splice(index, 1);
  emit('update', history);
}

function handleSave(entry: FertilizingEntry) {
  const history = [...(props.fertilizingHistory || [])];

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
