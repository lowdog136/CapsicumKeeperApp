<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h6 class="q-my-none">{{ title }}</h6>
      <q-btn color="primary" icon="add" :label="addButtonLabel" @click="$emit('add')" />
    </div>

    <div v-if="entries.length" class="q-gutter-md">
      <q-card v-for="(entry, index) in entries" :key="index" class="q-mb-sm">
        <q-card-section class="q-pa-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2">{{ formatDate(entry.date) }}</div>
              <slot name="entry-content" :entry="entry" :index="index">
                <!-- Default content -->
                <div v-if="entry.note" class="text-caption">{{ entry.note }}</div>
                <div v-if="entry.volume" class="text-caption">Объем: {{ entry.volume }} мл</div>
              </slot>
            </div>
            <div class="row q-gutter-xs">
              <q-btn flat round icon="edit" size="sm" @click="$emit('edit', index)" />
              <q-btn
                flat
                round
                icon="delete"
                size="sm"
                color="negative"
                @click="$emit('delete', index)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="text-center q-pa-xl">
      <q-icon :name="emptyIcon" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">{{ emptyTitle }}</div>
      <div class="text-body2 text-grey-5">{{ emptySubtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  addButtonLabel: string;
  entries: any[];
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
}

interface Emits {
  (e: 'add'): void;
  (e: 'edit', index: number): void;
  (e: 'delete', index: number): void;
}

defineProps<Props>();
defineEmits<Emits>();

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU');
}
</script>
