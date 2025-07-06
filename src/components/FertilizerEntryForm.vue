<template>
  <div>
    <q-input
      v-model="fertilizerDate"
      label="Дата внесения удобрения*"
      type="date"
      :error="!!fertilizerError"
      :error-message="fertilizerError"
      class="q-mb-xs"
    />
    <q-select
      v-model="fertilizerNote"
      :options="fertilizerHistoryList"
      use-input
      input-debounce="0"
      label="Комментарий к удобрению"
      class="q-mb-xs"
      @new-value="(val) => (fertilizerNote = val)"
    />

    <!-- NPK поля -->
    <div class="row q-col-gutter-xs q-mb-xs">
      <q-input
        v-model.number="fertilizerN"
        label="N (%)"
        type="number"
        style="max-width: 80px"
        dense
        outlined
      />
      <q-input
        v-model.number="fertilizerP"
        label="P (%)"
        type="number"
        style="max-width: 80px"
        dense
        outlined
      />
      <q-input
        v-model.number="fertilizerK"
        label="K (%)"
        type="number"
        style="max-width: 80px"
        dense
        outlined
      />
      <q-btn
        flat
        size="sm"
        @click="showExtraFertilizer = !showExtraFertilizer"
        :label="showExtraFertilizer ? 'Скрыть доп.' : 'Показать доп.'"
        class="q-ml-sm"
      />
    </div>

    <!-- Дополнительные микроэлементы -->
    <q-slide-transition>
      <div v-show="showExtraFertilizer" class="row q-col-gutter-xs q-mb-xs">
        <q-input
          v-model.number="fertilizerFe"
          label="Fe (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerMn"
          label="Mn (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerB"
          label="B (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerNa"
          label="Na (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerZn"
          label="Zn (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerCu"
          label="Cu (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerMo"
          label="Mo (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerCl"
          label="Cl (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerNi"
          label="Ni (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
        <q-input
          v-model.number="fertilizerSi"
          label="Si (%)"
          type="number"
          style="max-width: 80px"
          dense
          outlined
        />
      </div>
    </q-slide-transition>

    <q-input
      v-model.number="fertilizerGrams"
      label="Граммы (по желанию)"
      type="number"
      class="q-mb-xs"
    />

    <div class="row q-gutter-sm q-mb-xs">
      <q-btn flat color="primary" @click="$emit('openLibrary')" size="sm">
        <q-icon name="library_books" class="q-mr-xs" />
        Выбрать из библиотеки
      </q-btn>
      <q-btn flat color="positive" @click="handleAdd" size="sm">
        Добавить в историю удобрений
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FertilizerComposition } from './models';

interface FertilizerEntry {
  date: string;
  note?: string;
  grams?: number;
  composition?: FertilizerComposition;
}

interface Props {
  fertilizerHistoryList: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'add', entry: FertilizerEntry): void;
  (e: 'openLibrary'): void;
}>();

// Поля формы
const fertilizerDate = ref(new Date().toISOString().slice(0, 10));
const fertilizerNote = ref('');
const fertilizerGrams = ref<number | null>(null);
const fertilizerError = ref('');
const showExtraFertilizer = ref(false);

// NPK
const fertilizerN = ref<number | null>(null);
const fertilizerP = ref<number | null>(null);
const fertilizerK = ref<number | null>(null);

// Микроэлементы
const fertilizerFe = ref<number | null>(null);
const fertilizerMn = ref<number | null>(null);
const fertilizerB = ref<number | null>(null);
const fertilizerNa = ref<number | null>(null);
const fertilizerZn = ref<number | null>(null);
const fertilizerCu = ref<number | null>(null);
const fertilizerMo = ref<number | null>(null);
const fertilizerCl = ref<number | null>(null);
const fertilizerNi = ref<number | null>(null);
const fertilizerSi = ref<number | null>(null);

function handleAdd() {
  if (!fertilizerDate.value) {
    fertilizerError.value = 'Укажите дату внесения удобрения';
    return;
  }

  const composition: FertilizerComposition = {};
  if (fertilizerN.value !== null) composition.N = fertilizerN.value;
  if (fertilizerP.value !== null) composition.P = fertilizerP.value;
  if (fertilizerK.value !== null) composition.K = fertilizerK.value;
  if (fertilizerFe.value !== null) composition.Fe = fertilizerFe.value;
  if (fertilizerMn.value !== null) composition.Mn = fertilizerMn.value;
  if (fertilizerB.value !== null) composition.B = fertilizerB.value;
  if (fertilizerNa.value !== null) composition.Na = fertilizerNa.value;
  if (fertilizerZn.value !== null) composition.Zn = fertilizerZn.value;
  if (fertilizerCu.value !== null) composition.Cu = fertilizerCu.value;
  if (fertilizerMo.value !== null) composition.Mo = fertilizerMo.value;
  if (fertilizerCl.value !== null) composition.Cl = fertilizerCl.value;
  if (fertilizerNi.value !== null) composition.Ni = fertilizerNi.value;
  if (fertilizerSi.value !== null) composition.Si = fertilizerSi.value;

  const entry: FertilizerEntry = {
    date: fertilizerDate.value,
    note: fertilizerNote.value,
    grams: fertilizerGrams.value !== null ? fertilizerGrams.value : undefined,
    composition,
  };

  emit('add', entry);
  resetForm();
}

function resetForm() {
  fertilizerNote.value = '';
  fertilizerGrams.value = null;
  fertilizerError.value = '';
  fertilizerN.value = null;
  fertilizerP.value = null;
  fertilizerK.value = null;
  fertilizerFe.value = null;
  fertilizerMn.value = null;
  fertilizerB.value = null;
  fertilizerNa.value = null;
  fertilizerZn.value = null;
  fertilizerCu.value = null;
  fertilizerMo.value = null;
  fertilizerCl.value = null;
  fertilizerNi.value = null;
  fertilizerSi.value = null;
}

// Метод для заполнения формы из библиотеки
function fillFromLibrary(fertilizer: any) {
  fertilizerNote.value = fertilizer.name;
  if (fertilizer.composition) {
    fertilizerN.value = fertilizer.composition.N || null;
    fertilizerP.value = fertilizer.composition.P || null;
    fertilizerK.value = fertilizer.composition.K || null;
    fertilizerFe.value = fertilizer.composition.Fe || null;
    fertilizerMn.value = fertilizer.composition.Mn || null;
    fertilizerB.value = fertilizer.composition.B || null;
    fertilizerNa.value = fertilizer.composition.Na || null;
    fertilizerZn.value = fertilizer.composition.Zn || null;
    fertilizerCu.value = fertilizer.composition.Cu || null;
    fertilizerMo.value = fertilizer.composition.Mo || null;
    fertilizerCl.value = fertilizer.composition.Cl || null;
    fertilizerNi.value = fertilizer.composition.Ni || null;
    fertilizerSi.value = fertilizer.composition.Si || null;
  }
}

// Экспортируем метод для использования в родительском компоненте
defineExpose({
  fillFromLibrary,
});
</script>
