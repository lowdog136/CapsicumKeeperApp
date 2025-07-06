<template>
  <div class="row q-col-gutter-md q-mb-lg">
    <div class="col-12 col-sm-6 col-md-3">
      <q-card class="text-center">
        <q-card-section>
          <q-icon name="local_florist" size="48px" color="primary" />
          <div class="text-h4 q-mt-sm">{{ totalPeppers }}</div>
          <div class="text-body2 text-grey-6">Всего перцев</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-sm-6 col-md-3">
      <q-card class="text-center">
        <q-card-section>
          <q-icon name="favorite" size="48px" color="red" />
          <div class="text-h4 q-mt-sm">{{ favoritePeppers }}</div>
          <div class="text-body2 text-grey-6">В избранном</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-sm-6 col-md-3">
      <q-card class="text-center">
        <q-card-section>
          <q-icon name="eco" size="48px" color="green" />
          <div class="text-h4 q-mt-sm">{{ activePeppers }}</div>
          <div class="text-body2 text-grey-6">Активных</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-sm-6 col-md-3">
      <q-card class="text-center">
        <q-card-section>
          <q-icon name="schedule" size="48px" color="orange" />
          <div class="text-h4 q-mt-sm">{{ averageAge }}</div>
          <div class="text-body2 text-grey-6">Средний возраст (дн.)</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Pepper } from './models';

interface Props {
  peppers: Pepper[];
}

const props = defineProps<Props>();

// Вычисляемые свойства
const totalPeppers = computed(() => props.peppers.length);

const favoritePeppers = computed(() => props.peppers.filter((p) => p.isFavorite).length);

const activePeppers = computed(() => props.peppers.filter((p) => p.stage !== 'сбор урожая').length);

const averageAge = computed(() => {
  if (props.peppers.length === 0) return 0;

  const totalAge = props.peppers.reduce((sum, pepper) => {
    const plantDate = new Date(pepper.plantingDate);
    const now = new Date();
    const age = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + age;
  }, 0);

  return Math.round(totalAge / props.peppers.length);
});
</script>
