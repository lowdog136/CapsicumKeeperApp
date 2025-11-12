<template>
  <q-dialog v-model="model">
    <q-card style="width: min(960px, 96vw); max-width: 96vw;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Применить полив</div>
          <div class="text-subtitle2 text-grey-6">
            Распределите объём раствора между выбранными растениями
          </div>
        </div>
        <q-btn flat dense round icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section class="column q-gutter-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              :model-value="batch?.name || '—'"
              label="Замес"
              outlined
              dense
              readonly
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              :model-value="batch ? `${batch.remainingVolumeMl} мл` : '—'"
              label="Остаток раствора"
              outlined
              dense
              readonly
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="form.appliedAt"
              label="Дата полива"
              outlined
              dense
              mask="####-##-##T##:##"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="appliedDate" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <div class="row items-center justify-between">
          <div class="text-subtitle1">Растения к поливу</div>
          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              icon="add"
              label="Добавить растения"
              dense
              @click="showAddPeppers = true"
            />
            <q-btn
              outline
              color="primary"
              icon="autorenew"
              label="Распределить поровну"
              dense
              @click="distributeEvenly"
            />
          </div>
        </div>

        <div v-if="editableTargets.length === 0" class="text-grey-6">
          Добавьте растения, чтобы продолжить.
        </div>

        <q-table
          v-else
          flat
          dense
          :rows="editableTargets"
          :columns="columns"
          row-key="pepperId"
          hide-pagination
          hide-bottom
          :rows-per-page-options="[0]"
        >
          <template #body-cell-volumeMl="propsSlot">
            <q-input
              v-model.number="propsSlot.row.volumeMl"
              type="number"
              dense
              outlined
              min="0"
              step="10"
              :suffix="'мл'"
            />
          </template>
          <template #body-cell-actions="propsSlot">
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="removeTarget(propsSlot.row.pepperId)"
            />
          </template>
        </q-table>

        <div class="row q-gutter-sm">
          <q-input
            v-model="form.notes"
            label="Комментарий"
            outlined
            dense
            class="col"
            type="textarea"
            autogrow
            :max-length="300"
          />
        </div>

        <div class="summary-box">
          <div>Итого объём: <strong>{{ totalVolumeMl }} мл</strong></div>
          <div>
            Остаток после полива:
            <strong>{{ remainingAfterWatering }} мл</strong>
          </div>
          <div class="text-caption text-grey-6">
            Нельзя превысить доступный объём раствора.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Отмена" color="grey" @click="close" />
        <q-btn
          color="primary"
          label="Зафиксировать полив"
          :disable="!canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showAddPeppers">
    <q-card style="width: min(720px, 96vw); max-width: 96vw;">
      <q-card-section class="text-h6">Выбор растений</q-card-section>
      <q-card-section class="column q-gutter-sm" style="max-height: 60vh;">
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Поиск по названию, сорту или описанию"
          clearable
          debounce="200"
        />
        <q-list bordered separator class="rounded-borders">
          <template v-if="filteredPeppers.length === 0">
            <q-item>
              <q-item-section>
                <div class="text-grey-6">Нет перцев, удовлетворяющих запросу.</div>
              </q-item-section>
            </q-item>
          </template>
          <q-item
            v-for="pepper in filteredPeppers"
            :key="pepper.id"
            clickable
            @click="togglePepperSelection(pepper.id)"
          >
            <q-item-section avatar>
              <q-checkbox v-model="selectedPepperIds" :val="pepper.id" dense />
            </q-item-section>
            <q-item-section>
              <div class="text-body1">{{ pepper.name }}</div>
              <div class="text-caption text-grey-6">
                {{ pepper.variety }} · {{ pepper.stage }}
              </div>
            </q-item-section>
            <q-item-section side v-if="pepper.seedlingSlot">
              <q-chip dense size="sm" color="primary" text-color="white">
                {{ pepper.seedlingSlot.trayName || 'Кассета' }} · R{{ pepper.seedlingSlot.row }}
                · C{{ pepper.seedlingSlot.column }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Отмена" color="grey" @click="showAddPeppers = false" />
        <q-btn color="primary" label="Добавить выбранные" @click="applySelectedPeppers" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import type { Pepper, WateringBatch, WateringBatchTarget } from 'components/models';

interface Props {
  modelValue: boolean;
  batch: WateringBatch | null;
  peppers: Pepper[];
  submitting?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (
    event: 'submit',
    payload: {
      batchId: string;
      targets: { pepperId: string; volumeMl: number; seedlingSlot?: WateringBatchTarget['seedlingSlot'] }[];
      notes?: string | null;
      appliedAt?: string | null;
    },
  ): void;
  (event: 'cancel'): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const $q = useQuasar();

interface TargetRow {
  pepperId: string;
  name: string;
  variety: string;
  stage: string;
  seedlingSlot?: WateringBatchTarget['seedlingSlot'];
  volumeMl: number;
}

const editableTargets = reactive<TargetRow[]>([]);

const columns: QTableColumn<TargetRow>[] = [
  { name: 'name', label: 'Растение', field: 'name', align: 'left' },
  { name: 'variety', label: 'Сорт / стадия', field: (row) => `${row.variety} · ${row.stage}` },
  { name: 'volumeMl', label: 'Объём (мл)', field: 'volumeMl', align: 'left' },
  { name: 'actions', label: '', field: 'pepperId', align: 'right' },
];

const nowIso = () => new Date().toISOString().slice(0, 16);

const form = reactive({
  appliedAt: nowIso(),
  notes: '',
});

const appliedDate = computed({
  get: () => form.appliedAt?.split('T')[0] || '',
  set: (value: string) => {
    if (!value) return;
    const time = form.appliedAt?.split('T')[1] || '08:00';
    form.appliedAt = `${value}T${time}`;
  },
});

const totalVolumeMl = computed(() =>
  Number(
    editableTargets
      .reduce((sum, item) => sum + (item.volumeMl || 0), 0)
      .toFixed(1),
  ),
);

const remainingAfterWatering = computed(() => {
  if (!props.batch) return 0;
  return Math.max(props.batch.remainingVolumeMl - totalVolumeMl.value, 0).toFixed(1);
});

const canSubmit = computed(() => {
  if (!props.batch) return false;
  if (!editableTargets.length) return false;
  return totalVolumeMl.value <= props.batch.remainingVolumeMl + 1e-6 && totalVolumeMl.value > 0;
});

const search = ref('');
const selectedPepperIds = ref<string[]>([]);
const showAddPeppers = ref(false);

const filteredPeppers = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.peppers;
  return props.peppers.filter((pepper) => {
    const text = `${pepper.name} ${pepper.variety} ${pepper.description ?? ''}`.toLowerCase();
    return text.includes(query);
  });
});

const initTargetsFromBatch = (batch: WateringBatch | null | undefined) => {
  editableTargets.splice(0, editableTargets.length);
  if (!batch) return;
  const fraction =
    batch.targetPlants.length > 0 ? batch.remainingVolumeMl / batch.targetPlants.length : 0;
  batch.targetPlants.forEach((target) => {
    const pepper = props.peppers.find((item) => item.id === target.pepperId);
    if (!pepper) return;
    editableTargets.push({
      pepperId: pepper.id,
      name: pepper.name,
      variety: pepper.variety,
      stage: pepper.stage,
      seedlingSlot: target.seedlingSlot ?? (pepper.seedlingSlot
        ? {
            trayId: pepper.seedlingSlot.trayId,
            row: pepper.seedlingSlot.row,
            column: pepper.seedlingSlot.column,
          }
        : undefined),
      volumeMl: target.plannedVolumeMl ?? Math.round(fraction),
    });
  });
};

watch(
  () => props.batch,
  (batch) => {
    if (model.value) {
      initTargetsFromBatch(batch);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      initTargetsFromBatch(props.batch);
      form.appliedAt = nowIso();
      form.notes = '';
    } else {
      editableTargets.splice(0, editableTargets.length);
    }
  },
);

const distributeEvenly = () => {
  if (!props.batch || editableTargets.length === 0) return;
  const perPepper = props.batch.remainingVolumeMl / editableTargets.length;
  editableTargets.forEach((row) => {
    row.volumeMl = Number(perPepper.toFixed(1));
  });
};

const togglePepperSelection = (pepperId: string) => {
  const list = selectedPepperIds.value;
  const index = list.indexOf(pepperId);
  if (index === -1) {
    list.push(pepperId);
  } else {
    list.splice(index, 1);
  }
};

const applySelectedPeppers = () => {
  if (!selectedPepperIds.value.length) {
    $q.notify({
      type: 'warning',
      message: 'Выберите растения',
    });
    return;
  }
  selectedPepperIds.value.forEach((pepperId) => {
    if (editableTargets.find((item) => item.pepperId === pepperId)) {
      return;
    }
    const pepper = props.peppers.find((item) => item.id === pepperId);
    if (!pepper) return;
    editableTargets.push({
      pepperId: pepper.id,
      name: pepper.name,
      variety: pepper.variety,
      stage: pepper.stage,
      seedlingSlot: pepper.seedlingSlot
        ? {
            trayId: pepper.seedlingSlot.trayId,
            row: pepper.seedlingSlot.row,
            column: pepper.seedlingSlot.column,
          }
        : undefined,
      volumeMl:
        editableTargets.length > 0
          ? Number((props.batch?.remainingVolumeMl ?? 0) / editableTargets.length)
          : 0,
    });
  });
  selectedPepperIds.value = [];
  showAddPeppers.value = false;
};

const removeTarget = (pepperId: string) => {
  const index = editableTargets.findIndex((item) => item.pepperId === pepperId);
  if (index !== -1) {
    editableTargets.splice(index, 1);
  }
};

function close() {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleSubmit() {
  if (!props.batch) return;
  if (!canSubmit.value) {
    $q.notify({
      type: 'warning',
      message: 'Объём превышает остаток раствора или не выбран ни один перец',
    });
    return;
  }
  emit('submit', {
    batchId: props.batch.id,
    appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
    notes: form.notes || null,
    targets: editableTargets.map((item) => ({
      pepperId: item.pepperId,
      volumeMl: Number(item.volumeMl) || 0,
      seedlingSlot: item.seedlingSlot,
    })),
  });
}
</script>

<style scoped>
.summary-box {
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

