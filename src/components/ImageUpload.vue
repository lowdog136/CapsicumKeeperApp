<template>
  <div class="image-upload">
    <div v-if="!imageUrl && !previewUrl" class="upload-area" @click="triggerFileInput">
      <q-icon name="add_a_photo" size="48px" color="grey-5" />
      <div class="text-grey-6 q-mt-sm">Нажмите для загрузки фото</div>
      <div class="text-caption text-grey-5">или перетащите файл сюда</div>
    </div>

    <div v-else class="image-preview">
      <q-img
        :src="previewUrl || imageUrl"
        :alt="alt"
        style="height: 200px; object-fit: cover"
        class="rounded-borders"
      >
        <div class="absolute-top-right q-pa-xs">
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            class="bg-black bg-opacity-50"
            @click="removeImage"
          />
        </div>
        <div class="absolute-bottom-right q-pa-xs">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="white"
            class="bg-black bg-opacity-50"
            @click="triggerFileInput"
          />
        </div>
      </q-img>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <div v-if="uploading" class="q-mt-sm">
      <q-linear-progress :value="uploadProgress" color="positive" />
      <div class="text-caption q-mt-xs">Загрузка: {{ Math.round(uploadProgress * 100) }}%</div>
    </div>

    <div v-if="error" class="text-negative text-caption q-mt-xs">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { uploadFile, deleteFile, isFirebaseStorageUrl, getFilePathFromUrl } from 'src/utils/upload';

interface Props {
  modelValue?: string;
  alt?: string;
  folder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'upload-start'): void;
  (e: 'upload-complete', result: { url: string; path: string }): void;
  (e: 'upload-error', error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Изображение',
  folder: 'pepper-photos',
});

const emit = defineEmits<Emits>();

const fileInput = ref<HTMLInputElement>();
const imageUrl = ref(props.modelValue);
const previewUrl = ref<string>('');
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref('');

// Следим за изменениями modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    imageUrl.value = newValue;
    if (!newValue) {
      previewUrl.value = '';
    }
  },
);

function triggerFileInput() {
  fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Проверяем тип файла
  if (!file.type.startsWith('image/')) {
    error.value = 'Пожалуйста, выберите изображение';
    return;
  }

  // Проверяем размер файла (максимум 5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Размер файла не должен превышать 5MB';
    return;
  }

  // Создаем предпросмотр
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  // Начинаем загрузку
  uploading.value = true;
  uploadProgress.value = 0;
  error.value = '';
  emit('upload-start');

  try {
    // Симулируем прогресс загрузки
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 0.9) {
        uploadProgress.value += 0.1;
      }
    }, 100);

    const result = await uploadFile(file, props.folder);

    clearInterval(progressInterval);
    uploadProgress.value = 1;

    // Удаляем старое изображение, если оно было загружено в Firebase Storage
    if (imageUrl.value && isFirebaseStorageUrl(imageUrl.value)) {
      const oldPath = getFilePathFromUrl(imageUrl.value);
      if (oldPath) {
        try {
          await deleteFile(oldPath);
        } catch (deleteError) {
          console.warn('Не удалось удалить старое изображение:', deleteError);
        }
      }
    }

    imageUrl.value = result.url;
    emit('update:modelValue', result.url);
    emit('upload-complete', result);

    // Очищаем предпросмотр через небольшую задержку
    setTimeout(() => {
      previewUrl.value = '';
    }, 1000);
  } catch (uploadError) {
    error.value = uploadError instanceof Error ? uploadError.message : 'Ошибка загрузки';
    emit('upload-error', error.value);
    previewUrl.value = '';
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }

  // Очищаем input
  if (target) {
    target.value = '';
  }
}

function removeImage() {
  imageUrl.value = '';
  previewUrl.value = '';
  emit('update:modelValue', '');
}
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.upload-area:hover {
  border-color: #21ba45;
}

.image-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}
</style>
