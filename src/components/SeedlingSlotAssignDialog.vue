<template>
  <q-dialog v-model="isOpen" :maximized="$q.screen.lt.sm" persistent>
    <q-card class="seedling-slot-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Поместить росток в ячейку R{{ slot.row }} · C{{ slot.column }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md column">
        <q-banner
          v-if="selectedPepper && selectedPepper.seedlingSlot"
          dense
          class="bg-warning text-black"
          rounded
        >
          Перец уже находится в кассете
          <strong>{{ selectedPepper.seedlingSlot.trayName || selectedPepper.seedlingSlot.trayId }}</strong>
          (R{{ selectedPepper.seedlingSlot.row }} · C{{ selectedPepper.seedlingSlot.column }}).
          При перемещении ячейка в старой кассете освободится автоматически.
        </q-banner>

        <q-form ref="formRef" class="column q-gutter-md" @submit.prevent="handleSubmit">
          <q-select
            v-model="selectedPepperId"
            use-input
            fill-input
            clearable
            outlined
            dense
            hide-bottom-space
            label="Выберите перец"
            :input-debounce="200"
            :options="pepperOptions"
            :option-label="option => option?.label || ''"
            :option-value="option => option?.value"
            emit-value
            map-options
            @filter="filterPeppers"
            :rules="[val => !!val || 'Выберите перец']"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.caption }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div class="row items-center q-gutter-sm">
            <q-btn
              outline
              color="primary"
              icon="add"
              label="Создать новый перец"
              @click="goToAddPepper"
            />
            <q-btn
              v-if="selectedPepperId"
              outline
              icon="info"
              label="Открыть карточку"
              @click="emit('open-pepper', selectedPepperId!)"
            />
          </div>

          <q-input
            v-model="notes"
            label="Заметка для ячейки"
            type="textarea"
            autogrow
            outlined
            dense
            hide-bottom-space
            placeholder="Например, дата пикировки или особенности ухода"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="close" />
        <q-btn
          color="primary"
          label="Поместить"
          :disable="!selectedPepperId"
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import type { QForm } from 'quasar';
import type { Pepper } from 'components/models';
import type { SeedlingTraySlotAssignment } from 'stores/seedling-trays-firestore';

interface Props {
  modelValue: boolean;
  trayId: string;
  slot: { row: number; column: number };
  peppers: Pepper[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (
    event: 'assign',
    payload: { pepperId: string; notes?: string | null; row: number; column: number },
  ): void;
  (event: 'open-pepper', pepperId: string): void;
}>();

defineOptions({
  name: 'SeedlingSlotAssignDialog',
});

const $q = useQuasar();
const $router = useRouter();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const formRef = ref<QForm | null>(null);
const selectedPepperId = ref<string | null>(null);
const notes = ref<string>('');
const searchQuery = ref('');

const filteredPeppers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) {
    return props.peppers;
  }
  return props.peppers.filter((pepper) => {
    const nameMatch = pepper.name.toLowerCase().includes(query);
    const varietyMatch = pepper.variety?.toLowerCase().includes(query);
    return nameMatch || varietyMatch;
  });
});

const pepperOptions = computed(() =>
  filteredPeppers.value.map((pepper) => ({
    label: pepper.name,
    value: pepper.id,
    caption: pepper.variety ? `Сорт: ${pepper.variety}` : undefined,
  })),
);

const selectedPepper = computed(() =>
  props.peppers.find((pepper) => pepper.id === selectedPepperId.value) ?? null,
);

watch(
  () => props.modelValue,
  (isVisible) => {
    if (isVisible) {
      selectedPepperId.value = null;
      notes.value = '';
      searchQuery.value = '';
    }
  },
);

const close = () => {
  emit('update:modelValue', false);
};

const filterPeppers = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    searchQuery.value = val;
  });
};

const handleSubmit = async () => {
  if (!selectedPepperId.value) {
    $q.notify({
      color: 'negative',
      message: 'Выберите перец для размещения',
      icon: 'error',
    });
    return;
  }

  if (formRef.value) {
    const isValid = await formRef.value.validate();
    if (!isValid) {
      return;
    }
  }

  emit('assign', {
    pepperId: selectedPepperId.value,
    notes: notes.value ? notes.value.trim() : null,
    row: props.slot.row,
    column: props.slot.column,
  });
};

const goToAddPepper = () => {
  close();
  $router.push({ path: '/add-pepper', query: { from: 'seedling-trays', trayId: props.trayId } });
};
</script>

<style scoped>
.seedling-slot-dialog {
  min-width: min(520px, 90vw);
}

@media (max-width: 600px) {
  .seedling-slot-dialog {
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    border-radius: 0;
  }
}
</style>


