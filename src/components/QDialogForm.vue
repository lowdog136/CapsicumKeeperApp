<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ props.title }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form @submit.prevent="onSubmit" ref="formRef">
          <div v-for="field in props.fields" :key="field.name" class="q-mb-sm">
            <q-toggle
              v-if="field.type === 'boolean'"
              v-model="
                (
                  localModel.value as unknown as Record<
                    string,
                    string | number | FileList | null | undefined
                  >
                )[field.name]
              "
              :label="field.label"
              :true-value="true"
              :false-value="false"
            />
            <q-input
              v-else-if="!field.options"
              v-model="
                (
                  localModel.value as unknown as Record<
                    string,
                    string | number | FileList | null | undefined
                  >
                )[field.name]
              "
              :type="
                (field.type as
                  | 'text'
                  | 'textarea'
                  | 'password'
                  | 'email'
                  | 'search'
                  | 'tel'
                  | 'file'
                  | 'url'
                  | 'date'
                  | 'time'
                  | 'number'
                  | 'datetime-local') || 'text'
              "
              :label="field.label"
              :rules="field.rules"
              dense
              outlined
            />
            <q-select
              v-else
              v-model="
                (
                  localModel.value as unknown as Record<
                    string,
                    string | number | FileList | null | undefined
                  >
                )[field.name]
              "
              :options="field.options"
              :label="field.label"
              :rules="field.rules"
              dense
              outlined
              emit-value
              map-options
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="props.cancelLabel || 'Отмена'" v-close-popup @click="onCancel" />
        <q-btn flat color="primary" :label="props.submitLabel || 'Сохранить'" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { QForm } from 'quasar';

const props = defineProps<{
  modelValue: Record<string, string | number | FileList | null | undefined>;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    options?: unknown[];
    rules?: ((val: unknown) => boolean | string)[];
  }>;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  show: boolean;
}>();
const emit = defineEmits(['update:modelValue', 'submit', 'cancel', 'update:show']);

const show = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
});

const localModel = ref<Record<string, string | number | FileList | null | undefined>>({
  ...props.modelValue,
});
watch(
  () => props.modelValue,
  (val) => {
    localModel.value = { ...val };
  },
);

const formRef = ref<InstanceType<typeof QForm> | null>(null);

function onSubmit() {
  void formRef.value?.validate().then((valid: boolean) => {
    if (valid) {
      emit('update:modelValue', { ...localModel.value });
      emit('submit', { ...localModel.value });
      show.value = false;
    }
  });
}
function onCancel() {
  emit('cancel');
  show.value = false;
}
</script>
