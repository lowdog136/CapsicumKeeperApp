<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-6">
      <h6>Активность ухода</h6>
      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-card class="text-center">
            <q-card-section class="q-pa-sm">
              <q-icon name="water_drop" size="32px" color="blue" />
              <div class="text-h6 q-mt-sm">{{ totalWaterings }}</div>
              <div class="text-caption">Всего поливов</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center">
            <q-card-section class="q-pa-sm">
              <q-icon name="eco" size="32px" color="green" />
              <div class="text-h6 q-mt-sm">{{ totalFertilizings }}</div>
              <div class="text-caption">Всего удобрений</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center">
            <q-card-section class="q-pa-sm">
              <q-icon name="healing" size="32px" color="orange" />
              <div class="text-h6 q-mt-sm">{{ totalTreatments }}</div>
              <div class="text-caption">Всего обработок</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card class="text-center">
            <q-card-section class="q-pa-sm">
              <q-icon name="visibility" size="32px" color="purple" />
              <div class="text-h6 q-mt-sm">{{ totalObservations }}</div>
              <div class="text-caption">Всего наблюдений</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-6">
      <h6>Последняя активность</h6>
      <q-list>
        <q-item v-if="lastWatering">
          <q-item-section avatar>
            <q-icon name="water_drop" color="blue" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Последний полив</q-item-label>
            <q-item-label caption>{{ formatDate(lastWatering.date) }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="lastFertilizing">
          <q-item-section avatar>
            <q-icon name="eco" color="green" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Последнее удобрение</q-item-label>
            <q-item-label caption>{{ formatDate(lastFertilizing.date) }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="lastTreatment">
          <q-item-section avatar>
            <q-icon name="healing" color="orange" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Последняя обработка</q-item-label>
            <q-item-label caption>{{ formatDate(lastTreatment.date) }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="lastObservation">
          <q-item-section avatar>
            <q-icon name="visibility" color="purple" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Последнее наблюдение</q-item-label>
            <q-item-label caption>{{ formatDate(lastObservation.date) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
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

// Активность ухода
const totalWaterings = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.wateringHistory?.length || 0), 0),
);

const totalFertilizings = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.fertilizingHistory?.length || 0), 0),
);

const totalTreatments = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.treatmentHistory?.length || 0), 0),
);

const totalObservations = computed(() =>
  props.peppers.reduce((sum, pepper) => sum + (pepper.observationLog?.length || 0), 0),
);

// Последняя активность
const lastWatering = computed(() => {
  const allWaterings = props.peppers.flatMap((p) =>
    (p.wateringHistory || []).map((w) => ({ ...w, pepperName: p.name })),
  );
  return allWaterings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastFertilizing = computed(() => {
  const allFertilizings = props.peppers.flatMap((p) =>
    (p.fertilizingHistory || []).map((f) => ({ ...f, pepperName: p.name })),
  );
  return allFertilizings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastTreatment = computed(() => {
  const allTreatments = props.peppers.flatMap((p) =>
    (p.treatmentHistory || []).map((t) => ({ ...t, pepperName: p.name })),
  );
  return allTreatments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const lastObservation = computed(() => {
  const allObservations = props.peppers.flatMap((p) =>
    (p.observationLog || []).map((o) => ({ ...o, pepperName: p.name })),
  );
  return allObservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU');
}
</script>
