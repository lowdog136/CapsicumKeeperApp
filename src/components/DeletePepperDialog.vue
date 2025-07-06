<template>
  <q-dialog v-model="showDialog">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="red" text-color="white" />
        <span class="q-ml-sm">Вы уверены, что хотите удалить "{{ pepperName }}"?</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn flat label="Удалить" color="red" @click="confirmDelete" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  pepperName: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function confirmDelete() {
  emit('confirm');
}
</script>
