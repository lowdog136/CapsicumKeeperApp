<template>
  <q-card class="variety-card" flat bordered>
    <q-img v-if="variety.imageUrl" :src="variety.imageUrl" height="200px" fit="cover">
      <div class="absolute-top-right q-pa-sm" v-if="userStore.user">
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
        <div class="row items-center q-gutter-xs">
          <!-- Индикатор группы -->
          <q-chip
            v-if="isGroup"
            color="info"
            text-color="white"
            size="sm"
            icon="group"
            label="Группа"
          />
          <q-chip
            :color="getHeatLevelInfo(variety.heatLevel).color"
            text-color="white"
            size="sm"
            :label="getHeatLevelInfo(variety.heatLevel).name"
          />
        </div>
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
          <q-icon
            v-for="color in variety.color"
            :key="color"
            name="fiber_manual_record"
            :style="{ color: getColorHex(color), fontSize: '22px' }"
            class="q-mr-xs"
          >
            <q-tooltip>{{ color }}</q-tooltip>
          </q-icon>
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
      <q-btn
        v-if="userStore.user"
        flat
        color="secondary"
        label="Добавить в сад"
        @click="addToGarden"
      />
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

          <!-- Показываем подвиды если это группа -->
          <div v-if="isGroup && subVarieties.length > 0" class="q-mb-lg">
            <h6>Подвиды в группе ({{ subVarieties.length }})</h6>
            <div class="row q-col-gutter-sm">
              <div
                v-for="subVariety in subVarieties"
                :key="subVariety.name"
                class="col-12 col-md-6 col-lg-4"
              >
                <q-card flat bordered class="q-pa-sm">
                  <div class="text-subtitle2">{{ subVariety.name }}</div>
                  <div class="text-caption text-grey-6">{{ subVariety.description }}</div>
                  <q-chip
                    :color="getHeatLevelInfo(subVariety.heatLevel).color"
                    text-color="white"
                    size="sm"
                    :label="getHeatLevelInfo(subVariety.heatLevel).name"
                    class="q-mt-xs"
                  />
                </q-card>
              </div>
            </div>
          </div>

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
                  <strong>Острота:</strong> {{ getHeatLevelInfo(variety.heatLevel).name }} ({ {
                  getHeatLevelInfo(variety.heatLevel).shuRange } })
                </li>
                <li>
                  <strong>Цвета:</strong>
                  <span v-for="color in variety.color" :key="color" class="q-mr-xs">
                    <q-icon
                      name="fiber_manual_record"
                      :style="{ color: getColorHex(color), fontSize: '18px' }"
                    />
                  </span>
                </li>
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
          <q-btn
            v-if="userStore.user"
            unelevated
            label="Добавить в сад"
            color="primary"
            @click="addToGarden"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVarietyLibraryStore } from 'src/stores/variety-library';
import { useUserStore } from 'src/stores/user-store';
import { getVarietiesByGroup } from 'src/utils/pepper-seeds-parser';
import type { PepperVariety } from 'src/components/models';

const props = defineProps<{
  variety: PepperVariety;
}>();

const emit = defineEmits<{
  addToGarden: [variety: PepperVariety];
}>();

const store = useVarietyLibraryStore();
const userStore = useUserStore();
const showDetails = ref(false);

const getHeatLevelInfo = store.getHeatLevelInfo;
const getSpeciesInfo = store.getSpeciesInfo;

// Определяем, является ли сорт группой
const isGroup = computed(() => {
  // Проверяем, есть ли в описании упоминание о группе
  return (
    props.variety.description.includes('группа сортов') ||
    props.variety.description.includes('разновидностей')
  );
});

// Получаем подвиды для группы
const subVarieties = computed(() => {
  if (!isGroup.value) return [];

  try {
    // Получаем базовое название группы
    const baseName = props.variety.name.split(' ')[0];
    return getVarietiesByGroup(baseName);
  } catch (error) {
    console.error('Ошибка при получении подвидов:', error);
    return [];
  }
});

const colorMap: Record<string, string> = {
  красный: '#e53935',
  желтый: '#fbc02d',
  оранжевый: '#fb8c00',
  зеленый: '#43a047',
  фиолетовый: '#8e24aa',
  шоколадный: '#6d4c41',
  белый: '#fafafa',
  черный: '#212121',
  розовый: '#ec407a',
  кремовый: '#fff8e1',
  сиреневый: '#b39ddb',
  синий: '#1e88e5',
  коричневый: '#795548',
  золотой: '#ffd600',
  лимонный: '#fff176',
  персиковый: '#ffb74d',
  серый: '#bdbdbd',
};

function getColorHex(color: string): string {
  // Привести к нижнему регистру и убрать пробелы
  const key = color.trim().toLowerCase();
  return colorMap[key] || key || '#bdbdbd';
}

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
