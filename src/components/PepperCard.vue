<template>
  <q-card class="my-card q-mb-md">
    <q-img
      :src="pepper.photoUrl || 'https://via.placeholder.com/400x200?text=No+Image'"
      :alt="pepper.name"
      style="height: 200px; object-fit: cover"
    />
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <div class="text-h6 q-mr-sm" v-if="!editMode">{{ pepper.name }}</div>
        <q-input
          v-else
          v-model="editForm.name"
          label="Наименование"
          dense
          outlined
          class="q-mr-sm"
        />
        <q-badge color="positive" class="q-ml-sm">{{ pepper.id }}</q-badge>
        <q-btn flat icon="edit" size="sm" @click="toggleEditMode" v-if="!editMode" />
        <q-btn flat icon="save" size="sm" color="positive" @click="saveEdit" v-if="editMode" />
        <q-btn flat icon="close" size="sm" color="negative" @click="cancelEdit" v-if="editMode" />
      </div>
      <div class="q-mb-xs" v-if="!editMode">
        <span class="text-subtitle2">Сорт: </span>{{ pepper.variety }}
        <!-- Информация о сорте из библиотеки -->
        <div v-if="pepper.varietyInfo" class="q-mt-xs">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section class="q-pa-sm">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-chip
                  :color="getHeatLevelInfo(pepper.varietyInfo.heatLevel).color"
                  text-color="white"
                  size="sm"
                  :label="getHeatLevelInfo(pepper.varietyInfo.heatLevel).name"
                />
                <q-chip
                  color="primary"
                  text-color="white"
                  size="sm"
                  :label="pepper.varietyInfo.species"
                  icon="science"
                />
                <q-chip
                  v-if="pepper.varietyInfo.origin"
                  color="grey"
                  text-color="white"
                  size="sm"
                  :label="pepper.varietyInfo.origin"
                />
              </div>
              <div class="row q-col-gutter-sm text-caption">
                <div class="col-6">
                  <div class="text-grey-6">Высота</div>
                  <div>
                    {{ pepper.varietyInfo.plantHeight.min }}-{{
                      pepper.varietyInfo.plantHeight.max
                    }}
                    {{ pepper.varietyInfo.plantHeight.unit }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-grey-6">Созревание</div>
                  <div>
                    {{ pepper.varietyInfo.daysToMaturity.min }}-{{
                      pepper.varietyInfo.daysToMaturity.max
                    }}
                    дней
                  </div>
                </div>
              </div>
              <div class="text-caption q-mt-xs text-grey-7">
                Цвета: {{ pepper.varietyInfo.color.join(', ') }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <q-input v-else v-model="editForm.variety" label="Сорт" dense outlined class="q-mb-xs" />
      <div class="q-mb-xs" v-if="!editMode">
        <span>{{ pepper.description }}</span>
      </div>
      <q-input
        v-else
        v-model="editForm.description"
        label="Описание"
        type="textarea"
        dense
        outlined
        class="q-mb-xs"
      />
      <div class="q-mb-xs" v-if="!editMode"><span>Фото: </span>{{ pepper.photoUrl }}</div>
      <div v-else class="q-mb-xs">
        <div class="text-subtitle2 q-mb-xs">Фото перца</div>
        <ImageUpload
          v-model="editForm.photoUrl"
          alt="Фото перца"
          @upload-complete="handleImageUploadComplete"
          @upload-error="handleImageUploadError"
        />
      </div>
      <div class="q-mb-xs" v-if="!editMode">
        <span>Дата посадки: </span>{{ pepper.plantingDate }}
      </div>
      <q-input
        v-else
        v-model="editForm.plantingDate"
        label="Дата посадки"
        type="date"
        dense
        outlined
        class="q-mb-xs"
      />
      <div class="q-mb-xs row items-center" v-if="!editMode">
        <span>Место посадки: </span>{{ locationText }}
        <template v-if="pepper.location?.type === 'горшок'">
          <SoilExtrasInline v-model="localSoilExtras" />
        </template>
      </div>
      <!-- Стадия роста -->
      <div class="q-mb-xs row items-center">
        <q-icon name="local_florist" color="orange" size="22px" class="q-mr-sm" />
        <span v-if="!editMode">Стадия роста: {{ pepper.stage }}</span>
        <q-select
          v-else
          v-model="editForm.stage"
          :options="stages"
          dense
          outlined
          class="q-mb-xs"
        />
      </div>
      <!-- Растение растет и количество дней -->
      <div class="q-mt-xs row items-center">
        <q-icon name="eco" color="green" size="24px" class="q-mr-sm" />
        <span>Растение растет: {{ daysSincePlanting }} дн.</span>
      </div>

      <!-- Полив -->
      <div class="q-mt-sm">
        <div>Последний полив: {{ lastWatering?.date || '-' }}</div>
        <PepperHistoryList
          :items="editMode ? pepper.wateringHistory : limitedWateringHistory"
          type="watering"
          @add="(entry) => handleHistoryAdd('watering', entry)"
          @edit="(idx, entry) => handleHistoryEdit('watering', idx, entry)"
          @delete="(idx) => handleHistoryDelete('watering', idx)"
        />
      </div>

      <!-- Удобрения -->
      <div class="q-mt-sm">
        <div>Последние удобрения:</div>
        <PepperHistoryList
          :items="editMode ? pepper.fertilizingHistory : limitedFertilizingHistory"
          type="fertilizing"
          @add="(entry) => handleHistoryAdd('fertilizing', entry)"
          @edit="(idx, entry) => handleHistoryEdit('fertilizing', idx, entry)"
          @delete="(idx) => handleHistoryDelete('fertilizing', idx)"
        />
      </div>

      <!-- Обработка -->
      <div class="q-mt-sm">
        <div>Последняя обработка: {{ lastTreatment?.date || '-' }}</div>
        <PepperHistoryList
          :items="editMode ? pepper.treatmentHistory || [] : limitedTreatmentHistory"
          type="treatment"
          @add="(entry) => handleHistoryAdd('treatment', entry)"
          @edit="(idx, entry) => handleHistoryEdit('treatment', idx, entry)"
          @delete="(idx) => handleHistoryDelete('treatment', idx)"
        />
      </div>

      <!-- Дневник наблюдений -->
      <div class="q-mt-sm">
        <div>Последнее наблюдение: {{ lastObservation?.date || '-' }}</div>
        <PepperHistoryList
          :items="editMode ? pepper.observationLog || [] : limitedObservationHistory"
          type="observation"
          @add="(entry) => handleHistoryAdd('observation', entry)"
          @edit="(idx, entry) => handleHistoryEdit('observation', idx, entry)"
          @delete="(idx) => handleHistoryDelete('observation', idx)"
        />
      </div>

      <!-- История стадий роста -->
      <div class="q-mt-sm" v-if="pepper.stageHistory && pepper.stageHistory.length">
        <div class="text-subtitle2">История стадий роста</div>
        <q-list dense>
          <q-item
            v-for="(item, idx) in editMode ? pepper.stageHistory : limitedStageHistory"
            :key="idx"
          >
            <q-item-section>{{ item.date }} — {{ item.stage }}</q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- История мест посадки -->
      <div class="q-mt-sm" v-if="pepper.locationHistory && pepper.locationHistory.length">
        <div class="text-subtitle2">История мест посадки</div>
        <q-list dense>
          <q-item
            v-for="(item, idx) in editMode ? pepper.locationHistory : limitedLocationHistory"
            :key="idx"
          >
            <q-item-section
              >{{ item.date }} — {{ item.type
              }}<span v-if="item.potVolume"> ({{ item.potVolume }})</span></q-item-section
            >
          </q-item>
        </q-list>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions align="right">
      <q-btn flat color="positive" label="Подробно" @click="showDetails = true" class="q-mr-auto" />
      <q-btn
        flat
        round
        :color="pepper.isFavorite ? 'amber' : 'grey'"
        :icon="pepper.isFavorite ? 'star' : 'star_border'"
        @click="toggleFavorite"
      />
      <q-btn flat round color="red" icon="delete" @click="showDeleteDialog = true" />
    </q-card-actions>
  </q-card>

  <q-dialog v-model="showDeleteDialog">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="red" text-color="white" />
        <span class="q-ml-sm">Вы уверены, что хотите удалить карточку "{{ pepper.name }}"?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="positive" v-close-popup />
        <q-btn flat label="Удалить" color="red" @click="confirmDelete" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showDetails" persistent>
    <q-card style="min-width: 400px; max-width: 90vw; max-height: 90vh; overflow-y: auto">
      <q-carousel
        v-model="detailsSlide"
        animated
        swipeable
        control-type="flat"
        arrows
        navigation
        infinite
        height="auto"
      >
        <q-carousel-slide name="details">
          <q-card-section>
            <div class="text-h6">
              Подробная информация о {{ props.pepper.name }} ({{ props.pepper.id }})
            </div>
            <div class="q-mt-md">
              <div><b>Сорт:</b> {{ props.pepper.variety }}</div>
              <div><b>Дата посева:</b> {{ props.pepper.plantingDate }}</div>
              <div><b>Текущая стадия:</b> {{ props.pepper.stage }}</div>
              <div>
                <b>Текущая локация:</b> {{ props.pepper.location.type
                }}<span v-if="props.pepper.location.potVolume">
                  ({{ props.pepper.location.potVolume }})</span
                >
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div>
              <div class="text-subtitle2 q-mb-xs">История поливов</div>
              <q-list dense bordered>
                <q-item v-for="(w, i) in props.pepper.wateringHistory" :key="i">
                  <q-item-section>{{ w.date }} — {{ w.volume }} мл</q-item-section>
                </q-item>
                <q-item
                  v-if="!props.pepper.wateringHistory || !props.pepper.wateringHistory.length"
                >
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">История удобрений</div>
              <q-list dense bordered>
                <q-item v-for="(f, i) in props.pepper.fertilizingHistory" :key="i">
                  <q-item-section>
                    <span class="text-primary">{{ f.date }}</span> —
                    {{ f.grams ? f.grams + ' г' : '' }} {{ f.note }}
                    <template v-if="f.composition && Object.keys(f.composition).length">
                      <span
                        v-if="f.composition.N || f.composition.P || f.composition.K"
                        class="q-ml-sm"
                        >NPK:
                        <span v-if="f.composition.N">N: {{ f.composition.N }}</span>
                        <span v-if="f.composition.P"> P: {{ f.composition.P }}</span>
                        <span v-if="f.composition.K"> K: {{ f.composition.K }}</span>
                      </span>
                      <span
                        v-if="
                          f.composition.Fe ||
                          f.composition.Mn ||
                          f.composition.B ||
                          f.composition.Na ||
                          f.composition.Zn ||
                          f.composition.Cu ||
                          f.composition.Mo ||
                          f.composition.Cl ||
                          f.composition.Ni ||
                          f.composition.Si
                        "
                        class="q-ml-sm"
                        >Микроэлементы:
                        <span v-if="f.composition.Fe">Fe: {{ f.composition.Fe }}</span>
                        <span v-if="f.composition.Mn"> Mn: {{ f.composition.Mn }}</span>
                        <span v-if="f.composition.B"> B: {{ f.composition.B }}</span>
                        <span v-if="f.composition.Na"> Na: {{ f.composition.Na }}</span>
                        <span v-if="f.composition.Zn"> Zn: {{ f.composition.Zn }}</span>
                        <span v-if="f.composition.Cu"> Cu: {{ f.composition.Cu }}</span>
                        <span v-if="f.composition.Mo"> Mo: {{ f.composition.Mo }}</span>
                        <span v-if="f.composition.Cl"> Cl: {{ f.composition.Cl }}</span>
                        <span v-if="f.composition.Ni"> Ni: {{ f.composition.Ni }}</span>
                        <span v-if="f.composition.Si"> Si: {{ f.composition.Si }}</span>
                      </span>
                    </template>
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="!props.pepper.fertilizingHistory || !props.pepper.fertilizingHistory.length"
                >
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">История обработок</div>
              <q-list dense bordered>
                <q-item v-for="(t, i) in props.pepper.treatmentHistory || []" :key="i">
                  <q-item-section
                    >{{ t.date }} — {{ t.agent }}
                    <span v-if="t.volume">({{ t.volume }} мл)</span></q-item-section
                  >
                </q-item>
                <q-item
                  v-if="!props.pepper.treatmentHistory || !props.pepper.treatmentHistory.length"
                >
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Дневник наблюдений</div>
              <q-list dense bordered>
                <q-item v-for="(o, i) in props.pepper.observationLog || []" :key="i">
                  <q-item-section>{{ o.date }} — {{ o.leafCondition }}</q-item-section>
                </q-item>
                <q-item v-if="!props.pepper.observationLog || !props.pepper.observationLog.length">
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">История стадий</div>
              <q-list dense bordered>
                <q-item v-for="(s, i) in props.pepper.stageHistory" :key="i">
                  <q-item-section>{{ s.date }} — {{ s.stage }}</q-item-section>
                </q-item>
                <q-item v-if="!props.pepper.stageHistory || !props.pepper.stageHistory.length">
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">История локаций</div>
              <q-list dense bordered>
                <q-item v-for="(l, i) in props.pepper.locationHistory" :key="i">
                  <q-item-section
                    >{{ l.date }} — {{ l.type
                    }}<span v-if="l.potVolume"> ({{ l.potVolume }})</span></q-item-section
                  >
                </q-item>
                <q-item
                  v-if="!props.pepper.locationHistory || !props.pepper.locationHistory.length"
                >
                  <q-item-section>Нет записей</q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Статистика" color="positive" @click="detailsSlide = 'stats'" />
            <q-btn flat label="Закрыть" color="positive" v-close-popup />
          </q-card-actions>
        </q-carousel-slide>
        <q-carousel-slide name="stats">
          <q-card-section>
            <div class="text-h6">Статистика по растению</div>
            <div class="q-mt-md"><b>Всего полито:</b> {{ totalWatered }} мл</div>
            <div class="q-mt-sm"><b>Всего добавлено удобрений:</b> {{ totalFertilized }} г</div>
            <div class="q-mt-sm"><b>Количество обработок:</b> {{ totalTreatments }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="История" color="positive" @click="detailsSlide = 'details'" />
            <q-btn flat label="Закрыть" color="positive" v-close-popup />
          </q-card-actions>
        </q-carousel-slide>
      </q-carousel>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type {
  Pepper,
  WateringEntry,
  FertilizingEntry,
  TreatmentEntry,
  Observation,
  HeatLevel,
} from './models';
import { usePepperFirestore } from 'src/stores/pepper-firestore';
import SoilExtrasInline from './SoilExtrasInline.vue';
import PepperHistoryList from './PepperHistoryList.vue';
import { useQuasar } from 'quasar';
import ImageUpload from './ImageUpload.vue';

const props = defineProps<{ pepper: Pepper }>();
const emit = defineEmits<{
  (e: 'update:stage', value: Pepper['stage']): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-favorite', id: string): void;
}>();

const pepperFirestore = usePepperFirestore();
const $q = useQuasar();

// Функция для получения информации об уровне остроты
function getHeatLevelInfo(heatLevel: HeatLevel) {
  const heatLevels = {
    'no-heat': { name: 'Без остроты', color: 'green', shuRange: '0 SHU' },
    'very-mild': { name: 'Очень мягкий', color: 'light-green', shuRange: '100-500 SHU' },
    mild: { name: 'Мягкий', color: 'yellow', shuRange: '500-2500 SHU' },
    medium: { name: 'Средний', color: 'orange', shuRange: '2500-8000 SHU' },
    hot: { name: 'Острый', color: 'red', shuRange: '8000-50000 SHU' },
    'very-hot': { name: 'Очень острый', color: 'deep-orange', shuRange: '50000-100000 SHU' },
    'extremely-hot': { name: 'Экстремально острый', color: 'purple', shuRange: '100000+ SHU' },
  };
  return heatLevels[heatLevel] || heatLevels['mild'];
}

const stages: Pepper['stage'][] = [
  'проращивание',
  'рассада',
  'вегетация',
  'плодоношение',
  'сбор урожая',
];

const localStage = ref(props.pepper.stage);

watch(
  () => props.pepper.stage,
  (val) => {
    localStage.value = val;
  },
);

const lastWatering = computed(() => {
  const history = props.pepper.wateringHistory;
  return history && history.length ? history[history.length - 1] : null;
});

const lastTreatment = computed(() => {
  const history = props.pepper.treatmentHistory;
  return history && history.length ? history[history.length - 1] : null;
});

const lastObservation = computed(() => {
  const history = props.pepper.observationLog;
  return history && history.length ? history[history.length - 1] : null;
});

const showDetails = ref(false);
const totalWatered = computed(() =>
  (props.pepper.wateringHistory || []).reduce((sum, w) => sum + (w.volume || 0), 0),
);
const totalFertilized = computed(() =>
  (props.pepper.fertilizingHistory || []).reduce((sum, f) => sum + (f.grams || 0), 0),
);
const totalTreatments = computed(() => (props.pepper.treatmentHistory || []).length);
const detailsSlide = ref<'details' | 'stats'>('details');

const locationText = computed(() => {
  if (props.pepper.location?.type === 'горшок') {
    return `Горшок, объем: ${props.pepper.location?.potVolume ?? '-'}`;
  }
  return props.pepper.location?.type
    ? props.pepper.location.type.charAt(0).toUpperCase() + props.pepper.location.type.slice(1)
    : '-';
});

const showDeleteDialog = ref(false);

function confirmDelete() {
  emit('delete', props.pepper.id);
}

function toggleFavorite() {
  emit('toggle-favorite', props.pepper.id);
}

const editMode = ref(false);
type SoilExtras = NonNullable<Pepper['soilExtras']>;
const editForm = ref({
  name: props.pepper.name,
  variety: props.pepper.variety,
  photoUrl: props.pepper.photoUrl,
  description: props.pepper.description,
  stage: props.pepper.stage,
  plantingDate: props.pepper.plantingDate,
  location: { ...props.pepper.location },
  soilExtras: (props.pepper.soilExtras
    ? { ...props.pepper.soilExtras }
    : {
        hasDrainage: false,
        drainage: null,
        hasSoilImprovement: false,
        soilImprovement: null,
      }) as SoilExtras,
});

watch(
  () => props.pepper,
  (val) => {
    if (!editMode.value) {
      editForm.value = {
        name: val.name,
        variety: val.variety,
        photoUrl: val.photoUrl,
        description: val.description,
        stage: val.stage,
        plantingDate: val.plantingDate,
        location: { ...val.location },
        soilExtras: (val.soilExtras
          ? { ...val.soilExtras }
          : {
              hasDrainage: false,
              drainage: null,
              hasSoilImprovement: false,
              soilImprovement: null,
            }) as SoilExtras,
      };
    }
  },
  { deep: true },
);

function toggleEditMode() {
  editMode.value = true;
}
function cancelEdit() {
  editMode.value = false;
  editForm.value = {
    name: props.pepper.name,
    variety: props.pepper.variety,
    photoUrl: props.pepper.photoUrl,
    description: props.pepper.description,
    stage: props.pepper.stage,
    plantingDate: props.pepper.plantingDate,
    location: { ...props.pepper.location },
    soilExtras: (props.pepper.soilExtras
      ? { ...props.pepper.soilExtras }
      : {
          hasDrainage: false,
          drainage: null,
          hasSoilImprovement: false,
          soilImprovement: null,
        }) as SoilExtras,
  };
}
async function saveEdit() {
  const updatedFields: Partial<Pepper> = {
    name: editForm.value.name,
    variety: editForm.value.variety,
    photoUrl: editForm.value.photoUrl,
    description: editForm.value.description,
    plantingDate: editForm.value.plantingDate,
    location: { ...editForm.value.location },
    soilExtras: { ...editForm.value.soilExtras },
  };
  // --- stage ---
  if (props.pepper.stage !== editForm.value.stage) {
    const today = new Date().toISOString().slice(0, 10);
    const newStageHistory = props.pepper.stageHistory ? [...props.pepper.stageHistory] : [];
    newStageHistory.push({ date: today, stage: editForm.value.stage });
    updatedFields.stage = editForm.value.stage;
    updatedFields.stageHistory = newStageHistory;
  }
  await pepperFirestore.updatePepper(props.pepper.id, updatedFields);
  $q.notify({
    color: 'positive',
    message: 'Изменения сохранены',
  });
  editMode.value = false;
}

// --- Новый универсальный обработчик истории ---
function handleHistoryAdd(
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation',
  entry: WateringEntry | FertilizingEntry | TreatmentEntry | Observation,
) {
  const field =
    type === 'watering'
      ? 'wateringHistory'
      : type === 'fertilizing'
        ? 'fertilizingHistory'
        : type === 'treatment'
          ? 'treatmentHistory'
          : 'observationLog';
  const arr = [...(props.pepper[field] ?? []), entry];
  void pepperFirestore.updatePepper(props.pepper.id, { [field]: arr }).then(() => {
    $q.notify({
      color: 'positive',
      message: 'Изменения сохранены',
    });
  });
}
function handleHistoryEdit(
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation',
  idx: number,
  entry: WateringEntry | FertilizingEntry | TreatmentEntry | Observation,
) {
  const field =
    type === 'watering'
      ? 'wateringHistory'
      : type === 'fertilizing'
        ? 'fertilizingHistory'
        : type === 'treatment'
          ? 'treatmentHistory'
          : 'observationLog';
  const arr = [...(props.pepper[field] ?? [])];
  arr[idx] = entry;
  void pepperFirestore.updatePepper(props.pepper.id, { [field]: arr }).then(() => {
    $q.notify({
      color: 'positive',
      message: 'Изменения сохранены',
    });
  });
}
function handleHistoryDelete(
  type: 'watering' | 'fertilizing' | 'treatment' | 'observation',
  idx: number,
) {
  const field =
    type === 'watering'
      ? 'wateringHistory'
      : type === 'fertilizing'
        ? 'fertilizingHistory'
        : type === 'treatment'
          ? 'treatmentHistory'
          : 'observationLog';
  const arr = [...(props.pepper[field] ?? [])];
  arr.splice(idx, 1);
  void pepperFirestore.updatePepper(props.pepper.id, { [field]: arr }).then(() => {
    $q.notify({
      color: 'positive',
      message: 'Изменения сохранены',
    });
  });
}

const daysSincePlanting = computed(() => {
  if (!props.pepper.plantingDate) return '-';
  const plantDate = new Date(props.pepper.plantingDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : '-';
});

const defaultSoilExtras = {
  hasDrainage: false,
  drainage: null,
  hasSoilImprovement: false,
  soilImprovement: null,
};

const localSoilExtras = ref<SoilExtras>({ ...(props.pepper.soilExtras ?? defaultSoilExtras) });
watch(
  () => props.pepper.soilExtras,
  (val) => {
    localSoilExtras.value = { ...(val ?? defaultSoilExtras) };
  },
  { immediate: true, deep: true },
);

let lastSoilExtras = JSON.stringify(props.pepper.soilExtras ?? {});
watch(
  localSoilExtras,
  (val) => {
    const current = JSON.stringify(val ?? {});
    if (current !== lastSoilExtras) {
      lastSoilExtras = current;
      void pepperFirestore.updatePepper(props.pepper.id, { soilExtras: { ...val } }).then(() => {
        $q.notify({
          color: 'positive',
          message: 'Изменения сохранены',
        });
      });
    }
  },
  { deep: true },
);

const limitedWateringHistory = computed((): WateringEntry[] => {
  const history = props.pepper.wateringHistory;
  return history && history.length > 2 ? history.slice(-2) : history || [];
});

const limitedFertilizingHistory = computed((): FertilizingEntry[] => {
  const history = props.pepper.fertilizingHistory;
  return history && history.length > 2 ? history.slice(-2) : history || [];
});

const limitedTreatmentHistory = computed((): TreatmentEntry[] => {
  const history = props.pepper.treatmentHistory;
  return history && history.length > 2 ? history.slice(-2) : history || [];
});

const limitedObservationHistory = computed((): Observation[] => {
  const history = props.pepper.observationLog;
  return history && history.length > 2 ? history.slice(-2) : history || [];
});

const limitedStageHistory = computed((): { date: string; stage: string }[] => {
  const history = props.pepper.stageHistory;
  return history && history.length > 2 ? history.slice(-2) : history || [];
});

const limitedLocationHistory = computed(
  (): { date: string; type: string; potVolume?: string }[] => {
    const history = props.pepper.locationHistory;
    return history && history.length > 2 ? history.slice(-2) : history || [];
  },
);

function handleImageUploadComplete(result: { url: string; path: string }) {
  editForm.value.photoUrl = result.url;
}

function handleImageUploadError(errorMessage: string) {
  $q.notify({
    color: 'negative',
    message: `Ошибка загрузки изображения: ${errorMessage}`,
  });
}

defineExpose({
  editMode,
  editForm,
  toggleEditMode,
  saveEdit,
  cancelEdit,
  daysSincePlanting,
});
</script>

<style scoped>
.my-card {
  max-width: 370px;
  min-width: 320px;
  width: 100%;
}
@media (min-width: 1024px) {
  .my-card {
    width: 370px;
    min-width: 370px;
    max-width: 370px;
  }
}
@media (max-width: 1023px) {
  .my-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
}
</style>
