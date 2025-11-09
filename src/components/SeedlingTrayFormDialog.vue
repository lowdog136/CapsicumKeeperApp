<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="seedling-tray-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ isEdit ? 'Редактирование кассеты' : 'Новая кассета для рассады' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form ref="formRef" @submit.prevent="handleSubmit" class="column q-gutter-md">
          <q-input
            v-model="form.name"
            label="Название кассеты"
            outlined
            dense
            :rules="[val => !!val || 'Укажите название']"
            hide-bottom-space
          />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model.number="form.rows"
                type="number"
                label="Количество рядов"
                outlined
                dense
                hide-bottom-space
                :rules="[
                  val => !!val || 'Укажите количество рядов',
                  val => Number(val) >= 1 || 'Минимум 1',
                  val => Number(val) <= 12 || 'Максимум 12',
                ]"
                min="1"
                max="12"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.columns"
                type="number"
                label="Количество колонок"
                outlined
                dense
                hide-bottom-space
                :rules="[
                  val => !!val || 'Укажите количество колонок',
                  val => Number(val) >= 1 || 'Минимум 1',
                  val => Number(val) <= 12 || 'Максимум 12',
                ]"
                min="1"
                max="12"
              />
            </div>
          </div>

          <q-input
            v-model="form.location"
            label="Расположение"
            outlined
            dense
            hide-bottom-space
            placeholder="Например, подоконник на кухне"
          />

          <q-input
            v-model="form.color"
            label="Цветовая метка"
            outlined
            dense
            hide-bottom-space
            placeholder="Например, зелёная кассета"
          />

          <q-input
            v-model="form.description"
            label="Описание"
            type="textarea"
            autogrow
            outlined
            dense
            hide-bottom-space
            placeholder="Дополнительные заметки о кассете"
          />

          <q-input
            v-model="form.notes"
            label="Заметки"
            type="textarea"
            autogrow
            outlined
            dense
            hide-bottom-space
            placeholder="Например, партия семян или особенности ухода"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="closeDialog" />
        <q-btn
          label="Сохранить"
          color="primary"
          unelevated
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { QForm } from 'quasar';
import type { SeedlingTray, SeedlingTrayInput } from 'stores/seedling-trays-firestore';

interface Props {
  modelValue: boolean;
  loading?: boolean;
  tray?: SeedlingTray | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tray: null,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'save', payload: SeedlingTrayInput | (SeedlingTrayInput & { id: string })): void;
}>();

const form = reactive<SeedlingTrayInput>({
  name: '',
  rows: 4,
  columns: 4,
  description: '',
  location: '',
  color: '',
  notes: '',
});

const formRef = ref<QForm | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.tray);

const resetForm = () => {
  form.name = '';
  form.rows = 4;
  form.columns = 4;
  form.description = '';
  form.location = '';
  form.color = '';
  form.notes = '';
};

watch(
  () => props.tray,
  (tray) => {
    if (tray) {
      form.name = tray.name;
      form.rows = tray.rows;
      form.columns = tray.columns;
      form.description = tray.description ?? '';
      form.location = tray.location ?? '';
      form.color = tray.color ?? '';
      form.notes = tray.notes ?? '';
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const closeDialog = () => {
  emit('update:modelValue', false);
};

const validateForm = async () => {
  if (formRef.value) {
    const valid = await formRef.value.validate();
    return valid;
  }
  return Boolean(form.name && form.rows >= 1 && form.columns >= 1);
};

const handleSubmit = async () => {
  const isValid = await validateForm();
  if (!isValid) {
    return;
  }

  const payload: SeedlingTrayInput = {
    name: form.name.trim(),
    rows: Number(form.rows),
    columns: Number(form.columns),
    description: form.description?.trim() || null,
    location: form.location?.trim() || null,
    color: form.color?.trim() || null,
    notes: form.notes?.trim() || null,
  };

  if (isEdit.value && props.tray) {
    emit('save', Object.assign({ id: props.tray.id }, payload));
  } else {
    emit('save', payload);
  }
};
</script>

<style scoped>
.seedling-tray-dialog {
  min-width: min(520px, 90vw);
}

@media (max-width: 600px) {
  .seedling-tray-dialog {
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    border-radius: 0;
  }
}
</style>


