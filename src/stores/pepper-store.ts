import { defineStore } from 'pinia';
import { watch } from 'vue';
import type { Pepper, Observation } from 'components/models';

const STORAGE_KEY = 'peppers';

function getInitialPeppers(): Pepper[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore parse error, fallback to default
    }
  }
  return [
    {
      id: 'P001',
      name: 'Перец сладкий',
      variety: 'Калифорнийское чудо',
      photoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/5/5a/Capsicum_annuum_fruits_IMGP0032.jpg',
      description:
        'Крупный сладкий перец с толстыми стенками, подходит для теплиц и открытого грунта.',
      stage: 'рассада',
      stageHistory: [
        { date: '2024-03-15', stage: 'проращивание' },
        { date: '2024-03-20', stage: 'рассада' },
      ],
      plantingDate: '2024-03-15',
      fertilizingHistory: [
        { date: '2024-04-01', note: 'Комплексное удобрение', composition: { N: 10, P: 5, K: 10 } },
        { date: '2024-04-20', note: 'Азотное удобрение', composition: { N: 34 } },
      ],
      wateringHistory: [{ date: '2024-05-01', volume: 200 }],
      location: { type: 'горшок', potVolume: '3 л' },
      locationHistory: [
        { date: '2024-03-15', type: 'кассета для проращивания' },
        { date: '2024-03-20', type: 'горшок', potVolume: '3 л' },
      ],
      observationLog: [{ date: '2024-04-10', height: 15, leafCondition: 'Чистые' }],
      isFavorite: false,
    },
    {
      id: 'P002',
      name: 'Перец острый',
      variety: 'Чили',
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Red_chili_pepper.jpg',
      description: 'Острый сорт для любителей пикантных блюд. Хорошо растет в теплице.',
      stage: 'вегетация',
      stageHistory: [
        { date: '2024-03-10', stage: 'проращивание' },
        { date: '2024-03-15', stage: 'рассада' },
        { date: '2024-04-01', stage: 'вегетация' },
      ],
      plantingDate: '2024-03-10',
      fertilizingHistory: [
        { date: '2024-04-05', note: 'Фосфорное удобрение', composition: { P: 20 } },
      ],
      wateringHistory: [{ date: '2024-05-02', volume: 150 }],
      location: { type: 'теплица' },
      locationHistory: [
        { date: '2024-03-10', type: 'кассета для проращивания' },
        { date: '2024-03-20', type: 'теплица' },
      ],
      observationLog: [],
      isFavorite: false,
    },
    {
      id: 'P003',
      name: 'Перец сладкий',
      variety: 'Биг мама',
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Orange_Bell_Pepper.jpg',
      description: 'Очень крупный и сочный перец, отлично подходит для фарширования.',
      stage: 'плодоношение',
      stageHistory: [
        { date: '2024-03-12', stage: 'проращивание' },
        { date: '2024-03-18', stage: 'рассада' },
        { date: '2024-04-05', stage: 'вегетация' },
        { date: '2024-05-01', stage: 'плодоношение' },
      ],
      plantingDate: '2024-03-12',
      fertilizingHistory: [],
      wateringHistory: [{ date: '2024-05-03', volume: 180 }],
      location: { type: 'грунт' },
      locationHistory: [
        { date: '2024-03-12', type: 'кассета для проращивания' },
        { date: '2024-03-25', type: 'грунт' },
      ],
      observationLog: [],
      isFavorite: false,
    },
  ];
}

function getNextId(peppers: Pepper[]): string {
  const maxNum = peppers.length
    ? Math.max(
        ...peppers.map((p) =>
          typeof p.id === 'string' && p.id.startsWith('P')
            ? parseInt(p.id.replace('P', '')) || 0
            : 0,
        ),
      )
    : 0;
  return `P${(maxNum + 1).toString().padStart(3, '0')}`;
}

export const usePepperStore = defineStore('pepper', {
  state: () => ({
    peppers: getInitialPeppers(),
    nextId: getNextId(getInitialPeppers()),
  }),
  actions: {
    addPepper(pepper: Omit<Pepper, 'id'>) {
      const locationHistoryEntry: {
        date: string;
        type: Pepper['location']['type'];
        potVolume?: string;
      } = {
        date: pepper.plantingDate,
        type: pepper.location.type,
      };
      if (pepper.location.potVolume !== undefined) {
        locationHistoryEntry.potVolume = pepper.location.potVolume;
      }
      this.peppers.push({
        ...pepper,
        id: this.nextId,
        isFavorite: false,
        observationLog: [],
        stageHistory: [{ date: pepper.plantingDate, stage: pepper.stage }],
        locationHistory: [locationHistoryEntry],
      });
      this.nextId = getNextId(this.peppers);
    },
    deletePepper(id: string) {
      const index = this.peppers.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.peppers.splice(index, 1);
      }
    },
    toggleFavorite(id: string) {
      const pepper = this.peppers.find((p) => p.id === id);
      if (pepper) {
        pepper.isFavorite = !pepper.isFavorite;
      }
    },
    addObservation(pepperId: string, observation: Observation) {
      const pepper = this.peppers.find((p) => p.id === pepperId);
      if (pepper) {
        if (!pepper.observationLog) {
          pepper.observationLog = [];
        }
        pepper.observationLog.push(observation);
      }
    },
    updatePepperField(id: string, field: keyof Pepper, value: unknown) {
      const pepper = this.peppers.find((p) => p.id === id);
      if (pepper && field in pepper) {
        (pepper as Pepper)[field] = value as never;
      }
    },
    changeStage(id: string, newStage: Pepper['stage']) {
      const pepper = this.peppers.find((p) => p.id === id);
      if (pepper && pepper.stage !== newStage) {
        pepper.stage = newStage;
        if (!pepper.stageHistory) pepper.stageHistory = [];
        const today = new Date().toISOString().slice(0, 10);
        pepper.stageHistory.push({ date: today, stage: newStage });
      }
    },
  },
});

// Сохраняем peppers в localStorage при каждом изменении
watch(
  () => usePepperStore().peppers,
  (peppers) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(peppers));
  },
  { deep: true },
);
