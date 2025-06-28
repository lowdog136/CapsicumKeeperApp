<template>
  <q-page class="row items-start justify-evenly q-pa-md">
    <div v-if="favoritePeppers.length" class="row q-col-gutter-md q-mt-md">
      <PepperCard
        v-for="pepper in favoritePeppers"
        :key="pepper.id"
        :pepper="pepper"
        @update:stage="updateStage(pepper.id, $event)"
        @delete="handleDelete"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
    <div v-else class="text-center q-mt-xl">
      <q-icon name="favorite_border" size="4rem" color="grey" />
      <p class="text-h6 text-grey q-mt-md">В избранном пока ничего нет</p>
      <q-btn to="/" label="К списку перцев" color="primary" class="q-mt-md" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePepperStore } from 'stores/pepper-store';
import { useQuasar } from 'quasar';
import PepperCard from 'components/PepperCard.vue';
import type { Pepper } from 'components/models';

const pepperStore = usePepperStore();
const { peppers } = storeToRefs(pepperStore);
const $q = useQuasar();

const favoritePeppers = computed(() => peppers.value.filter(p => p.isFavorite));

function updateStage(id: string, newStage: Pepper['stage']) {
  const pepper = peppers.value.find(p => p.id === id);
  if (pepper) pepper.stage = newStage;
}

function handleDelete(id: string) {
  pepperStore.deletePepper(id);
  $q.notify({
    color: 'positive',
    message: 'Карточка перца удалена',
    icon: 'delete_forever',
    position: 'top'
  });
}

function handleToggleFavorite(id: string) {
  pepperStore.toggleFavorite(id);
}
</script>
