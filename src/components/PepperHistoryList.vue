<template>
  <div>
    <div class="row items-center q-mb-xs">
      <div class="text-subtitle2">{{ title }}</div>
      <q-btn flat dense icon="add" size="sm" class="q-ml-sm" @click="openAddDialog" />
    </div>
    <q-list dense bordered>
      <q-item v-for="(item, idx) in items" :key="idx" class="q-item-hoverable">
        <q-item-section>
          <span v-if="props.type === 'watering'"
            >{{ (item as WateringEntry).date }} — {{ (item as WateringEntry).volume }} мл</span
          >
          <span v-else-if="props.type === 'fertilizing'">
            {{ (item as FertilizingEntry).date
            }}<span v-if="(item as FertilizingEntry).grams">
              — {{ (item as FertilizingEntry).grams }} г</span
            ><span v-if="(item as FertilizingEntry).note">
              — {{ (item as FertilizingEntry).note }}</span
            >
          </span>
          <span v-else-if="props.type === 'treatment'">
            {{ (item as TreatmentEntry).date }} — {{ (item as TreatmentEntry).agent
            }}<span v-if="(item as TreatmentEntry).volume">
              ({{ (item as TreatmentEntry).volume }} мл)</span
            >
          </span>
          <span v-else-if="props.type === 'observation'">
            {{ (item as Observation).date }}: {{ (item as Observation).leafCondition
            }}<span v-if="(item as Observation).height">
              ({{ (item as Observation).height }} см)</span
            >
          </span>
        </q-item-section>
        <q-item-section side>
          <q-btn flat dense icon="edit" size="sm" @click="$emit('edit', idx, item)" />
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            size="sm"
            @click="$emit('delete', idx, item)"
          />
        </q-item-section>
      </q-item>
      <q-item v-if="!items || !items.length">
        <q-item-section>Нет записей</q-item-section>
      </q-item>
    </q-list>
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ dialogTitle }}</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="form.date" label="Дата" type="date" dense outlined class="q-mb-sm" />
          <q-input
            v-if="props.type === 'watering'"
            v-model.number="(form as WateringEntry).volume"
            label="Объем (мл)"
            type="number"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'fertilizing'"
            v-model.number="(form as FertilizingEntry).grams"
            label="Граммы"
            type="number"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'fertilizing'"
            v-model="(form as FertilizingEntry).note"
            label="Комментарий"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'treatment'"
            v-model="(form as TreatmentEntry).agent"
            label="Чем"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'treatment'"
            v-model.number="(form as TreatmentEntry).volume"
            label="Объем (мл)"
            type="number"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'observation'"
            v-model="(form as Observation).leafCondition"
            label="Состояние листьев"
            dense
            outlined
          />
          <q-input
            v-if="props.type === 'observation'"
            v-model.number="(form as Observation).height"
            label="Высота (см)"
            type="number"
            dense
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup @click="closeDialog" />
          <q-btn flat label="Сохранить" color="positive" @click="saveDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WateringEntry, FertilizingEntry, TreatmentEntry, Observation } from './models';
const props = defineProps<{
  items: WateringEntry[] | FertilizingEntry[] | TreatmentEntry[] | Observation[];
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation';
}>();
const emit = defineEmits(['edit', 'delete', 'add']);

const showDialog = ref(false);
const isEdit = ref(false);
const editIdx = ref(-1);
const form = ref<WateringEntry | FertilizingEntry | TreatmentEntry | Observation>({
  date: '',
  volume: undefined,
});

const title = computed(() => {
  switch (props.type) {
    case 'watering':
      return 'История поливов';
    case 'fertilizing':
      return 'История удобрений';
    case 'treatment':
      return 'История обработок';
    case 'observation':
      return 'Дневник наблюдений';
    default:
      return '';
  }
});
const dialogTitle = computed(() => (isEdit.value ? 'Редактировать запись' : 'Добавить запись'));

function openAddDialog() {
  isEdit.value = false;
  editIdx.value = -1;
  if (props.type === 'watering') {
    form.value = { date: '', volume: undefined };
  } else if (props.type === 'fertilizing') {
    form.value = { date: '', grams: undefined, note: '', composition: {} };
  } else if (props.type === 'treatment') {
    form.value = { date: '', agent: '', volume: undefined };
  } else if (props.type === 'observation') {
    form.value = { date: '', height: undefined, leafCondition: '' };
  }
  showDialog.value = true;
}
function closeDialog() {
  showDialog.value = false;
}
function saveDialog() {
  if (!form.value.date) return;
  if (isEdit.value) {
    emit('edit', editIdx.value, { ...form.value });
  } else {
    emit('add', { ...form.value });
  }
  showDialog.value = false;
}
// Можно добавить обработку редактирования через props/events
</script>
