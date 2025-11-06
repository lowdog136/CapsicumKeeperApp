<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Изменить наименование</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="newName"
          label="Наименование"
          outlined
          autofocus
          :rules="[validateName]"
          @keyup.enter="saveName"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="cancel" />
        <q-btn flat label="Сохранить" color="primary" @click="saveName" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: boolean;
  currentName: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const newName = ref<string>(props.currentName);

// Следим за изменениями currentName
watch(
  () => props.currentName,
  (val) => {
    newName.value = val;
  },
);

// Валидация
const validateName = (val: string): boolean | string => {
  if (!val || val.trim().length === 0) {
    return 'Наименование не может быть пустым';
  }
  if (val.trim().length < 2) {
    return 'Наименование должно содержать минимум 2 символа';
  }
  if (val.trim().length > 100) {
    return 'Наименование не должно превышать 100 символов';
  }
  return true;
};

const isValid = computed(() => {
  const validation = validateName(newName.value);
  return validation === true;
});

function saveName() {
  if (isValid.value && newName.value.trim() !== props.currentName) {
    emit('save', newName.value.trim());
    showDialog.value = false;
  }
}

function cancel() {
  newName.value = props.currentName;
  showDialog.value = false;
}
</script>
