<template>
  <q-page class="q-pa-md">
    <div v-if="loading" class="q-pa-md flex flex-center">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else class="row q-gutter-md q-mt-md">
      <q-col v-for="pepper in pagedPeppers" :key="pepper.id" cols="12" sm="6" md="4" lg="3">
        <PepperCard
          :pepper="pepper"
          @update:stage="updateStage(pepper.id, $event)"
          @delete="handleDelete"
          @toggle-favorite="handleToggleFavorite"
        />
      </q-col>
    </div>
    <div class="row justify-center q-mt-lg" v-if="pageCount > 1">
      <q-pagination
        v-model="page"
        :max="pageCount"
        color="primary"
        input
        boundary-numbers
        size="md"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { usePepperFirestore } from 'stores/pepper-firestore';
import { useQuasar } from 'quasar';
import PepperCard from 'components/PepperCard.vue';
import type { Pepper } from 'components/models';
import { ref, computed, onMounted } from 'vue';

const pepperFirestore = usePepperFirestore();
const { peppers, loading } = storeToRefs(pepperFirestore);
const $q = useQuasar();

const page = ref(1);
const perPage = 8;
const pageCount = computed(() => Math.ceil(peppers.value.length / perPage));
const pagedPeppers = computed(() => {
  const start = (page.value - 1) * perPage;
  return peppers.value.slice(start, start + perPage);
});

onMounted(() => {
  void pepperFirestore.fetchPeppers();
});

/* eslint-disable @typescript-eslint/no-unused-vars */
function updateStage(id: string, newStage: Pepper['stage']) {
  // Для Firestore-редактирования реализовать updatePepper
}
/* eslint-enable @typescript-eslint/no-unused-vars */

function handleDelete(id: string) {
  void pepperFirestore.deletePepper(id);
  $q.notify({
    color: 'positive',
    message: 'Карточка перца удалена',
    icon: 'delete_forever',
    position: 'top',
  });
}

function handleToggleFavorite() {
  // Для Firestore-редактирования реализовать updatePepper
}
</script>
