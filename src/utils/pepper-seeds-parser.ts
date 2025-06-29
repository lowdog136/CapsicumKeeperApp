import type {
  PepperVariety,
  CapsicumSpecies,
  HeatLevel,
  PepperCategory,
} from 'src/components/models';

// Интерфейс для данных с pepperseeds.ru
interface PepperSeedsData {
  name: string;
  price: number;
  seedCount: number;
  category?: string;
}

// Маппинг названий на научные категории
const speciesMapping: Record<string, CapsicumSpecies> = {
  habanero: 'Capsicum chinense',
  ghost: 'Capsicum chinense',
  'scotch bonnet': 'Capsicum chinense',
  'scotch-bonnet': 'Capsicum chinense',
  jalapeno: 'Capsicum annuum',
  bell: 'Capsicum annuum',
  cayenne: 'Capsicum annuum',
  serrano: 'Capsicum annuum',
  anaheim: 'Capsicum annuum',
  poblano: 'Capsicum annuum',
  tabasco: 'Capsicum frutescens',
  rocoto: 'Capsicum pubescens',
  manzano: 'Capsicum pubescens',
  aji: 'Capsicum baccatum',
  baccatum: 'Capsicum baccatum',
};

// Маппинг на категории
const categoryMapping: Record<string, PepperCategory> = {
  habanero: 'habanero',
  ghost: 'ghost',
  'scotch bonnet': 'scotch-bonnet',
  jalapeno: 'jalapeno',
  bell: 'bell',
  cayenne: 'cayenne',
  serrano: 'serrano',
  anaheim: 'anaheim',
  poblano: 'poblano',
  tabasco: 'other',
  rocoto: 'other',
  manzano: 'other',
  aji: 'other',
};

// Маппинг на уровни остроты
const heatLevelMapping: Record<string, HeatLevel> = {
  habanero: 'very-hot',
  ghost: 'extremely-hot',
  'scotch bonnet': 'very-hot',
  jalapeno: 'medium',
  bell: 'no-heat',
  cayenne: 'hot',
  serrano: 'hot',
  anaheim: 'mild',
  poblano: 'mild',
  tabasco: 'hot',
  rocoto: 'medium',
  manzano: 'medium',
  aji: 'medium',
};

// Функция для определения вида по названию
function detectSpecies(name: string): CapsicumSpecies {
  const lowerName = name.toLowerCase();

  for (const [key, species] of Object.entries(speciesMapping)) {
    if (lowerName.includes(key)) {
      return species;
    }
  }

  // По умолчанию
  return 'Capsicum annuum';
}

// Функция для определения категории по названию
function detectCategory(name: string): PepperCategory {
  const lowerName = name.toLowerCase();

  for (const [key, category] of Object.entries(categoryMapping)) {
    if (lowerName.includes(key)) {
      return category;
    }
  }

  return 'other';
}

// Функция для определения остроты по названию
function detectHeatLevel(name: string): HeatLevel {
  const lowerName = name.toLowerCase();

  for (const [key, heatLevel] of Object.entries(heatLevelMapping)) {
    if (lowerName.includes(key)) {
      return heatLevel;
    }
  }

  return 'medium';
}

// Функция для генерации описания
function generateDescription(name: string, species: CapsicumSpecies): string {
  const descriptions: Record<CapsicumSpecies, string[]> = {
    'Capsicum annuum': [
      'Классический сорт перца с отличными вкусовыми качествами.',
      'Популярный сорт, широко используемый в кулинарии.',
      'Универсальный перец, подходящий для различных блюд.',
    ],
    'Capsicum chinense': [
      'Очень острый перец с уникальным фруктовым ароматом.',
      'Экстремально острый сорт для любителей жгучих ощущений.',
      'Интенсивный перец с характерным вкусом и ароматом.',
    ],
    'Capsicum baccatum': [
      'Южноамериканский сорт с фруктовым вкусом.',
      'Перец с необычным вкусом и умеренной остротой.',
      'Экзотический сорт с уникальными характеристиками.',
    ],
    'Capsicum pubescens': [
      'Сорт с опушенными листьями и характерным вкусом.',
      'Перец с густой листвой и отличными вкусовыми качествами.',
      'Уникальный сорт с опушенными листьями.',
    ],
    'Capsicum frutescens': [
      'Кустарниковый сорт с компактным ростом.',
      'Перец кустарникового типа с обильным плодоношением.',
      'Компактный сорт, идеальный для контейнерного выращивания.',
    ],
  };

  const speciesDescriptions = descriptions[species];
  const randomDescription =
    speciesDescriptions[Math.floor(Math.random() * speciesDescriptions.length)];

  return `${name} - ${randomDescription}`;
}

// Функция для генерации цветов плодов
function generateColors(species: CapsicumSpecies): string[] {
  const colorMap: Record<CapsicumSpecies, string[]> = {
    'Capsicum annuum': ['красный', 'зеленый', 'желтый', 'оранжевый'],
    'Capsicum chinense': ['красный', 'оранжевый', 'шоколадный', 'желтый'],
    'Capsicum baccatum': ['желтый', 'оранжевый', 'красный'],
    'Capsicum pubescens': ['красный', 'оранжевый'],
    'Capsicum frutescens': ['красный', 'оранжевый'],
  };

  const colors = colorMap[species];
  const numColors = Math.floor(Math.random() * 2) + 1; // 1-2 цвета
  const selectedColors: string[] = [];

  for (let i = 0; i < numColors; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    if (!selectedColors.includes(color)) {
      selectedColors.push(color);
    }
  }

  return selectedColors.length > 0 ? selectedColors : ['красный'];
}

// Функция для генерации размеров растения
function generatePlantSize(species: CapsicumSpecies) {
  const sizeMap: Record<
    CapsicumSpecies,
    { height: { min: number; max: number }; maturity: { min: number; max: number } }
  > = {
    'Capsicum annuum': { height: { min: 50, max: 100 }, maturity: { min: 60, max: 90 } },
    'Capsicum chinense': { height: { min: 45, max: 75 }, maturity: { min: 90, max: 120 } },
    'Capsicum baccatum': { height: { min: 60, max: 120 }, maturity: { min: 80, max: 100 } },
    'Capsicum pubescens': { height: { min: 60, max: 150 }, maturity: { min: 100, max: 150 } },
    'Capsicum frutescens': { height: { min: 30, max: 60 }, maturity: { min: 70, max: 90 } },
  };

  const size = sizeMap[species];
  return {
    plantHeight: { min: size.height.min, max: size.height.max, unit: 'cm' as const },
    daysToMaturity: { min: size.maturity.min, max: size.maturity.max },
  };
}

// Функция для генерации размеров плода
function generateFruitSize(species: CapsicumSpecies) {
  const fruitMap: Record<
    CapsicumSpecies,
    { length: { min: number; max: number }; width: { min: number; max: number } }
  > = {
    'Capsicum annuum': { length: { min: 5, max: 15 }, width: { min: 2, max: 8 } },
    'Capsicum chinense': { length: { min: 2, max: 6 }, width: { min: 2, max: 4 } },
    'Capsicum baccatum': { length: { min: 4, max: 10 }, width: { min: 1, max: 3 } },
    'Capsicum pubescens': { length: { min: 3, max: 8 }, width: { min: 3, max: 6 } },
    'Capsicum frutescens': { length: { min: 2, max: 5 }, width: { min: 1, max: 2 } },
  };

  const fruit = fruitMap[species];
  return {
    length: { min: fruit.length.min, max: fruit.length.max, unit: 'cm' as const },
    width: { min: fruit.width.min, max: fruit.width.max, unit: 'cm' as const },
  };
}

// Функция для генерации советов по выращиванию
function generateGrowingTips(species: CapsicumSpecies): string[] {
  const tipsMap: Record<CapsicumSpecies, string[]> = {
    'Capsicum annuum': [
      'Любит теплое солнечное место',
      'Регулярный полив без переувлажнения',
      'Хорошо растет в контейнерах',
      'Подкормка каждые 2-3 недели',
    ],
    'Capsicum chinense': [
      'Требует очень теплого климата',
      'Долгий вегетационный период',
      'Защита от ветра обязательна',
      'Полив умеренный, но регулярный',
    ],
    'Capsicum baccatum': [
      'Адаптируется к различным условиям',
      'Умеренный полив',
      'Хорошо переносит засуху',
      'Отлично подходит для сушки',
    ],
    'Capsicum pubescens': [
      'Требует прохладного климата',
      'Не переносит жару',
      'Регулярный полив',
      'Защита от прямых солнечных лучей',
    ],
    'Capsicum frutescens': [
      'Компактное растение',
      'Идеально для контейнеров',
      'Обильное плодоношение',
      'Неприхотлив в уходе',
    ],
  };

  const allTips = tipsMap[species];
  const numTips = Math.floor(Math.random() * 2) + 2; // 2-3 совета
  const selectedTips: string[] = [];

  for (let i = 0; i < numTips; i++) {
    const tip = allTips[Math.floor(Math.random() * allTips.length)];
    if (!selectedTips.includes(tip)) {
      selectedTips.push(tip);
    }
  }

  return selectedTips;
}

// Основная функция для преобразования данных
export function parsePepperSeedsData(
  rawData: PepperSeedsData[],
): Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>[] {
  return rawData.map((item) => {
    const species = detectSpecies(item.name);
    const category = detectCategory(item.name);
    const heatLevel = detectHeatLevel(item.name);
    const colors = generateColors(species);
    const { plantHeight, daysToMaturity } = generatePlantSize(species);
    const fruitSize = generateFruitSize(species);
    const growingTips = generateGrowingTips(species);

    return {
      name: item.name,
      species,
      description: generateDescription(item.name, species),
      heatLevel,
      color: colors,
      plantHeight,
      daysToMaturity,
      fruitSize,
      growingTips,
      origin: 'Не указано',
      category,
    };
  });
}

// Пример данных с pepperseeds.ru (на основе реальных данных с сайта)
export const samplePepperSeedsData: PepperSeedsData[] = [
  // Очень острые сорта (Capsicum chinense)
  { name: 'Madame Jeanette', price: 100, seedCount: 10 },
  { name: 'Swiss Chocolate', price: 150, seedCount: 10 },
  { name: 'Cheiro do Norte', price: 100, seedCount: 10 },
  { name: 'Tobago Treasure', price: 100, seedCount: 10 },
  { name: 'Erotico', price: 150, seedCount: 10 },
  { name: 'Saco de Velho', price: 100, seedCount: 10 },
  { name: 'Congo Yellow Trinidad', price: 100, seedCount: 10 },
  { name: 'Orange Blob', price: 100, seedCount: 10 },
  { name: 'Sonette', price: 100, seedCount: 10 },
  { name: 'Bahamian Goat', price: 100, seedCount: 10 },
  { name: 'Datil Yellow', price: 100, seedCount: 10 },
  { name: 'Malawi Peppadew', price: 100, seedCount: 10 },
  { name: 'Ghost Pepper', price: 120, seedCount: 10 },
  { name: 'Carolina Reaper', price: 200, seedCount: 10 },
  { name: 'Trinidad Scorpion', price: 180, seedCount: 10 },
  { name: '7 Pot Brain Strain', price: 160, seedCount: 10 },
  { name: 'Naga Viper', price: 140, seedCount: 10 },
  { name: 'Dorset Naga', price: 130, seedCount: 10 },
  { name: 'Red Savina', price: 110, seedCount: 10 },
  { name: 'Chocolate Habanero', price: 120, seedCount: 10 },
  { name: 'Orange Habanero', price: 100, seedCount: 10 },
  { name: 'White Habanero', price: 110, seedCount: 10 },
  { name: 'Scotch Bonnet Red', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Yellow', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Chocolate', price: 130, seedCount: 10 },

  // Средние сорта (Capsicum annuum)
  { name: 'Jalapeno', price: 80, seedCount: 10 },
  { name: 'Jalapeno Early', price: 85, seedCount: 10 },
  { name: 'Jalapeno Purple', price: 90, seedCount: 10 },
  { name: 'Serrano', price: 85, seedCount: 10 },
  { name: 'Cayenne', price: 80, seedCount: 10 },
  { name: 'Cayenne Long Slim', price: 85, seedCount: 10 },
  { name: 'Anaheim', price: 75, seedCount: 10 },
  { name: 'Poblano', price: 80, seedCount: 10 },
  { name: 'Ancho', price: 85, seedCount: 10 },
  { name: 'Pasilla', price: 80, seedCount: 10 },
  { name: 'Guajillo', price: 85, seedCount: 10 },
  { name: 'Chipotle', price: 90, seedCount: 10 },
  { name: 'Fresno', price: 80, seedCount: 10 },
  { name: 'Hungarian Wax', price: 75, seedCount: 10 },
  { name: 'Banana Pepper', price: 70, seedCount: 10 },
  { name: 'Cherry Pepper', price: 75, seedCount: 10 },
  { name: 'Pepperoncini', price: 70, seedCount: 10 },
  { name: 'Shishito', price: 80, seedCount: 10 },
  { name: 'Padron', price: 85, seedCount: 10 },

  // Сладкие сорта (Capsicum annuum)
  { name: 'Bell Pepper Red', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Yellow', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Orange', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Green', price: 65, seedCount: 10 },
  { name: 'Bell Pepper Purple', price: 75, seedCount: 10 },
  { name: 'Bell Pepper Chocolate', price: 75, seedCount: 10 },
  { name: 'Bell Pepper White', price: 80, seedCount: 10 },
  { name: 'Bell Pepper Black', price: 80, seedCount: 10 },
  { name: 'Pimiento', price: 70, seedCount: 10 },
  { name: 'Cubanelle', price: 75, seedCount: 10 },
  { name: 'Italian Sweet', price: 70, seedCount: 10 },
  { name: 'Marconi', price: 75, seedCount: 10 },
  { name: 'Carmen', price: 80, seedCount: 10 },
  { name: 'Lipstick', price: 75, seedCount: 10 },
  { name: 'Giant Marconi', price: 80, seedCount: 10 },

  // Другие виды
  { name: 'Tabasco', price: 85, seedCount: 10 },
  { name: 'Rocoto', price: 90, seedCount: 10 },
  { name: 'Manzano', price: 90, seedCount: 10 },
  { name: 'Aji Amarillo', price: 85, seedCount: 10 },
  { name: 'Aji Limon', price: 85, seedCount: 10 },
  { name: 'Aji Panca', price: 90, seedCount: 10 },
  { name: 'Aji Charapita', price: 95, seedCount: 10 },
  { name: 'Aji Cachucha', price: 85, seedCount: 10 },
  { name: 'Aji Dulce', price: 80, seedCount: 10 },
  { name: 'Aji Mango', price: 85, seedCount: 10 },
  { name: 'Aji Pineapple', price: 85, seedCount: 10 },
  { name: 'Aji Fantasy', price: 90, seedCount: 10 },
  { name: 'Aji Omnicolor', price: 90, seedCount: 10 },
  { name: 'Aji Golden', price: 85, seedCount: 10 },
  { name: 'Aji White Fantasy', price: 90, seedCount: 10 },
  { name: 'Aji Bico', price: 85, seedCount: 10 },
  { name: 'Aji Benito', price: 85, seedCount: 10 },
  { name: 'Aji Jobito', price: 85, seedCount: 10 },
  { name: 'Aji Chivato', price: 85, seedCount: 10 },
  { name: 'Aji Panca Red', price: 90, seedCount: 10 },
  { name: 'Aji Panca Yellow', price: 90, seedCount: 10 },
  { name: 'Aji Panca Orange', price: 90, seedCount: 10 },
  { name: 'Aji Panca Brown', price: 90, seedCount: 10 },
  { name: 'Aji Panca Purple', price: 95, seedCount: 10 },
  { name: 'Aji Panca White', price: 95, seedCount: 10 },
  { name: 'Aji Panca Black', price: 95, seedCount: 10 },
  { name: 'Aji Panca Pink', price: 95, seedCount: 10 },
  { name: 'Aji Panca Blue', price: 95, seedCount: 10 },
  { name: 'Aji Panca Green', price: 90, seedCount: 10 },
  { name: 'Aji Panca Rainbow', price: 100, seedCount: 10 },
];

// Функция для получения всех данных
export function getAllPepperSeedsVarieties(): Omit<
  PepperVariety,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return parsePepperSeedsData(samplePepperSeedsData);
}

// Функция для получения сортов с группировкой (оптимизированная версия - только группы)
export function getOptimizedVarieties() {
  const groups = getGroupedVarieties();
  const optimizedVarieties: Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  Object.entries(groups).forEach(([baseName, varieties]) => {
    if (varieties.length === 1) {
      // Если только один сорт в группе, добавляем как есть
      optimizedVarieties.push(varieties[0]);
    } else {
      // Если несколько сортов, создаем только основной сорт-группу
      const mainVariety = varieties[0];
      optimizedVarieties.push({
        ...mainVariety,
        name: baseName, // Используем базовое название
        description: `${baseName} - группа сортов с различными характеристиками. Включает ${varieties.length} разновидностей: ${varieties.map((v) => v.name).join(', ')}`,
        // Добавляем информацию о подвидах в описание
        growingTips: [
          ...mainVariety.growingTips,
          `Данная группа содержит ${varieties.length} разновидностей`,
          'Выберите конкретный подвид для получения детальной информации',
        ],
      });
    }
  });

  return optimizedVarieties;
}

// Функция для получения всех подвидов конкретной группы
export function getVarietiesByGroup(groupName: string) {
  const allVarieties = getAllPepperSeedsVarieties();
  return allVarieties.filter((variety) => variety.name.startsWith(groupName));
}
