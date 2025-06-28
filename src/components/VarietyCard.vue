<template>
  <q-card class="variety-card" flat bordered>
    <q-img v-if="variety.imageUrl" :src="variety.imageUrl" height="200px" fit="cover">
      <div class="absolute-top-right q-pa-sm">
        <q-btn
          :icon="variety.isFavorite ? 'favorite' : 'favorite_border'"
          :color="variety.isFavorite ? 'red' : 'grey'"
          round
          flat
          dense
          @click="toggleFavorite"
        />
      </div>
    </q-img>

    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <h6 class="q-my-none text-weight-bold">{{ variety.name }}</h6>
        <q-chip
          :color="getHeatLevelInfo(variety.heatLevel).color"
          text-color="white"
          size="sm"
          :label="getHeatLevelInfo(variety.heatLevel).name"
        />
      </div>

      <!-- Научная классификация -->
      <div class="row items-center q-mb-sm">
        <q-chip
          color="primary"
          text-color="white"
          size="sm"
          :label="variety.species"
          icon="science"
        />
        <q-tooltip>
          {{ getSpeciesInfo(variety.species)?.description }}
        </q-tooltip>
      </div>

      <p class="text-body2 q-mb-sm">{{ variety.description }}</p>

      <!-- Цвета плодов -->
      <div class="row items-center q-mb-sm">
        <span class="text-caption q-mr-sm">Цвета:</span>
        <div class="row q-gutter-xs">
          <q-chip
            v-for="color in variety.color"
            :key="color"
            size="xs"
            :label="color"
            color="grey-3"
            text-color="dark"
          />
        </div>
      </div>

      <!-- Характеристики растения -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <div class="text-caption text-grey-6">Высота растения</div>
          <div class="text-body2">
            {{ variety.plantHeight.min }}-{{ variety.plantHeight.max }}
            {{ variety.plantHeight.unit }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey-6">Дни до созревания</div>
          <div class="text-body2">
            {{ variety.daysToMaturity.min }}-{{ variety.daysToMaturity.max }} дней
          </div>
        </div>
      </div>

      <!-- Размер плода -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <div class="text-caption text-grey-6">Длина плода</div>
          <div class="text-body2">
            {{ variety.fruitSize.length.min }}-{{ variety.fruitSize.length.max }}
            {{ variety.fruitSize.length.unit }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey-6">Ширина плода</div>
          <div class="text-body2">
            {{ variety.fruitSize.width.min }}-{{ variety.fruitSize.width.max }}
            {{ variety.fruitSize.width.unit }}
          </div>
        </div>
      </div>

      <!-- Происхождение -->
      <div v-if="variety.origin" class="q-mb-sm">
        <div class="text-caption text-grey-6">Происхождение</div>
        <div class="text-body2">{{ variety.origin }}</div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat color="primary" label="Подробнее" @click="showDetails = true" />
      <q-btn flat color="secondary" label="Добавить в сад" @click="addToGarden" />
    </q-card-actions>

    <!-- Диалог с подробностями -->
    <q-dialog v-model="showDetails" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ variety.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-img
            v-if="variety.imageUrl"
            :src="variety.imageUrl"
            height="300px"
            fit="cover"
            class="q-mb-md"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <h6>Описание</h6>
              <p>{{ variety.description }}</p>

              <h6>Научная классификация</h6>
              <p><strong>Вид:</strong> {{ variety.species }}</p>
              <p v-if="getSpeciesInfo(variety.species)?.description">
                {{ getSpeciesInfo(variety.species)?.description }}
              </p>

              <h6>Характеристики</h6>
              <ul>
                <li>
                  <strong>Острота:</strong> {{ getHeatLevelInfo(variety.heatLevel).name }} ({{
                    getHeatLevelInfo(variety.heatLevel).shuRange
                  }})
                </li>
                <li><strong>Цвета:</strong> {{ variety.color.join(', ') }}</li>
                <li>
                  <strong>Высота:</strong> {{ variety.plantHeight.min }}-{{
                    variety.plantHeight.max
                  }}
                  {{ variety.plantHeight.unit }}
                </li>
                <li>
                  <strong>Созревание:</strong> {{ variety.daysToMaturity.min }}-{{
                    variety.daysToMaturity.max
                  }}
                  дней
                </li>
                <li v-if="variety.origin"><strong>Происхождение:</strong> {{ variety.origin }}</li>
              </ul>
            </div>

            <div class="col-12 col-md-6">
              <h6>Советы по выращиванию</h6>
              <ul>
                <li v-for="tip in variety.growingTips" :key="tip">{{ tip }}</li>
              </ul>

              <h6>Размер плода</h6>
              <p>
                Длина: {{ variety.fruitSize.length.min }}-{{ variety.fruitSize.length.max }}
                {{ variety.fruitSize.length.unit }}<br />
                Ширина: {{ variety.fruitSize.width.min }}-{{ variety.fruitSize.width.max }}
                {{ variety.fruitSize.width.unit }}
              </p>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
          <q-btn unelevated label="Добавить в сад" color="primary" @click="addToGarden" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import type { PepperVariety } from 'src/components/models';

const props = defineProps<{
  variety: PepperVariety;
}>();

const emit = defineEmits<{
  (e: 'addToGarden', variety: PepperVariety): void;
}>();

const store = useVarietyLibraryStore();
const showDetails = ref(false);

const getHeatLevelInfo = store.getHeatLevelInfo;
const getSpeciesInfo = store.getSpeciesInfo;

const toggleFavorite = async () => {
  await store.toggleFavorite(props.variety.id);
};

const addToGarden = () => {
  emit('addToGarden', props.variety);
  showDetails.value = false;
};
</script>

<style scoped>
.variety-card {
  transition: transform 0.2s ease-in-out;
}

.variety-card:hover {
  transform: translateY(-2px);
}
</style>
