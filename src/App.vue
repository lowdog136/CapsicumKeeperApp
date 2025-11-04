<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

onMounted(() => {
  // Включаем темную тему по умолчанию
  $q.dark.set(true);
});
</script>
