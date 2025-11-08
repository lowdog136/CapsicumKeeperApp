<script setup lang="ts">
import { withDefaults } from 'vue';
import { useUserStore } from 'stores/user-store';
import { useQuasar } from 'quasar';

const props = withDefaults(
  defineProps<{
    flat?: boolean;
    dense?: boolean;
    size?: string;
    color?: string;
  }>(),
  {
    flat: true,
    dense: false,
    size: 'md',
    color: 'primary',
  },
);

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
  <q-btn
    :flat="props.flat"
    :dense="props.dense"
    :size="props.size"
    :color="props.color"
    icon="logout"
    label="Выйти"
    @click="onLogout"
  />
</template>
