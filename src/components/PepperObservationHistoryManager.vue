<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-my-none">Дневник наблюдений</h6>
      <q-btn color="primary" icon="add" label="Добавить наблюдение" @click="showAddDialog = true" />
    </div>

    <div v-if="observationLog?.length" class="q-gutter-md">
      <q-card v-for="(entry, index) in observationLog" :key="index" class="q-mb-sm">
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
              <div v-if="entry.height" class="text-caption">Высота: {{ entry.height }} см</div>
              <div v-if="entry.leafCondition" class="text-caption">
                Состояние листьев: {{ entry.leafCondition }}
              </div>
              <div v-if="entry.note" class="text-caption">{{ entry.note }}</div>

              <!-- Проблемы растений -->
              <div v-if="entry.problems && entry.problems.length > 0" class="q-mt-sm">
                <div class="text-caption text-weight-medium">Проблемы:</div>
                <div class="row q-col-gutter-xs q-mt-xs">
                  <q-chip
                    v-for="problem in entry.problems"
                    :key="problem.id"
                    size="xs"
                    :color="getSeverityColor(problem.severity)"
                    text-color="white"
                    :label="problem.name"
                  />
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
      <q-icon name="visibility" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Дневник наблюдений пуст</div>
      <div class="text-body2 text-grey-5">Добавьте первое наблюдение</div>
    </div>

    <!-- Диалог добавления/редактирования -->
    <HistoryEntryDialog
      v-model="showAddDialog"
      type="observation"
      :entry="editingEntry || undefined"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Observation } from './models';
import type { PlantProblem } from 'stores/plant-problems-library';
import HistoryEntryDialog from './HistoryEntryDialog.vue';

interface Props {
  observationLog?: Observation[];
}

interface Emits {
  (e: 'update', history: Observation[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showAddDialog = ref(false);
const editingEntry = ref<Observation | null>(null);
const editingIndex = ref<number>(-1);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}

function getSeverityColor(severity: PlantProblem['severity']) {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple',
  };
  return colors[severity];
}

function editEntry(index: number) {
  editingEntry.value = props.observationLog?.[index] || null;
  editingIndex.value = index;
  showAddDialog.value = true;
}

function deleteEntry(index: number) {
  const history = [...(props.observationLog || [])];
  history.splice(index, 1);
  emit('update', history);
}

function handleSave(entry: Observation) {
  const history = [...(props.observationLog || [])];

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
