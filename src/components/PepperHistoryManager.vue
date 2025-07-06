<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 900px; max-width: 95vw; max-height: 90vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">История ухода за "{{ localPepper.name }}"</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto">
        <q-tabs
          v-model="activeTab"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="watering" icon="water_drop" label="Полив" />
          <q-tab name="fertilizing" icon="eco" label="Удобрения" />
          <q-tab name="treatment" icon="healing" label="Обработки" />
          <q-tab name="observation" icon="visibility" label="Наблюдения" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- Полив -->
          <q-tab-panel name="watering" class="q-pa-none">
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <h6 class="q-my-none">История полива</h6>
                <q-btn
                  color="primary"
                  icon="add"
                  label="Добавить полив"
                  @click="showAddWatering = true"
                />
              </div>

              <div v-if="localPepper.wateringHistory?.length" class="q-gutter-md">
                <q-card
                  v-for="(entry, index) in localPepper.wateringHistory"
                  :key="index"
                  class="q-mb-sm"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
                        <div v-if="entry.volume" class="text-caption">
                          Объем: {{ entry.volume }} мл
                        </div>
                      </div>
                      <div class="row q-gutter-xs">
                        <q-btn flat round icon="edit" size="sm" @click="editWatering(index)" />
                        <q-btn
                          flat
                          round
                          icon="delete"
                          size="sm"
                          color="negative"
                          @click="deleteWatering(index)"
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
            </div>
          </q-tab-panel>

          <!-- Удобрения -->
          <q-tab-panel name="fertilizing" class="q-pa-none">
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <h6 class="q-my-none">История удобрений</h6>
                <q-btn
                  color="primary"
                  icon="add"
                  label="Добавить удобрение"
                  @click="showAddFertilizing = true"
                />
              </div>

              <div v-if="localPepper.fertilizingHistory?.length" class="q-gutter-md">
                <q-card
                  v-for="(entry, index) in localPepper.fertilizingHistory"
                  :key="index"
                  class="q-mb-sm"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
                        <div v-if="entry.note" class="text-caption">{{ entry.note }}</div>
                        <div v-if="entry.grams" class="text-caption">
                          Количество: {{ entry.grams }} г
                        </div>
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
                        <q-btn flat round icon="edit" size="sm" @click="editFertilizing(index)" />
                        <q-btn
                          flat
                          round
                          icon="delete"
                          size="sm"
                          color="negative"
                          @click="deleteFertilizing(index)"
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
            </div>
          </q-tab-panel>

          <!-- Обработки -->
          <q-tab-panel name="treatment" class="q-pa-none">
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <h6 class="q-my-none">История обработок</h6>
                <q-btn
                  color="primary"
                  icon="add"
                  label="Добавить обработку"
                  @click="showAddTreatment = true"
                />
              </div>

              <div v-if="localPepper.treatmentHistory?.length" class="q-gutter-md">
                <q-card
                  v-for="(entry, index) in localPepper.treatmentHistory"
                  :key="index"
                  class="q-mb-sm"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
                        <div class="text-caption text-weight-medium">{{ entry.agent }}</div>
                        <div v-if="entry.volume" class="text-caption">
                          Объем: {{ entry.volume }} мл
                        </div>
                        <div v-if="entry.note" class="text-caption text-grey-6">
                          {{ entry.note }}
                        </div>
                      </div>
                      <div class="row q-gutter-xs">
                        <q-btn flat round icon="edit" size="sm" @click="editTreatment(index)" />
                        <q-btn
                          flat
                          round
                          icon="delete"
                          size="sm"
                          color="negative"
                          @click="deleteTreatment(index)"
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
            </div>
          </q-tab-panel>

          <!-- Наблюдения -->
          <q-tab-panel name="observation" class="q-pa-none">
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <h6 class="q-my-none">Дневник наблюдений</h6>
                <q-btn
                  color="primary"
                  icon="add"
                  label="Добавить наблюдение"
                  @click="showAddObservation = true"
                />
              </div>

              <div v-if="localPepper.observationLog?.length" class="q-gutter-md">
                <q-card
                  v-for="(entry, index) in localPepper.observationLog"
                  :key="index"
                  class="q-mb-sm"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
                        <div v-if="entry.height" class="text-caption">
                          Высота: {{ entry.height }} см
                        </div>
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
                        <q-btn flat round icon="edit" size="sm" @click="editObservation(index)" />
                        <q-btn
                          flat
                          round
                          icon="delete"
                          size="sm"
                          color="negative"
                          @click="deleteObservation(index)"
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
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- Диалоги добавления/редактирования -->
    <HistoryEntryDialog v-model="showAddWatering" type="watering" @save="addWatering" />

    <HistoryEntryDialog v-model="showAddFertilizing" type="fertilizing" @save="addFertilizing" />

    <HistoryEntryDialog v-model="showAddTreatment" type="treatment" @save="addTreatment" />

    <HistoryEntryDialog v-model="showAddObservation" type="observation" @save="addObservation" />

    <!-- Диалог редактирования -->
    <HistoryEntryDialog
      v-model="showEditDialog"
      :type="editingType"
      :entry="editingEntry"
      @save="handleUpdateEntry"
    />

    <!-- Диалог подтверждения удаления -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="red" text-color="white" />
          <span class="q-ml-sm">Вы уверены, что хотите удалить эту запись?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="red" @click="confirmDelete" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type {
  Pepper,
  WateringEntry,
  FertilizingEntry,
  TreatmentEntry,
  Observation,
} from './models';
import type { PlantProblem } from 'stores/plant-problems-library';
import HistoryEntryDialog from './HistoryEntryDialog.vue';

const props = defineProps<{
  modelValue: boolean;
  pepper: Pepper;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update', updates: Partial<Pepper>): void;
}>();

const $q = useQuasar();

// Локальное реактивное состояние, синхронизированное с props
const localPepper = ref<Pepper>({ ...props.pepper });

// Синхронизируем локальное состояние с props
watch(
  () => props.pepper,
  (newPepper) => {
    localPepper.value = { ...newPepper };
  },
  { deep: true },
);

// Состояние
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const activeTab = ref('watering');
const showAddWatering = ref(false);
const showAddFertilizing = ref(false);
const showAddTreatment = ref(false);
const showAddObservation = ref(false);
const showEditDialog = ref(false);
const showDeleteConfirm = ref(false);
const editingType = ref<'watering' | 'fertilizing' | 'treatment' | 'observation'>('watering');
const editingEntry = ref<any>(null);
const deletingInfo = ref<{ type: string; index: number } | null>(null);

// Методы
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

// Полив
function addWatering(entry: WateringEntry) {
  const history = [...(localPepper.value.wateringHistory || []), entry];
  localPepper.value.wateringHistory = history;
  emit('update', { wateringHistory: history });
  showAddWatering.value = false;
}

function editWatering(index: number) {
  editingType.value = 'watering';
  editingEntry.value = localPepper.value.wateringHistory?.[index];
  showEditDialog.value = true;
}

function deleteWatering(index: number) {
  deletingInfo.value = { type: 'watering', index };
  showDeleteConfirm.value = true;
}

// Удобрения
function addFertilizing(entry: FertilizingEntry) {
  const history = [...(localPepper.value.fertilizingHistory || []), entry];
  localPepper.value.fertilizingHistory = history;
  emit('update', { fertilizingHistory: history });
  showAddFertilizing.value = false;
}

function editFertilizing(index: number) {
  editingType.value = 'fertilizing';
  editingEntry.value = localPepper.value.fertilizingHistory?.[index];
  showEditDialog.value = true;
}

function deleteFertilizing(index: number) {
  deletingInfo.value = { type: 'fertilizing', index };
  showDeleteConfirm.value = true;
}

// Обработки
function addTreatment(entry: TreatmentEntry) {
  const history = [...(localPepper.value.treatmentHistory || []), entry];
  localPepper.value.treatmentHistory = history;
  emit('update', { treatmentHistory: history });
  showAddTreatment.value = false;
}

function editTreatment(index: number) {
  editingType.value = 'treatment';
  editingEntry.value = localPepper.value.treatmentHistory?.[index];
  showEditDialog.value = true;
}

function deleteTreatment(index: number) {
  deletingInfo.value = { type: 'treatment', index };
  showDeleteConfirm.value = true;
}

// Наблюдения
function addObservation(entry: Observation) {
  const history = [...(localPepper.value.observationLog || []), entry];
  localPepper.value.observationLog = history;
  emit('update', { observationLog: history });
  showAddObservation.value = false;
}

function editObservation(index: number) {
  editingType.value = 'observation';
  editingEntry.value = localPepper.value.observationLog?.[index];
  showEditDialog.value = true;
}

function deleteObservation(index: number) {
  deletingInfo.value = { type: 'observation', index };
  showDeleteConfirm.value = true;
}

// Общие методы для редактирования и удаления
function handleUpdateEntry(entry: any) {
  // Находим индекс редактируемой записи
  let editingIndex = -1;

  if (editingType.value === 'watering') {
    editingIndex =
      localPepper.value.wateringHistory?.findIndex((h) => h.date === editingEntry.value?.date) ??
      -1;
    if (editingIndex !== -1) {
      const history = [...(localPepper.value.wateringHistory || [])];
      history[editingIndex] = entry as WateringEntry;
      localPepper.value.wateringHistory = history;
      emit('update', { wateringHistory: history });
    }
  } else if (editingType.value === 'fertilizing') {
    editingIndex =
      localPepper.value.fertilizingHistory?.findIndex((h) => h.date === editingEntry.value?.date) ??
      -1;
    if (editingIndex !== -1) {
      const history = [...(localPepper.value.fertilizingHistory || [])];
      history[editingIndex] = entry as FertilizingEntry;
      localPepper.value.fertilizingHistory = history;
      emit('update', { fertilizingHistory: history });
    }
  } else if (editingType.value === 'treatment') {
    editingIndex =
      localPepper.value.treatmentHistory?.findIndex((h) => h.date === editingEntry.value?.date) ??
      -1;
    if (editingIndex !== -1) {
      const history = [...(localPepper.value.treatmentHistory || [])];
      history[editingIndex] = entry as TreatmentEntry;
      localPepper.value.treatmentHistory = history;
      emit('update', { treatmentHistory: history });
    }
  } else if (editingType.value === 'observation') {
    editingIndex =
      localPepper.value.observationLog?.findIndex((h) => h.date === editingEntry.value?.date) ?? -1;
    if (editingIndex !== -1) {
      const history = [...(localPepper.value.observationLog || [])];
      history[editingIndex] = entry as Observation;
      localPepper.value.observationLog = history;
      emit('update', { observationLog: history });
    }
  }

  if (editingIndex === -1) {
    console.warn('Could not find entry to update');
    return;
  }

  showEditDialog.value = false;
  editingEntry.value = null;
}

function confirmDelete() {
  if (!deletingInfo.value) return;

  const { type, index } = deletingInfo.value;

  if (type === 'watering') {
    const history = [...(localPepper.value.wateringHistory || [])];
    history.splice(index, 1);
    localPepper.value.wateringHistory = history;
    emit('update', { wateringHistory: history });
  } else if (type === 'fertilizing') {
    const history = [...(localPepper.value.fertilizingHistory || [])];
    history.splice(index, 1);
    localPepper.value.fertilizingHistory = history;
    emit('update', { fertilizingHistory: history });
  } else if (type === 'treatment') {
    const history = [...(localPepper.value.treatmentHistory || [])];
    history.splice(index, 1);
    localPepper.value.treatmentHistory = history;
    emit('update', { treatmentHistory: history });
  } else if (type === 'observation') {
    const history = [...(localPepper.value.observationLog || [])];
    history.splice(index, 1);
    localPepper.value.observationLog = history;
    emit('update', { observationLog: history });
  }

  showDeleteConfirm.value = false;
  deletingInfo.value = null;
}
</script>
