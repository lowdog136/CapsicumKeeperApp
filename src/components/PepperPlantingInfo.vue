<template>
  <div>
    <q-select
      :model-value="modelValue.stage"
      @update:model-value="updateField('stage', $event)"
      :options="stages"
      label="Стадия роста*"
      :error="!!errors.stage"
      :error-message="errors.stage"
      required
      outlined
      class="q-mb-sm"
    />

    <q-input
      :model-value="modelValue.plantingDate"
      @update:model-value="updateField('plantingDate', $event)"
      label="Дата посадки*"
      type="date"
      :error="!!errors.plantingDate"
      :error-message="errors.plantingDate"
      required
      class="q-mb-sm"
    />

    <q-card-section class="q-pa-md bg-grey-1 rounded-borders q-mb-md">
      <div class="text-subtitle2 q-mb-sm row items-center">
        <q-icon name="spa" class="q-mr-xs" /> Посадка и условия
      </div>
      <q-row class="q-gutter-md items-end">
        <q-col :cols="modelValue.location.type === 'горшок' ? 6 : 12">
          <q-select
            :model-value="modelValue.location.type"
            @update:model-value="updateLocationType"
            :options="locationTypes"
            label="Место посадки*"
            :error="!!errors.locationType"
            :error-message="errors.locationType"
            required
            outlined
            prepend-inner-icon="spa"
            hint="Выберите, где будет расти растение"
            :placeholder="'Выберите место'"
          />
        </q-col>
        <q-slide-transition>
          <template v-if="modelValue.location.type === 'горшок'">
            <q-col :cols="3">
              <q-input
                :model-value="modelValue.location.potVolume"
                @update:model-value="updateLocationField('potVolume', $event)"
                label="Объем горшка (например, 2.5 л)"
                outlined
                prepend-inner-icon="format_color_fill"
                placeholder="например, 2.5 л"
                hint="Укажите объем в литрах"
                :dense="$q.screen.lt.md"
              >
                <template v-slot:append>
                  <q-btn
                    v-if="modelValue.location.potVolume"
                    flat
                    dense
                    icon="clear"
                    @click="updateLocationField('potVolume', '')"
                    size="sm"
                  >
                    <q-tooltip>Очистить</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
            </q-col>
            <q-col :cols="3">
              <div class="q-mb-xs">
                <div class="row items-center q-mb-xs">
                  <q-icon name="water_drop" size="18px" class="q-mr-xs" />
                  <span>Дренаж и улучшение грунта</span>
                </div>
                <SoilExtrasSelector
                  :model-value="modelValue.soilExtras"
                  @update:model-value="(value: any) => updateField('soilExtras', value)"
                />
                <div class="row q-gutter-xs q-mt-xs">
                  <q-btn
                    v-if="
                      modelValue.soilExtras.hasDrainage || modelValue.soilExtras.hasSoilImprovement
                    "
                    flat
                    dense
                    icon="clear"
                    size="sm"
                    @click="clearSoilExtras"
                  >
                    <q-tooltip>Очистить дренаж и улучшение</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-col>
          </template>
        </q-slide-transition>
      </q-row>
    </q-card-section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SoilExtrasSelector from './SoilExtrasSelector.vue';

export default defineComponent({
  name: 'PepperPlantingInfo',
  components: {
    SoilExtrasSelector,
  },
  props: {
    modelValue: {
      type: Object as () => {
        stage: string;
        plantingDate: string;
        location: {
          type: string;
          potVolume?: string;
        };
        soilExtras: {
          hasDrainage: boolean;
          drainage: string | null;
          hasSoilImprovement: boolean;
          soilImprovement: string | null;
        };
      },
      required: true,
    },
    errors: {
      type: Object as () => {
        stage: string;
        plantingDate: string;
        locationType: string;
      },
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const stages = ['проращивание', 'рассада', 'вегетация', 'плодоношение', 'сбор урожая'];

    const locationTypes = ['грунт', 'теплица', 'огород', 'горшок', 'кассета для проращивания'];

    // Методы обновления полей
    function updateField(field: string, value: any) {
      const updatedValue = { ...props.modelValue, [field]: value };
      emit('update:modelValue', updatedValue);
    }

    function updateLocationType(type: string) {
      const updatedLocation = { ...props.modelValue.location, type };
      updateField('location', updatedLocation);
    }

    function updateLocationField(field: string, value: string) {
      const updatedLocation = { ...props.modelValue.location, [field]: value };
      updateField('location', updatedLocation);
    }

    function clearSoilExtras() {
      const clearedSoilExtras = {
        hasDrainage: false,
        drainage: null,
        hasSoilImprovement: false,
        soilImprovement: null,
      };
      updateField('soilExtras', clearedSoilExtras);
    }

    return {
      stages,
      locationTypes,
      updateField,
      updateLocationType,
      updateLocationField,
      clearSoilExtras,
      modelValue: props.modelValue,
      errors: props.errors,
    };
  },
});
</script>
