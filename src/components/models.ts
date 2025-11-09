import type { PlantProblem } from 'stores/plant-problems-library';

export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Observation {
  date: string;
  height?: number;
  leafCondition: string;
  note?: string;
  problems?: PlantProblem[];
}

export interface Pepper {
  id: string;
  userId: string; // ID пользователя, которому принадлежит перец
  name: string;
  variety: string;
  photoUrl: string;
  description: string;
  stage: 'проращивание' | 'рассада' | 'вегетация' | 'плодоношение' | 'сбор урожая';
  stageHistory?: { date: string; stage: Pepper['stage'] }[];
  plantingDate: string;
  fertilizingHistory: {
    date: string;
    note?: string;
    grams?: number;
    composition?: FertilizerComposition;
  }[];
  wateringHistory: { date: string; volume?: number }[];
  location: {
    type: 'грунт' | 'теплица' | 'огород' | 'горшок' | 'кассета для проращивания';
    potVolume?: string;
  };
  locationHistory?: { date: string; type: Pepper['location']['type']; potVolume?: string }[];
  treatmentHistory?: { date: string; agent: string; volume?: number }[];
  isFavorite?: boolean;
  observationLog?: Observation[];
  soilExtras?: {
    hasDrainage: boolean;
    drainage: string | null;
    hasSoilImprovement: boolean;
    soilImprovement: string | null;
  };
  seedlingSlot?: {
    trayId: string;
    trayName?: string;
    row: number;
    column: number;
    assignedAt: string;
  };
  // Информация о выбранном сорте из библиотеки
  varietyInfo?: {
    id: string;
    species: CapsicumSpecies;
    heatLevel: HeatLevel;
    origin?: string;
    color: string[];
    plantHeight: {
      min: number;
      max: number;
      unit: 'cm' | 'inches';
    };
    daysToMaturity: {
      min: number;
      max: number;
    };
    fruitSize: {
      length: {
        min: number;
        max: number;
        unit: 'cm' | 'inches';
      };
      width: {
        min: number;
        max: number;
        unit: 'cm' | 'inches';
      };
    };
    growingTips: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface FertilizerComposition {
  // Макроэлементы (основные)
  N?: number; // Азот
  P?: number; // Фосфор
  K?: number; // Калий
  Ca?: number; // Кальций
  Mg?: number; // Магний
  S?: number; // Сера

  // Микроэлементы
  Fe?: number; // Железо
  Mn?: number; // Марганец
  Zn?: number; // Цинк
  Cu?: number; // Медь
  B?: number; // Бор
  Mo?: number; // Молибден
  Cl?: number; // Хлор
  Co?: number; // Кобальт
  Ni?: number; // Никель
  Si?: number; // Кремний

  [key: string]: number | undefined;
}

export interface WateringEntry {
  date: string;
  volume?: number;
}
export interface FertilizingEntry {
  date: string;
  note?: string;
  grams?: number;
  composition?: FertilizerComposition;
}
export interface TreatmentEntry {
  date: string;
  agent: string;
  volume?: number;
}

// Библиотека сортов перцев
export interface PepperVariety {
  id: string;
  name: string;
  scientificName?: string;
  species: CapsicumSpecies;
  description: string;
  heatLevel: HeatLevel;
  color: string[];
  plantHeight: {
    min: number;
    max: number;
    unit: 'cm' | 'inches';
  };
  daysToMaturity: {
    min: number;
    max: number;
  };
  fruitSize: {
    length: {
      min: number;
      max: number;
      unit: 'cm' | 'inches';
    };
    width: {
      min: number;
      max: number;
      unit: 'cm' | 'inches';
    };
  };
  growingTips: string[];
  origin?: string;
  category: PepperCategory;
  imageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HeatLevel =
  | 'no-heat' // 0 SHU
  | 'very-mild' // 100-500 SHU
  | 'mild' // 500-2500 SHU
  | 'medium' // 2500-8000 SHU
  | 'hot' // 8000-50000 SHU
  | 'very-hot' // 50000-100000 SHU
  | 'extremely-hot'; // 100000+ SHU;

export type PepperCategory =
  | 'bell' // Болгарский
  | 'jalapeno' // Халапеньо
  | 'habanero' // Хабанеро
  | 'cayenne' // Кайенский
  | 'serrano' // Серрано
  | 'anaheim' // Анахайм
  | 'poblano' // Поблано
  | 'ghost' // Призрак
  | 'scotch-bonnet' // Шотландская шапочка
  | 'other'; // Другие

export type CapsicumSpecies =
  | 'Capsicum annuum' // Самый распространенный вид
  | 'Capsicum chinense' // Очень острые сорта (Хабанеро, Призрак)
  | 'Capsicum baccatum' // Южноамериканские сорта
  | 'Capsicum pubescens' // Рокото, Манзано
  | 'Capsicum frutescens'; // Табаско, Малагита

export interface HeatLevelInfo {
  level: HeatLevel;
  name: string;
  shuRange: string;
  description: string;
  color: string;
}

// Дорожная карта приложения
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'ui' | 'backend';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  estimatedEffort?: 'small' | 'medium' | 'large' | null;
  targetVersion?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  assignee?: string; // email пользователя
}
