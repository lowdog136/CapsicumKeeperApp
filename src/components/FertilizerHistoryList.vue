<template>
  <q-list v-if="groupedFertilizingHistory.length" dense class="q-mt-xs">
    <template v-for="(items, date) in groupedFertilizingHistory" :key="date">
      <q-item-label header>{{ date }}</q-item-label>
      <q-item v-for="(item, idx) in items" :key="idx">
        <q-item-section>
          <span v-if="item.grams">{{ item.grams }} г</span>
          <span v-if="item.note">{{ item.note }}</span>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface FertilizerEntry {
  date: string;
  note?: string;
  grams?: number;
  composition?: any;
}

interface Props {
  modelValue: FertilizerEntry[];
}

const props = defineProps<Props>();

const groupedFertilizingHistory = computed(() => {
  const groups: Record<string, { note?: string; grams?: number }[]> = {};
  for (const item of props.modelValue) {
    if (!item.date) continue;
    if (!groups[item.date]) groups[item.date] = [];
    const entry: { note?: string; grams?: number } = {};
    if (typeof item.note === 'string') entry.note = item.note;
    if (typeof item.grams === 'number') entry.grams = item.grams;
    groups[item.date]!.push(entry);
  }
  return groups;
});
</script>
