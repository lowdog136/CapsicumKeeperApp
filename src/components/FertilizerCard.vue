<template>
  <q-card class="fertilizer-card" flat bordered>
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <h6 class="q-my-none text-weight-bold">{{ fertilizer.name }}</h6>
        <div class="row q-gutter-xs">
          <q-btn
            :icon="fertilizer.isFavorite ? 'favorite' : 'favorite_border'"
            :color="fertilizer.isFavorite ? 'red' : 'grey'"
            round
            flat
            dense
            size="sm"
            @click="handleToggleFavorite"
          />
          <q-btn
            icon="edit"
            round
            flat
            dense
            size="sm"
            color="primary"
            @click="handleEdit"
          />
          <q-btn
            icon="delete"
            round
            flat
            dense
            size="sm"
            color="negative"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Категория -->
      <div class="row items-center q-mb-sm">
        <q-chip
          :color="getCategoryColor(fertilizer.category)"
          text-color="white"
          size="sm"
          :label="getCategoryLabel(fertilizer.category)"
        />
        <q-chip
          v-if="fertilizer.manufacturer"
          color="grey-7"
          text-color="white"
          size="sm"
          :label="fertilizer.manufacturer"
          class="q-ml-xs"
        />
      </div>

      <!-- Описание -->
      <p v-if="fertilizer.description" class="text-body2 q-mb-sm">
        {{ fertilizer.description }}
      </p>

      <!-- Состав -->
      <div class="q-mb-sm">
        <div class="text-caption text-grey-6 q-mb-xs">Состав (%):</div>
        <div class="row q-col-gutter-xs">
          <q-chip
            v-for="(value, key) in composition"
            :key="key"
            color="primary"
            text-color="white"
            size="sm"
            :label="`${key}: ${value}%`"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import type { Fertilizer } from 'stores/fertilizer-library-firestore';

interface Props {
  fertilizer: Fertilizer;
}

interface Emits {
  (e: 'edit', fertilizer: Fertilizer): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-favorite', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const composition = computed(() => {
  const comp: Record<string, number> = {};
  Object.entries(props.fertilizer.composition).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value > 0) {
      comp[key] = value;
    }
  });
  return comp;
});

function getCategoryColor(category: Fertilizer['category']): string {
  const colors = {
    organic: 'green',
    mineral: 'blue',
    complex: 'purple',
    micro: 'orange',
    other: 'grey',
  };
  return colors[category] || 'grey';
}

function getCategoryLabel(category: Fertilizer['category']): string {
  const labels = {
    organic: 'Органическое',
    mineral: 'Минеральное',
    complex: 'Комплексное',
    micro: 'Микроэлементы',
    other: 'Другое',
  };
  return labels[category] || 'Другое';
}

function handleEdit() {
  emit('edit', props.fertilizer);
}

function handleDelete() {
  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить удобрение "${props.fertilizer.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    emit('delete', props.fertilizer.id);
  });
}

function handleToggleFavorite() {
  emit('toggle-favorite', props.fertilizer.id);
}
</script>

<style scoped>
.fertilizer-card {
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.fertilizer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>

