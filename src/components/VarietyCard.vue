<template>
  <q-card class="variety-card q-mb-md">
    <q-card-section horizontal>
      <!-- Изображение сорта -->
      <q-card-section class="q-pt-xs" style="width: 200px">
        <q-img
          v-if="variety.imageUrl"
          :src="variety.imageUrl"
          :ratio="1"
          class="rounded-borders"
          spinner-color="positive"
        />
        <div v-else class="placeholder-image">
          <q-icon name="local_florist" size="48px" color="grey-4" />
          <div class="text-grey-6 q-mt-sm">Нет фото</div>
        </div>
      </q-card-section>

      <!-- Информация о сорте -->
      <q-card-section class="flex-grow">
        <div class="row items-center q-mb-sm">
          <div class="text-h6">{{ variety.name }}</div>
          <q-btn
            flat
            round
            :color="variety.isFavorite ? 'amber' : 'grey'"
            :icon="variety.isFavorite ? 'star' : 'star_border'"
            @click="toggleFavorite"
            class="q-ml-sm"
          />
        </div>

        <div v-if="variety.scientificName" class="text-caption text-grey-6 q-mb-sm">
          {{ variety.scientificName }}
        </div>

        <!-- Уровень остроты -->
        <div class="q-mb-sm">
          <q-chip
            :color="heatLevelInfo.color"
            text-color="white"
            :label="heatLevelInfo.name"
            size="sm"
          />
          <span class="text-caption q-ml-sm">{{ heatLevelInfo.shuRange }}</span>
        </div>

        <!-- Описание -->
        <div class="text-body2 q-mb-md">{{ variety.description }}</div>

        <!-- Характеристики -->
        <div class="row q-gutter-md">
          <div class="col-6">
            <div class="text-caption text-grey-6">Высота растения</div>
            <div class="text-body2">
              {{ variety.plantHeight.min }}-{{ variety.plantHeight.max }}
              {{ variety.plantHeight.unit }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">Время созревания</div>
            <div class="text-body2">
              {{ variety.daysToMaturity.min }}-{{ variety.daysToMaturity.max }} дней
            </div>
          </div>
        </div>

        <!-- Цвета плодов -->
        <div class="q-mt-sm">
          <div class="text-caption text-grey-6">Цвета плодов</div>
          <div class="row q-gutter-xs q-mt-xs">
            <q-chip v-for="color in variety.color" :key="color" :label="color" size="sm" outline />
          </div>
        </div>

        <!-- Размер плодов -->
        <div class="q-mt-sm">
          <div class="text-caption text-grey-6">Размер плодов</div>
          <div class="text-body2">
            {{ variety.fruitSize.length.min }}-{{ variety.fruitSize.length.max }} ×
            {{ variety.fruitSize.width.min }}-{{ variety.fruitSize.width.max }}
            {{ variety.fruitSize.length.unit }}
          </div>
        </div>
      </q-card-section>
    </q-card-section>

    <!-- Советы по выращиванию -->
    <q-separator />
    <q-card-section v-if="variety.growingTips.length">
      <div class="text-subtitle2 q-mb-sm">Советы по выращиванию</div>
      <q-list dense>
        <q-item v-for="(tip, index) in variety.growingTips" :key="index">
          <q-item-section avatar>
            <q-icon name="tips_and_updates" color="positive" />
          </q-item-section>
          <q-item-section>{{ tip }}</q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- Действия -->
    <q-separator />
    <q-card-actions align="right">
      <q-btn flat color="positive" label="Подробнее" @click="showDetails = true" />
      <q-btn flat color="primary" label="Добавить в сад" @click="addToGarden" />
    </q-card-actions>

    <!-- Диалог с подробностями -->
    <q-dialog v-model="showDetails" persistent>
      <q-card style="min-width: 600px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">{{ variety.name }}</div>
          <div v-if="variety.scientificName" class="text-caption text-grey-6">
            {{ variety.scientificName }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-gutter-md">
            <div class="col-6">
              <q-img
                v-if="variety.imageUrl"
                :src="variety.imageUrl"
                :ratio="1"
                class="rounded-borders"
              />
            </div>
            <div class="col-6">
              <div class="text-subtitle2">Характеристики</div>
              <q-list dense>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Острота</q-item-label>
                    <q-item-label
                      >{{ heatLevelInfo.name }} ({{ heatLevelInfo.shuRange }})</q-item-label
                    >
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Категория</q-item-label>
                    <q-item-label>{{ getCategoryLabel(variety.category) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="variety.origin">
                  <q-item-section>
                    <q-item-label caption>Происхождение</q-item-label>
                    <q-item-label>{{ variety.origin }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <div class="q-mt-md">
            <div class="text-subtitle2">Описание</div>
            <p>{{ variety.description }}</p>
          </div>

          <div v-if="variety.growingTips.length" class="q-mt-md">
            <div class="text-subtitle2">Советы по выращиванию</div>
            <q-list dense>
              <q-item v-for="(tip, index) in variety.growingTips" :key="index">
                <q-item-section avatar>
                  <q-icon name="tips_and_updates" color="positive" />
                </q-item-section>
                <q-item-section>{{ tip }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="positive" v-close-popup />
          <q-btn flat label="Добавить в сад" color="primary" @click="addToGarden" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { PepperVariety } from './models';
import { useVarietyLibraryStore } from 'src/stores/variety-library';

const props = defineProps<{
  variety: PepperVariety;
}>();

const emit = defineEmits<{
  (e: 'add-to-garden', variety: PepperVariety): void;
}>();

const $q = useQuasar();
const varietyLibraryStore = useVarietyLibraryStore();

const showDetails = ref(false);

const heatLevelInfo = computed(() => varietyLibraryStore.getHeatLevelInfo(props.variety.heatLevel));

const getCategoryLabel = (category: string) => {
  const cat = varietyLibraryStore.categories.find((c) => c.value === category);
  return cat ? cat.label : category;
};

const toggleFavorite = async () => {
  try {
    await varietyLibraryStore.toggleFavorite(props.variety.id);
    $q.notify({
      color: 'positive',
      message: props.variety.isFavorite ? 'Убрано из избранного' : 'Добавлено в избранное',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при обновлении избранного',
    });
  }
};

const addToGarden = () => {
  emit('add-to-garden', props.variety);
  $q.notify({
    color: 'positive',
    message: `Сорт "${props.variety.name}" добавлен в сад`,
  });
};
</script>

<style scoped>
.variety-card {
  max-width: 100%;
}

.placeholder-image {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.flex-grow {
  flex: 1;
}
</style>
