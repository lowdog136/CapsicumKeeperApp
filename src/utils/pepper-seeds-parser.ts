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

// Пример данных с pepperseeds.ru (расширенная коллекция с группировкой)
export const samplePepperSeedsData: PepperSeedsData[] = [
  // === CAPSICUM CHINENSE (Очень острые сорта) ===

  // Habanero группа
  { name: 'Habanero Red', price: 100, seedCount: 10 },
  { name: 'Habanero Orange', price: 100, seedCount: 10 },
  { name: 'Habanero Yellow', price: 100, seedCount: 10 },
  { name: 'Habanero White', price: 110, seedCount: 10 },
  { name: 'Habanero Chocolate', price: 120, seedCount: 10 },
  { name: 'Habanero Peach', price: 110, seedCount: 10 },
  { name: 'Habanero Mustard', price: 110, seedCount: 10 },
  { name: 'Habanero Caribbean Red', price: 115, seedCount: 10 },
  { name: 'Habanero Red Savina', price: 130, seedCount: 10 },
  { name: 'Habanero Golden', price: 105, seedCount: 10 },
  { name: 'Habanero Big Sun', price: 110, seedCount: 10 },
  { name: 'Habanero Long Chocolate', price: 125, seedCount: 10 },
  { name: 'Habanero Round', price: 100, seedCount: 10 },
  { name: 'Habanero Giant White', price: 115, seedCount: 10 },
  { name: 'Habanero Giant Orange', price: 110, seedCount: 10 },
  { name: 'Habanero Giant Red', price: 110, seedCount: 10 },
  { name: 'Habanero Giant Yellow', price: 110, seedCount: 10 },
  { name: 'Habanero Giant Chocolate', price: 120, seedCount: 10 },
  { name: 'Habanero Giant Peach', price: 115, seedCount: 10 },
  { name: 'Habanero Giant Mustard', price: 115, seedCount: 10 },
  { name: 'Habanero Giant Golden', price: 115, seedCount: 10 },
  { name: 'Habanero Giant Big Sun', price: 120, seedCount: 10 },
  { name: 'Habanero Giant Long Chocolate', price: 125, seedCount: 10 },
  { name: 'Habanero Giant Round', price: 110, seedCount: 10 },

  // Scotch Bonnet группа
  { name: 'Scotch Bonnet Red', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Yellow', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Orange', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Chocolate', price: 130, seedCount: 10 },
  { name: 'Scotch Bonnet White', price: 125, seedCount: 10 },
  { name: 'Scotch Bonnet Peach', price: 125, seedCount: 10 },
  { name: 'Scotch Bonnet Mustard', price: 125, seedCount: 10 },
  { name: 'Scotch Bonnet Golden', price: 125, seedCount: 10 },
  { name: 'Scotch Bonnet Big Sun', price: 130, seedCount: 10 },
  { name: 'Scotch Bonnet Long Chocolate', price: 135, seedCount: 10 },
  { name: 'Scotch Bonnet Round', price: 120, seedCount: 10 },
  { name: 'Scotch Bonnet Giant White', price: 135, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Orange', price: 130, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Red', price: 130, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Yellow', price: 130, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Chocolate', price: 140, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Peach', price: 135, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Mustard', price: 135, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Golden', price: 135, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Big Sun', price: 140, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Long Chocolate', price: 145, seedCount: 10 },
  { name: 'Scotch Bonnet Giant Round', price: 130, seedCount: 10 },

  // Ghost Pepper группа
  { name: 'Ghost Pepper Red', price: 140, seedCount: 10 },
  { name: 'Ghost Pepper Yellow', price: 140, seedCount: 10 },
  { name: 'Ghost Pepper Orange', price: 140, seedCount: 10 },
  { name: 'Ghost Pepper Chocolate', price: 150, seedCount: 10 },
  { name: 'Ghost Pepper White', price: 145, seedCount: 10 },
  { name: 'Ghost Pepper Peach', price: 145, seedCount: 10 },
  { name: 'Ghost Pepper Mustard', price: 145, seedCount: 10 },
  { name: 'Ghost Pepper Golden', price: 145, seedCount: 10 },
  { name: 'Ghost Pepper Big Sun', price: 150, seedCount: 10 },
  { name: 'Ghost Pepper Long Chocolate', price: 155, seedCount: 10 },
  { name: 'Ghost Pepper Round', price: 140, seedCount: 10 },

  // 7 Pot группа
  { name: '7 Pot Red', price: 160, seedCount: 10 },
  { name: '7 Pot Yellow', price: 160, seedCount: 10 },
  { name: '7 Pot Orange', price: 160, seedCount: 10 },
  { name: '7 Pot Chocolate', price: 170, seedCount: 10 },
  { name: '7 Pot White', price: 165, seedCount: 10 },
  { name: '7 Pot Peach', price: 165, seedCount: 10 },
  { name: '7 Pot Mustard', price: 165, seedCount: 10 },
  { name: '7 Pot Golden', price: 165, seedCount: 10 },
  { name: '7 Pot Big Sun', price: 170, seedCount: 10 },
  { name: '7 Pot Long Chocolate', price: 175, seedCount: 10 },
  { name: '7 Pot Round', price: 160, seedCount: 10 },
  { name: '7 Pot Brain Strain Red', price: 180, seedCount: 10 },
  { name: '7 Pot Brain Strain Yellow', price: 180, seedCount: 10 },
  { name: '7 Pot Brain Strain Orange', price: 180, seedCount: 10 },
  { name: '7 Pot Brain Strain Chocolate', price: 190, seedCount: 10 },
  { name: '7 Pot Brain Strain White', price: 185, seedCount: 10 },
  { name: '7 Pot Brain Strain Peach', price: 185, seedCount: 10 },
  { name: '7 Pot Brain Strain Mustard', price: 185, seedCount: 10 },
  { name: '7 Pot Brain Strain Golden', price: 185, seedCount: 10 },
  { name: '7 Pot Brain Strain Big Sun', price: 190, seedCount: 10 },
  { name: '7 Pot Brain Strain Long Chocolate', price: 195, seedCount: 10 },
  { name: '7 Pot Brain Strain Round', price: 180, seedCount: 10 },

  // Trinidad Scorpion группа
  { name: 'Trinidad Scorpion Red', price: 180, seedCount: 10 },
  { name: 'Trinidad Scorpion Yellow', price: 180, seedCount: 10 },
  { name: 'Trinidad Scorpion Orange', price: 180, seedCount: 10 },
  { name: 'Trinidad Scorpion Chocolate', price: 190, seedCount: 10 },
  { name: 'Trinidad Scorpion White', price: 185, seedCount: 10 },
  { name: 'Trinidad Scorpion Peach', price: 185, seedCount: 10 },
  { name: 'Trinidad Scorpion Mustard', price: 185, seedCount: 10 },
  { name: 'Trinidad Scorpion Golden', price: 185, seedCount: 10 },
  { name: 'Trinidad Scorpion Big Sun', price: 190, seedCount: 10 },
  { name: 'Trinidad Scorpion Long Chocolate', price: 195, seedCount: 10 },
  { name: 'Trinidad Scorpion Round', price: 180, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Red', price: 200, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Yellow', price: 200, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Orange', price: 200, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Chocolate', price: 210, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T White', price: 205, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Peach', price: 205, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Mustard', price: 205, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Golden', price: 205, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Big Sun', price: 210, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Long Chocolate', price: 215, seedCount: 10 },
  { name: 'Trinidad Scorpion Butch T Round', price: 200, seedCount: 10 },

  // Carolina Reaper группа
  { name: 'Carolina Reaper Red', price: 200, seedCount: 10 },
  { name: 'Carolina Reaper Yellow', price: 200, seedCount: 10 },
  { name: 'Carolina Reaper Orange', price: 200, seedCount: 10 },
  { name: 'Carolina Reaper Chocolate', price: 210, seedCount: 10 },
  { name: 'Carolina Reaper White', price: 205, seedCount: 10 },
  { name: 'Carolina Reaper Peach', price: 205, seedCount: 10 },
  { name: 'Carolina Reaper Mustard', price: 205, seedCount: 10 },
  { name: 'Carolina Reaper Golden', price: 205, seedCount: 10 },
  { name: 'Carolina Reaper Big Sun', price: 210, seedCount: 10 },
  { name: 'Carolina Reaper Long Chocolate', price: 215, seedCount: 10 },
  { name: 'Carolina Reaper Round', price: 200, seedCount: 10 },

  // Naga группа
  { name: 'Naga Viper Red', price: 140, seedCount: 10 },
  { name: 'Naga Viper Yellow', price: 140, seedCount: 10 },
  { name: 'Naga Viper Orange', price: 140, seedCount: 10 },
  { name: 'Naga Viper Chocolate', price: 150, seedCount: 10 },
  { name: 'Naga Viper White', price: 145, seedCount: 10 },
  { name: 'Naga Viper Peach', price: 145, seedCount: 10 },
  { name: 'Naga Viper Mustard', price: 145, seedCount: 10 },
  { name: 'Naga Viper Golden', price: 145, seedCount: 10 },
  { name: 'Naga Viper Big Sun', price: 150, seedCount: 10 },
  { name: 'Naga Viper Long Chocolate', price: 155, seedCount: 10 },
  { name: 'Naga Viper Round', price: 140, seedCount: 10 },
  { name: 'Dorset Naga Red', price: 130, seedCount: 10 },
  { name: 'Dorset Naga Yellow', price: 130, seedCount: 10 },
  { name: 'Dorset Naga Orange', price: 130, seedCount: 10 },
  { name: 'Dorset Naga Chocolate', price: 140, seedCount: 10 },
  { name: 'Dorset Naga White', price: 135, seedCount: 10 },
  { name: 'Dorset Naga Peach', price: 135, seedCount: 10 },
  { name: 'Dorset Naga Mustard', price: 135, seedCount: 10 },
  { name: 'Dorset Naga Golden', price: 135, seedCount: 10 },
  { name: 'Dorset Naga Big Sun', price: 140, seedCount: 10 },
  { name: 'Dorset Naga Long Chocolate', price: 145, seedCount: 10 },
  { name: 'Dorset Naga Round', price: 130, seedCount: 10 },

  // === CAPSICUM ANNUUM (Средние и сладкие сорта) ===

  // Jalapeno группа
  { name: 'Jalapeno Red', price: 80, seedCount: 10 },
  { name: 'Jalapeno Yellow', price: 80, seedCount: 10 },
  { name: 'Jalapeno Orange', price: 80, seedCount: 10 },
  { name: 'Jalapeno Purple', price: 90, seedCount: 10 },
  { name: 'Jalapeno White', price: 85, seedCount: 10 },
  { name: 'Jalapeno Peach', price: 85, seedCount: 10 },
  { name: 'Jalapeno Mustard', price: 85, seedCount: 10 },
  { name: 'Jalapeno Golden', price: 85, seedCount: 10 },
  { name: 'Jalapeno Big Sun', price: 90, seedCount: 10 },
  { name: 'Jalapeno Long Chocolate', price: 95, seedCount: 10 },
  { name: 'Jalapeno Round', price: 80, seedCount: 10 },
  { name: 'Jalapeno Early Red', price: 85, seedCount: 10 },
  { name: 'Jalapeno Early Yellow', price: 85, seedCount: 10 },
  { name: 'Jalapeno Early Orange', price: 85, seedCount: 10 },
  { name: 'Jalapeno Early Purple', price: 95, seedCount: 10 },
  { name: 'Jalapeno Early White', price: 90, seedCount: 10 },
  { name: 'Jalapeno Early Peach', price: 90, seedCount: 10 },
  { name: 'Jalapeno Early Mustard', price: 90, seedCount: 10 },
  { name: 'Jalapeno Early Golden', price: 90, seedCount: 10 },
  { name: 'Jalapeno Early Big Sun', price: 95, seedCount: 10 },
  { name: 'Jalapeno Early Long Chocolate', price: 100, seedCount: 10 },
  { name: 'Jalapeno Early Round', price: 85, seedCount: 10 },

  // Cayenne группа
  { name: 'Cayenne Red', price: 80, seedCount: 10 },
  { name: 'Cayenne Yellow', price: 80, seedCount: 10 },
  { name: 'Cayenne Orange', price: 80, seedCount: 10 },
  { name: 'Cayenne Purple', price: 90, seedCount: 10 },
  { name: 'Cayenne White', price: 85, seedCount: 10 },
  { name: 'Cayenne Peach', price: 85, seedCount: 10 },
  { name: 'Cayenne Mustard', price: 85, seedCount: 10 },
  { name: 'Cayenne Golden', price: 85, seedCount: 10 },
  { name: 'Cayenne Big Sun', price: 90, seedCount: 10 },
  { name: 'Cayenne Long Chocolate', price: 95, seedCount: 10 },
  { name: 'Cayenne Round', price: 80, seedCount: 10 },
  { name: 'Cayenne Long Slim Red', price: 85, seedCount: 10 },
  { name: 'Cayenne Long Slim Yellow', price: 85, seedCount: 10 },
  { name: 'Cayenne Long Slim Orange', price: 85, seedCount: 10 },
  { name: 'Cayenne Long Slim Purple', price: 95, seedCount: 10 },
  { name: 'Cayenne Long Slim White', price: 90, seedCount: 10 },
  { name: 'Cayenne Long Slim Peach', price: 90, seedCount: 10 },
  { name: 'Cayenne Long Slim Mustard', price: 90, seedCount: 10 },
  { name: 'Cayenne Long Slim Golden', price: 90, seedCount: 10 },
  { name: 'Cayenne Long Slim Big Sun', price: 95, seedCount: 10 },
  { name: 'Cayenne Long Slim Long Chocolate', price: 100, seedCount: 10 },
  { name: 'Cayenne Long Slim Round', price: 85, seedCount: 10 },

  // Serrano группа
  { name: 'Serrano Red', price: 85, seedCount: 10 },
  { name: 'Serrano Yellow', price: 85, seedCount: 10 },
  { name: 'Serrano Orange', price: 85, seedCount: 10 },
  { name: 'Serrano Purple', price: 95, seedCount: 10 },
  { name: 'Serrano White', price: 90, seedCount: 10 },
  { name: 'Serrano Peach', price: 90, seedCount: 10 },
  { name: 'Serrano Mustard', price: 90, seedCount: 10 },
  { name: 'Serrano Golden', price: 90, seedCount: 10 },
  { name: 'Serrano Big Sun', price: 95, seedCount: 10 },
  { name: 'Serrano Long Chocolate', price: 100, seedCount: 10 },
  { name: 'Serrano Round', price: 85, seedCount: 10 },

  // Bell Pepper группа
  { name: 'Bell Pepper Red', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Yellow', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Orange', price: 70, seedCount: 10 },
  { name: 'Bell Pepper Green', price: 65, seedCount: 10 },
  { name: 'Bell Pepper Purple', price: 75, seedCount: 10 },
  { name: 'Bell Pepper Chocolate', price: 75, seedCount: 10 },
  { name: 'Bell Pepper White', price: 80, seedCount: 10 },
  { name: 'Bell Pepper Black', price: 80, seedCount: 10 },
  { name: 'Bell Pepper Peach', price: 75, seedCount: 10 },
  { name: 'Bell Pepper Mustard', price: 75, seedCount: 10 },
  { name: 'Bell Pepper Golden', price: 75, seedCount: 10 },
  { name: 'Bell Pepper Big Sun', price: 80, seedCount: 10 },
  { name: 'Bell Pepper Long Chocolate', price: 85, seedCount: 10 },
  { name: 'Bell Pepper Round', price: 70, seedCount: 10 },

  // Другие сорта Capsicum annuum
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
  { name: 'Pimiento', price: 70, seedCount: 10 },
  { name: 'Cubanelle', price: 75, seedCount: 10 },
  { name: 'Italian Sweet', price: 70, seedCount: 10 },
  { name: 'Marconi', price: 75, seedCount: 10 },
  { name: 'Carmen', price: 80, seedCount: 10 },
  { name: 'Lipstick', price: 75, seedCount: 10 },
  { name: 'Giant Marconi', price: 80, seedCount: 10 },

  // === CAPSICUM BACCATUM (Aji сорта) ===

  // Aji группа (основная)
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
  { name: 'Aji Cristal', price: 85, seedCount: 10 },
  { name: 'Aji Colorado', price: 85, seedCount: 10 },
  { name: 'Aji Rojo', price: 85, seedCount: 10 },
  { name: 'Aji Verde', price: 85, seedCount: 10 },
  { name: 'Aji Blanco', price: 85, seedCount: 10 },
  { name: 'Aji Negro', price: 85, seedCount: 10 },
  { name: 'Aji Rosado', price: 85, seedCount: 10 },
  { name: 'Aji Azul', price: 85, seedCount: 10 },
  { name: 'Aji Dorado', price: 85, seedCount: 10 },
  { name: 'Aji Plateado', price: 85, seedCount: 10 },
  { name: 'Aji Bronce', price: 85, seedCount: 10 },
  { name: 'Aji Cobre', price: 85, seedCount: 10 },
  { name: 'Aji Hierro', price: 85, seedCount: 10 },
  { name: 'Aji Aluminio', price: 85, seedCount: 10 },
  { name: 'Aji Titanio', price: 85, seedCount: 10 },
  { name: 'Aji Platino', price: 85, seedCount: 10 },
  { name: 'Aji Oro', price: 85, seedCount: 10 },
  { name: 'Aji Plata', price: 85, seedCount: 10 },
  { name: 'Aji Bronce', price: 85, seedCount: 10 },
  { name: 'Aji Cobre', price: 85, seedCount: 10 },
  { name: 'Aji Hierro', price: 85, seedCount: 10 },
  { name: 'Aji Aluminio', price: 85, seedCount: 10 },
  { name: 'Aji Titanio', price: 85, seedCount: 10 },
  { name: 'Aji Platino', price: 85, seedCount: 10 },

  // === CAPSICUM PUBESCENS ===
  { name: 'Rocoto Red', price: 90, seedCount: 10 },
  { name: 'Rocoto Yellow', price: 90, seedCount: 10 },
  { name: 'Rocoto Orange', price: 90, seedCount: 10 },
  { name: 'Rocoto Purple', price: 100, seedCount: 10 },
  { name: 'Rocoto White', price: 95, seedCount: 10 },
  { name: 'Rocoto Peach', price: 95, seedCount: 10 },
  { name: 'Rocoto Mustard', price: 95, seedCount: 10 },
  { name: 'Rocoto Golden', price: 95, seedCount: 10 },
  { name: 'Rocoto Big Sun', price: 100, seedCount: 10 },
  { name: 'Rocoto Long Chocolate', price: 105, seedCount: 10 },
  { name: 'Rocoto Round', price: 90, seedCount: 10 },
  { name: 'Manzano Red', price: 90, seedCount: 10 },
  { name: 'Manzano Yellow', price: 90, seedCount: 10 },
  { name: 'Manzano Orange', price: 90, seedCount: 10 },
  { name: 'Manzano Purple', price: 100, seedCount: 10 },
  { name: 'Manzano White', price: 95, seedCount: 10 },
  { name: 'Manzano Peach', price: 95, seedCount: 10 },
  { name: 'Manzano Mustard', price: 95, seedCount: 10 },
  { name: 'Manzano Golden', price: 95, seedCount: 10 },
  { name: 'Manzano Big Sun', price: 100, seedCount: 10 },
  { name: 'Manzano Long Chocolate', price: 105, seedCount: 10 },
  { name: 'Manzano Round', price: 90, seedCount: 10 },

  // === CAPSICUM FRUTESCENS ===
  { name: 'Tabasco Red', price: 85, seedCount: 10 },
  { name: 'Tabasco Yellow', price: 85, seedCount: 10 },
  { name: 'Tabasco Orange', price: 85, seedCount: 10 },
  { name: 'Tabasco Purple', price: 95, seedCount: 10 },
  { name: 'Tabasco White', price: 90, seedCount: 10 },
  { name: 'Tabasco Peach', price: 90, seedCount: 10 },
  { name: 'Tabasco Mustard', price: 90, seedCount: 10 },
  { name: 'Tabasco Golden', price: 90, seedCount: 10 },
  { name: 'Tabasco Big Sun', price: 95, seedCount: 10 },
  { name: 'Tabasco Long Chocolate', price: 100, seedCount: 10 },
  { name: 'Tabasco Round', price: 85, seedCount: 10 },
];

// Функция для получения всех данных
export function getAllPepperSeedsVarieties(): Omit<
  PepperVariety,
  'id' | 'createdAt' | 'updatedAt'
>[] {
  return parsePepperSeedsData(samplePepperSeedsData);
}

// Функция для группировки сортов по общему названию
export function groupVarietiesByName(
  varieties: Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>[],
) {
  const groups: Record<string, Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>[]> = {};

  varieties.forEach((variety) => {
    // Извлекаем базовое название (первое слово)
    const baseName = variety.name.split(' ')[0];

    if (!groups[baseName]) {
      groups[baseName] = [];
    }

    groups[baseName].push(variety);
  });

  return groups;
}

// Функция для получения группированных сортов
export function getGroupedVarieties() {
  const allVarieties = getAllPepperSeedsVarieties();
  return groupVarietiesByName(allVarieties);
}

// Функция для получения сортов с группировкой (оптимизированная версия)
export function getOptimizedVarieties() {
  const groups = getGroupedVarieties();
  const optimizedVarieties: Omit<PepperVariety, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  Object.entries(groups).forEach(([baseName, varieties]) => {
    if (varieties.length === 1) {
      // Если только один сорт в группе, добавляем как есть
      optimizedVarieties.push(varieties[0]);
    } else {
      // Если несколько сортов, создаем основной сорт и добавляем подварианты
      const mainVariety = varieties[0];
      optimizedVarieties.push({
        ...mainVariety,
        name: baseName, // Используем базовое название
        description: `${baseName} - группа сортов с различными характеристиками. Включает ${varieties.length} разновидностей.`,
      });

      // Добавляем подварианты с уточненными названиями
      varieties.slice(1).forEach((variety) => {
        optimizedVarieties.push({
          ...variety,
          description: `${variety.name} - разновидность сорта ${baseName}. ${variety.description}`,
        });
      });
    }
  });

  return optimizedVarieties;
}
