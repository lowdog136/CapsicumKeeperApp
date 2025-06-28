<script setup lang="ts">
import { useUserStore } from 'stores/user-store';
import { useQuasar } from 'quasar';

const userStore = useUserStore();
const $q = useQuasar();

function onLogout() {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы действительно хотите выйти?',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Выйти',
      color: 'negative',
    },
  }).onOk(() => {
    void userStore.signOut().then(() => {
      $q.notify({
        type: 'positive',
        message: 'До свидания! Будем рады видеть вас снова.',
        timeout: 2000,
      });
    });
  });
}

defineExpose({ onLogout });
</script>

<template>
  <q-btn flat icon="logout" label="Выйти" @click="onLogout" />
</template>
