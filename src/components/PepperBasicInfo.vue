<template>
  <div>
    <!-- Основная информация -->
    <q-input
      v-model="nameValue"
      label="Наименование*"
      :error="!!errors.name"
      :error-message="errors.name"
      required
      class="q-mb-sm"
    />

    <VarietySelector
      v-model="selectedVarietyProxy"
      :errors="errors"
      class="q-mb-sm"
      :useV2="true"
    />

    <q-input
      v-model="descriptionValue"
      label="Описание"
      type="textarea"
      :error="!!errors.description"
      :error-message="errors.description"
      class="q-mb-sm"
    />

    <!-- Фото перца -->
    <div class="q-mb-sm">
      <div class="text-subtitle2 q-mb-xs">Фото перца</div>
      <ImageUpload
        :model-value="modelValue.photoUrl"
        @update:model-value="updateField('photoUrl', $event)"
        alt="Фото перца"
        @upload-complete="handleImageUploadComplete"
        @upload-error="handleImageUploadError"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { PepperVariety } from './models';
import VarietySelector from './VarietySelector.vue';
import ImageUpload from './ImageUpload.vue';

export default defineComponent({
  name: 'PepperBasicInfo',
  components: {
    VarietySelector,
    ImageUpload,
  },
  props: {
    modelValue: {
      type: Object as () => {
        name: string;
        description: string;
        photoUrl: string;
      },
      required: true,
    },
    errors: {
      type: Object as () => {
        name: string;
        description: string;
        variety?: string;
      },
      required: true,
    },
    selectedVariety: {
      type: Object as () => PepperVariety | null,
      required: false,
      default: null,
    },
  },
  emits: ['update:modelValue', 'update:selectedVariety'],
  setup(props, { emit }) {
    // v-model proxy для selectedVariety
    const selectedVarietyProxy = computed({
      get: () => props.selectedVariety ?? null,
      set: (val) => {
        emit('update:selectedVariety', val);
      },
    });

    // v-model proxy для name
    const nameValue = computed({
      get: () => props.modelValue.name,
      set: (val) => {
        const updatedValue = { ...props.modelValue, name: val };
        emit('update:modelValue', updatedValue);
      },
    });

    // v-model proxy для description
    const descriptionValue = computed({
      get: () => props.modelValue.description,
      set: (val) => {
        const updatedValue = { ...props.modelValue, description: val };
        emit('update:modelValue', updatedValue);
      },
    });

    function updateField(field: string, value: string) {
      const updatedValue = { ...props.modelValue, [field]: value };
      emit('update:modelValue', updatedValue);
    }

    function handleImageUploadComplete(result: { url: string; path: string }) {
      updateField('photoUrl', result.url);
    }

    function handleImageUploadError(errorMessage: string) {
      console.error('Ошибка загрузки изображения:', errorMessage);
    }

    return {
      selectedVarietyProxy,
      nameValue,
      descriptionValue,
      updateField,
      handleImageUploadComplete,
      handleImageUploadError,
      modelValue: props.modelValue,
      errors: props.errors,
    };
  },
});
</script>
