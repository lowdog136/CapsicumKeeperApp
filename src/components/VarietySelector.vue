<template>
  <div>
    <!-- Поле выбора сорта -->
    <VarietySearchField
      v-model="selectedVariety"
      :errors="errors"
      @open-dialog="showVarietyDialog = true"
      @show-info="showVarietyInfo = true"
    />

    <!-- Информация о выбранном сорте -->
    <VarietyInfoCard :variety="selectedVariety" :use-v2="useV2" />

    <!-- Диалог выбора сорта -->
    <VarietySelectionDialog
      v-model="showVarietyDialog"
      :varieties="filteredVarieties"
      :loading="loading"
      :use-v2="useV2"
      :heat-level-options="heatLevelOptions"
      :species-options="speciesOptions"
      @select="selectVariety"
    />

    <!-- Диалог с подробной информацией о сорте -->
    <VarietyDetailsDialog v-model="showVarietyInfo" :variety="selectedVariety" :use-v2="useV2" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import { useVarietyLibraryV2Store } from 'src/stores/variety-library-v2';
import type { PepperVariety } from 'src/components/models';
import VarietySearchField from './VarietySearchField.vue';
import VarietyInfoCard from './VarietyInfoCard.vue';
import VarietySelectionDialog from './VarietySelectionDialog.vue';
import VarietyDetailsDialog from './VarietyDetailsDialog.vue';

const props = defineProps<{
  modelValue?: any | null;
  errors?: { variety?: string };
  useV2?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any | null): void;
}>();

const useV2 = computed(() => props.useV2 === true);

// Stores
const storeV1 = useVarietyLibraryStore();
const storeV2 = useVarietyLibraryV2Store();

const showVarietyDialog = ref(false);
const showVarietyInfo = ref(false);

// Computed свойства
const selectedVariety = computed({
  get: () => props.modelValue || null,
  set: (value) => emit('update:modelValue', value),
});

// --- V1 ---
const filteredVarietiesV1 = computed(() => {
  return storeV1.varieties;
});

const heatLevelOptionsV1 = computed(() => storeV1.heatLevels);

const speciesOptionsV1 = computed(() => storeV1.species);

// --- V2 ---
const filteredVarietiesV2 = computed(() => {
  return storeV2.allItems.length > 0 ? storeV2.allItems : storeV2.items;
});

const heatLevelOptionsV2 = computed(() => []); // TODO: добавить когда появится в v2

const speciesOptionsV2 = computed(() => {
  return storeV2.allItems.length > 0
    ? Array.from(new Set(storeV2.allItems.map((v) => v.species)).values())
        .filter(Boolean)
        .map((s) => ({ label: s, value: s }))
    : [];
});

// Общие computed свойства
const filteredVarieties = computed(() => {
  return useV2.value ? filteredVarietiesV2.value : filteredVarietiesV1.value;
});

const loading = computed(() => {
  return useV2.value ? storeV2.loading : storeV1.loading;
});

const heatLevelOptions = computed(() => {
  return useV2.value ? heatLevelOptionsV2.value : heatLevelOptionsV1.value;
});

const speciesOptions = computed(() => {
  return useV2.value ? speciesOptionsV2.value : speciesOptionsV1.value;
});

// Методы
function selectVariety(variety: PepperVariety) {
  selectedVariety.value = variety;
}

// Инициализация
onMounted(async () => {
  if (useV2.value) {
    if (storeV2.items.length === 0) {
      await storeV2.fetchFirstPage();
    }
    if (storeV2.allItems.length === 0) {
      await storeV2.fetchAllItems();
    }
  } else {
    if (storeV1.varieties.length === 0) {
      await storeV1.loadVarieties();
    }
  }
});

watch(useV2, async (val) => {
  if (val) {
    if (storeV2.items.length === 0) {
      await storeV2.fetchFirstPage();
    }
    if (storeV2.allItems.length === 0) {
      await storeV2.fetchAllItems();
    }
  }
});
</script>

<style scoped>
.variety-selector-card {
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;
}

.variety-selector-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.selected-variety {
  border-color: var(--q-primary);
  background-color: var(--q-primary);
  color: white;
}

.selected-variety .text-grey-6,
.selected-variety .text-grey-7 {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>
