<template>
  <div class="row items-center">
    <div class="row items-center q-ml-md">
      <q-checkbox
        v-model="local.hasDrainage"
        :label="drainageLabel"
        dense
        @update:model-value="onDrainageCheck"
      />
      <q-icon
        v-if="local.drainage"
        name="close"
        size="18px"
        class="q-ml-xs cursor-pointer text-grey"
        @click.stop="clearDrainage"
      />
    </div>
    <div class="row items-center q-ml-md">
      <q-checkbox
        v-model="local.hasSoilImprovement"
        :label="soilImprovementLabel"
        dense
        @update:model-value="onSoilImprovementCheck"
      />
      <q-icon
        v-if="local.soilImprovement"
        name="close"
        size="18px"
        class="q-ml-xs cursor-pointer text-grey"
        @click.stop="clearSoilImprovement"
      />
    </div>
    <q-dialog v-model="showDrainageDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Выберите дренаж</div>
          <q-list>
            <q-item
              clickable
              v-for="option in drainageOptions"
              :key="option"
              @click="selectDrainage(option)"
            >
              <q-item-section>{{ option }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showSoilImprovementDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Выберите улучшение грунта</div>
          <q-list>
            <q-item
              clickable
              v-for="option in soilImprovementOptions"
              :key="option"
              @click="selectSoilImprovement(option)"
            >
              <q-item-section>{{ option }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pepper } from './models';
type SoilExtras = NonNullable<Pepper['soilExtras']>;

const props = defineProps<{ modelValue: SoilExtras }>();
const emit = defineEmits(['update:modelValue']);

const drainageOptions = ['значение 1', 'значение 2'];
const soilImprovementOptions = ['значение 1', 'значение 2'];

const local = ref<SoilExtras>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (val) => {
    local.value = { ...val };
  },
  { immediate: true, deep: true },
);

watch(
  local,
  (val) => {
    emit('update:modelValue', { ...val });
  },
  { deep: true },
);

const showDrainageDialog = ref(false);
const showSoilImprovementDialog = ref(false);

const drainageLabel = computed(() => {
  const val = local.value.drainage;
  return val ? `Дренаж (${val})` : 'Дренаж';
});
const soilImprovementLabel = computed(() => {
  const val = local.value.soilImprovement;
  return val ? `Улучшение (${val})` : 'Улучшение';
});

function onDrainageCheck(val: boolean) {
  if (val) {
    showDrainageDialog.value = true;
  } else {
    local.value.hasDrainage = false;
    local.value.drainage = null;
  }
}
function onSoilImprovementCheck(val: boolean) {
  if (val) {
    showSoilImprovementDialog.value = true;
  } else {
    local.value.hasSoilImprovement = false;
    local.value.soilImprovement = null;
  }
}
function selectDrainage(option: string) {
  local.value.hasDrainage = true;
  local.value.drainage = option;
  showDrainageDialog.value = false;
}
function selectSoilImprovement(option: string) {
  local.value.hasSoilImprovement = true;
  local.value.soilImprovement = option;
  showSoilImprovementDialog.value = false;
}
function clearDrainage() {
  local.value.hasDrainage = false;
  local.value.drainage = null;
}
function clearSoilImprovement() {
  local.value.hasSoilImprovement = false;
  local.value.soilImprovement = null;
}
</script>
