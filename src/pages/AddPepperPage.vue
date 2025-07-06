<template>
  <q-page class="flex flex-center q-pa-md">
    <div v-if="!isAuthenticated">
      <q-card class="q-pa-lg q-mb-md">
        <div class="text-h6 q-mb-md">Только авторизованные пользователи могут добавлять перцы</div>
        <AuthPanel />
      </q-card>
    </div>
    <div v-else>
      <PepperForm ref="pepperFormRef" @submit="handleSubmit" />
      <q-dialog v-model="showDialog" @hide="onDialogHide">
        <q-card>
          <q-card-section class="text-h6">Перец успешно добавлен!</q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="OK" color="primary" v-close-popup @click="showDialog = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePepperStore } from 'stores/pepper-store';
import { usePepperFirestore } from 'stores/pepper-firestore';
import { useUserStore } from 'stores/user-store';
import PepperForm from 'components/PepperForm.vue';
import AuthPanel from 'components/AuthPanel.vue';
import type { Pepper } from 'components/models';

const showDialog = ref(false);
const pepperFormRef = ref();
const pepperStore = usePepperStore();
const pepperFirestore = usePepperFirestore();
const userStore = useUserStore();
const isAuthenticated = computed(() => !!userStore.user);

function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter((_, v) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)]),
    ) as T;
  }
  return obj;
}

async function handleSubmit(pepper: Omit<Pepper, 'id' | 'userId'>) {
  try {
    const cleanPepper = removeUndefined(pepper);
    await pepperFirestore.addPepper(cleanPepper);
    pepperStore.addPepper(cleanPepper); // для локального отображения, если нужно
    showDialog.value = true;
    // Очищаем форму после успешного сохранения
    if (pepperFormRef.value?.resetForm) {
      pepperFormRef.value.resetForm();
    }
  } catch {
    alert('Ошибка при добавлении в Firestore');
  }
}

function onDialogHide() {
  // Дополнительная очистка при закрытии диалога
  if (pepperFormRef.value?.resetForm) {
    pepperFormRef.value.resetForm();
  }
}
</script>
