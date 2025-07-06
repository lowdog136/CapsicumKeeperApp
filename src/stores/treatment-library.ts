import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface TreatmentAgent {
  id: string;
  name: string;
  description?: string;
  category: 'pesticide' | 'fungicide' | 'herbicide' | 'insecticide' | 'bio' | 'other';
  activeIngredient?: string;
  manufacturer?: string;
  concentration?: number; // концентрация активного вещества в %
  unit?: 'ml/l' | 'g/l' | 'ppm' | 'other';
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useTreatmentLibrary = defineStore('treatment-library', () => {
  const treatments = ref<TreatmentAgent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Предустановленные средства обработки
  const defaultTreatments: TreatmentAgent[] = [
    {
      id: 'copper-sulfate',
      name: 'Медный купорос',
      description: 'Фунгицид для профилактики грибковых заболеваний',
      category: 'fungicide',
      activeIngredient: 'Сульфат меди',
      manufacturer: 'Стандарт',
      concentration: 1,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bordeaux-mixture',
      name: 'Бордосская жидкость',
      description: 'Классический фунгицид на основе меди',
      category: 'fungicide',
      activeIngredient: 'Сульфат меди + гидроксид кальция',
      manufacturer: 'Стандарт',
      concentration: 1,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'neem-oil',
      name: 'Масло нима',
      description: 'Природный инсектицид и фунгицид',
      category: 'bio',
      activeIngredient: 'Азадирахтин',
      manufacturer: 'Био',
      concentration: 2,
      unit: 'ml/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'soap-solution',
      name: 'Мыльный раствор',
      description: 'Безопасное средство от тли и других вредителей',
      category: 'bio',
      activeIngredient: 'Калиевое мыло',
      manufacturer: 'Домашний',
      concentration: 20,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'hydrogen-peroxide',
      name: 'Перекись водорода',
      description: 'Антисептик для обработки семян и корней',
      category: 'bio',
      activeIngredient: 'H2O2',
      manufacturer: 'Аптека',
      concentration: 3,
      unit: 'ml/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'potassium-permanganate',
      name: 'Марганцовка',
      description: 'Антисептик для обработки семян и почвы',
      category: 'bio',
      activeIngredient: 'Перманганат калия',
      manufacturer: 'Аптека',
      concentration: 0.1,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'garlic-infusion',
      name: 'Чесночный настой',
      description: 'Народное средство от вредителей',
      category: 'bio',
      activeIngredient: 'Аллицин',
      manufacturer: 'Домашний',
      concentration: 100,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tobacco-infusion',
      name: 'Табачный настой',
      description: 'Народное средство от тли и клещей',
      category: 'bio',
      activeIngredient: 'Никотин',
      manufacturer: 'Домашний',
      concentration: 50,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ash-solution',
      name: 'Зольный раствор',
      description: 'Калийное удобрение и средство от вредителей',
      category: 'bio',
      activeIngredient: 'Карбонат калия',
      manufacturer: 'Домашний',
      concentration: 200,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'baking-soda',
      name: 'Пищевая сода',
      description: 'Средство от мучнистой росы',
      category: 'bio',
      activeIngredient: 'Бикарбонат натрия',
      manufacturer: 'Домашний',
      concentration: 10,
      unit: 'g/l',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Инициализация с предустановленными средствами
  function initializeTreatments() {
    treatments.value = [...defaultTreatments];
  }

  // Добавить новое средство
  function addTreatment(treatment: Omit<TreatmentAgent, 'id' | 'createdAt' | 'updatedAt'>) {
    const newTreatment: TreatmentAgent = {
      ...treatment,
      id: `treatment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    treatments.value.push(newTreatment);
    return newTreatment;
  }

  // Найти средство по названию
  function findTreatmentByName(name: string): TreatmentAgent | undefined {
    return treatments.value.find((t) => t.name.toLowerCase() === name.toLowerCase());
  }

  // Получить все средства
  function getAllTreatments(): TreatmentAgent[] {
    return treatments.value;
  }

  // Получить средства по категории
  function getTreatmentsByCategory(category: TreatmentAgent['category']): TreatmentAgent[] {
    return treatments.value.filter((t) => t.category === category);
  }

  // Поиск средств
  function searchTreatments(query: string): TreatmentAgent[] {
    const searchTerm = query.toLowerCase();
    return treatments.value.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm) ||
        t.activeIngredient?.toLowerCase().includes(searchTerm) ||
        t.manufacturer?.toLowerCase().includes(searchTerm),
    );
  }

  // Удалить средство
  function removeTreatment(id: string) {
    const index = treatments.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      treatments.value.splice(index, 1);
    }
  }

  // Переключить избранное
  function toggleFavorite(id: string) {
    const treatment = treatments.value.find((t) => t.id === id);
    if (treatment) {
      treatment.isFavorite = !treatment.isFavorite;
      treatment.updatedAt = new Date().toISOString();
    }
  }

  return {
    treatments,
    loading,
    error,
    initializeTreatments,
    addTreatment,
    findTreatmentByName,
    getAllTreatments,
    getTreatmentsByCategory,
    searchTreatments,
    removeTreatment,
    toggleFavorite,
  };
});
