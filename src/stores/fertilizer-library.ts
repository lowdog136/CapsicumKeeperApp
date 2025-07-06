import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FertilizerComposition } from 'components/models';

export interface Fertilizer {
  id: string;
  name: string;
  description?: string;
  composition: FertilizerComposition;
  category: 'organic' | 'mineral' | 'complex' | 'micro' | 'other';
  manufacturer?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useFertilizerLibrary = defineStore('fertilizer-library', () => {
  const fertilizers = ref<Fertilizer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Предустановленные удобрения
  const defaultFertilizers: Fertilizer[] = [
    {
      id: 'npk-16-16-16',
      name: 'NPK 16-16-16',
      description: 'Сбалансированное комплексное удобрение',
      composition: { N: 16, P: 16, K: 16 },
      category: 'complex',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'npk-20-20-20',
      name: 'NPK 20-20-20',
      description: 'Высококонцентрированное комплексное удобрение',
      composition: { N: 20, P: 20, K: 20 },
      category: 'complex',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ammonium-nitrate',
      name: 'Аммиачная селитра',
      description: 'Азотное удобрение',
      composition: { N: 34 },
      category: 'mineral',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'superphosphate',
      name: 'Суперфосфат',
      description: 'Фосфорное удобрение',
      composition: { P: 20, Ca: 12 },
      category: 'mineral',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'potassium-sulfate',
      name: 'Сульфат калия',
      description: 'Калийное удобрение',
      composition: { K: 50, S: 18 },
      category: 'mineral',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'calcium-nitrate',
      name: 'Кальциевая селитра',
      description: 'Кальциевое удобрение',
      composition: { N: 15, Ca: 19 },
      category: 'mineral',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'magnesium-sulfate',
      name: 'Сульфат магния',
      description: 'Магниевое удобрение',
      composition: { Mg: 16, S: 13 },
      category: 'mineral',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'iron-chelate',
      name: 'Хелат железа',
      description: 'Железосодержащее удобрение',
      composition: { Fe: 13 },
      category: 'micro',
      manufacturer: 'Стандарт',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'compost',
      name: 'Компост',
      description: 'Органическое удобрение',
      composition: { N: 2, P: 1, K: 1, Ca: 1, Mg: 0.5 },
      category: 'organic',
      manufacturer: 'Домашний',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Инициализация с предустановленными удобрениями
  function initializeFertilizers() {
    fertilizers.value = [...defaultFertilizers];
  }

  // Добавить новое удобрение
  function addFertilizer(fertilizer: Omit<Fertilizer, 'id' | 'createdAt' | 'updatedAt'>) {
    const newFertilizer: Fertilizer = {
      ...fertilizer,
      id: `fertilizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fertilizers.value.push(newFertilizer);
    return newFertilizer;
  }

  // Найти удобрение по названию
  function findFertilizerByName(name: string): Fertilizer | undefined {
    return fertilizers.value.find((f) => f.name.toLowerCase() === name.toLowerCase());
  }

  // Получить все удобрения
  function getAllFertilizers(): Fertilizer[] {
    return fertilizers.value;
  }

  // Получить удобрения по категории
  function getFertilizersByCategory(category: Fertilizer['category']): Fertilizer[] {
    return fertilizers.value.filter((f) => f.category === category);
  }

  // Поиск удобрений
  function searchFertilizers(query: string): Fertilizer[] {
    const searchTerm = query.toLowerCase();
    return fertilizers.value.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm) ||
        f.description?.toLowerCase().includes(searchTerm) ||
        f.manufacturer?.toLowerCase().includes(searchTerm),
    );
  }

  // Удалить удобрение
  function removeFertilizer(id: string) {
    const index = fertilizers.value.findIndex((f) => f.id === id);
    if (index !== -1) {
      fertilizers.value.splice(index, 1);
    }
  }

  // Переключить избранное
  function toggleFavorite(id: string) {
    const fertilizer = fertilizers.value.find((f) => f.id === id);
    if (fertilizer) {
      fertilizer.isFavorite = !fertilizer.isFavorite;
      fertilizer.updatedAt = new Date().toISOString();
    }
  }

  return {
    fertilizers,
    loading,
    error,
    initializeFertilizers,
    addFertilizer,
    findFertilizerByName,
    getAllFertilizers,
    getFertilizersByCategory,
    searchFertilizers,
    removeFertilizer,
    toggleFavorite,
  };
});
