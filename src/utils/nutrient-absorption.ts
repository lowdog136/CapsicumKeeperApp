import type {
  FertilizerComposition,
  SoilNutrientState,
  NutrientAddition,
  FertilizerAvailabilityType,
} from 'src/components/models';

/**
 * Скорости поглощения элементов растением
 * Период полураспада в часах (время, за которое поглощается 50% элемента)
 */
export interface NutrientAbsorptionRate {
  halfLifeHours: number;
}

export const NUTRIENT_ABSORPTION_RATES: Record<keyof FertilizerComposition, NutrientAbsorptionRate> = {
  // Макроэлементы (поглощаются быстрее)
  N: { halfLifeHours: 168 },  // Азот: ~7 дней (168 часов)
  P: { halfLifeHours: 336 },  // Фосфор: ~14 дней (336 часов)
  K: { halfLifeHours: 240 },  // Калий: ~10 дней (240 часов)
  Ca: { halfLifeHours: 720 }, // Кальций: ~30 дней (720 часов)
  Mg: { halfLifeHours: 480 }, // Магний: ~20 дней (480 часов)
  S: { halfLifeHours: 336 },  // Сера: ~14 дней (336 часов)

  // Микроэлементы (поглощаются медленнее)
  Fe: { halfLifeHours: 480 }, // Железо: ~20 дней
  Mn: { halfLifeHours: 360 }, // Марганец: ~15 дней
  Zn: { halfLifeHours: 240 }, // Цинк: ~10 дней
  Cu: { halfLifeHours: 360 }, // Медь: ~15 дней
  B: { halfLifeHours: 240 },  // Бор: ~10 дней
  Mo: { halfLifeHours: 720 }, // Молибден: ~30 дней
  Cl: { halfLifeHours: 168 }, // Хлор: ~7 дней
  Co: { halfLifeHours: 480 }, // Кобальт: ~20 дней
  Ni: { halfLifeHours: 480 }, // Никель: ~20 дней
  Si: { halfLifeHours: 720 }, // Кремний: ~30 дней
};

/**
 * Вычисляет остаток элемента с учетом времени поглощения
 * Использует экспоненциальное затухание: remaining = initial * exp(-decayConstant * hoursElapsed)
 *
 * @param initialAmount - начальное количество элемента (в граммах)
 * @param hoursElapsed - сколько часов прошло с момента внесения
 * @param halfLifeHours - период полураспада элемента в часах
 * @param absorptionMultiplier - множитель скорости поглощения (1.0 = базовое значение)
 * @returns остаток элемента в граммах
 */
export function calculateRemainingAmount(
  initialAmount: number,
  hoursElapsed: number,
  halfLifeHours: number,
  absorptionMultiplier: number = 1.0,
): number {
  if (hoursElapsed < 0) {
    return 0; // будущие внесения игнорируем
  }
  if (initialAmount <= 0) {
    return 0;
  }
  if (halfLifeHours <= 0) {
    return initialAmount; // если период полураспада некорректный, возвращаем начальное значение
  }

  // Применяем множитель к периоду полураспада
  // Если множитель > 1, элемент поглощается быстрее (меньший период полураспада)
  // Если множитель < 1, элемент поглощается медленнее (больший период полураспада)
  const adjustedHalfLife = halfLifeHours / Math.max(absorptionMultiplier, 0.1);

  // Экспоненциальное затухание
  const decayConstant = Math.log(2) / adjustedHalfLife;
  const remaining = initialAmount * Math.exp(-decayConstant * hoursElapsed);

  // Округляем до 3 знаков после запятой
  return Math.round(remaining * 1000) / 1000;
}

/**
 * Множитель скорости поглощения в зависимости от стадии роста
 * Значения основаны на физиологии растений и потребностях на разных стадиях
 */
export function getGrowthStageMultiplier(stage?: string): number {
  if (!stage) return 1.0;

  const multipliers: Record<string, number> = {
    'проращивание': 0.3,  // Медленное поглощение (корневая система только развивается)
    'рассада': 0.6,       // Умеренное поглощение (активный рост листьев)
    'вегетация': 1.5,     // Активное поглощение (максимальный рост)
    'плодоношение': 1.2,  // Высокое поглощение (но азота меньше - см. getElementStageMultiplier)
    'сбор урожая': 0.5,   // Сниженное поглощение (растение завершает цикл)
  };

  return multipliers[stage] ?? 1.0;
}

/**
 * Множитель для конкретного элемента в зависимости от стадии роста
 * Учитывает специфические потребности элементов на разных стадиях
 */
export function getElementStageMultiplier(
  element: keyof FertilizerComposition,
  stage?: string,
): number {
  if (!stage) return 1.0;

  // При плодоношении азота нужно меньше (избыток ухудшает качество плодов)
  if (element === 'N' && stage === 'плодоношение') {
    return 0.5; // Снижаем потребность в азоте в 2 раза
  }

  // Фосфор и калий важны при плодоношении
  if ((element === 'P' || element === 'K') && stage === 'плодоношение') {
    return 1.3; // Увеличиваем потребность
  }

  // Для остальных элементов используем общий множитель стадии
  return getGrowthStageMultiplier(stage);
}

/**
 * Множитель усвояемости в зависимости от типа удобрения
 * Значения основаны на исследованиях скорости растворения и усвоения удобрений
 */
export function getAvailabilityMultiplier(type?: FertilizerAvailabilityType | null): number {
  if (!type) return 1.0;

  // Базовые множители (можно расширять для кастомных типов)
  const multipliers: Record<string, number> = {
    'fast': 1.5,   // Быстро усвояемое (хелаты, жидкие) - поглощается в 1.5 раза быстрее
    'medium': 1.0, // Средняя усвояемость (гранулированное) - базовое значение
    'slow': 0.6,   // Медленно усвояемое (органическое, пролонгированное) - в 0.6 раза медленнее
  };

  // Если тип не найден, возвращаем среднее значение
  return multipliers[type] ?? 1.0;
}

/**
 * Вычисляет текущее состояние элементов в почве на основе истории внесений
 * Учитывает поглощение элементов растением с течением времени
 *
 * @param state - состояние почвы с историей внесений
 * @param asOfDate - дата, на которую нужно вычислить состояние (по умолчанию текущая)
 * @param growthStage - стадия роста растения (для корректировки скорости поглощения)
 * @returns текущее состояние элементов в почве (в граммах)
 */
export function calculateSoilNutrients(
  state: SoilNutrientState,
  asOfDate: string = new Date().toISOString(),
  growthStage?: string,
): FertilizerComposition {
  const result: FertilizerComposition = {};
  const asOfTime = new Date(asOfDate).getTime();

  if (!state.additions || state.additions.length === 0) {
    return result;
  }

  // Собираем все элементы, которые были внесены
  const allElements = new Set<keyof FertilizerComposition>();
  state.additions.forEach((addition) => {
    Object.keys(addition.amount).forEach((key) => {
      const elementKey = key as keyof FertilizerComposition;
      const value = addition.amount[elementKey];
      if (value != null && value > 0) {
        allElements.add(elementKey);
      }
    });
  });

  // Для каждого элемента вычисляем остаток от всех внесений
  allElements.forEach((elementKey) => {
    let totalRemaining = 0;

    state.additions!.forEach((addition) => {
      const elementAmount = addition.amount[elementKey];
      if (elementAmount == null || elementAmount <= 0) {
        return;
      }

      const additionTime = new Date(addition.date).getTime();
      const hoursElapsed = (asOfTime - additionTime) / (1000 * 60 * 60);

      const rate = NUTRIENT_ABSORPTION_RATES[elementKey];
      if (!rate) {
        // Если нет данных о скорости поглощения, считаем что элемент не поглощается
        totalRemaining += elementAmount;
        return;
      }

      // Получаем множитель усвояемости для этого элемента
      const elementMultiplier =
        addition.absorptionMultipliers?.[elementKey] ??
        getAvailabilityMultiplier(addition.availabilityType) ??
        1.0;

      // Применяем множитель стадии роста (с учетом специфики элемента)
      const elementStageMultiplier = getElementStageMultiplier(elementKey, growthStage);
      const finalMultiplier = elementMultiplier * elementStageMultiplier;

      const remaining = calculateRemainingAmount(
        elementAmount,
        hoursElapsed,
        rate.halfLifeHours,
        finalMultiplier, // Передаем множитель
      );
      totalRemaining += remaining;
    });

    // Добавляем в результат только если остаток значимый (> 0.001 г)
    if (totalRemaining > 0.001) {
      result[elementKey] = totalRemaining;
    }
  });

  return result;
}

/**
 * Получает текущее состояние элементов в почве с кэшированием
 * Пересчитывает только если прошло больше часа с последнего расчета
 *
 * @param state - состояние почвы
 * @returns текущее состояние элементов в почве
 */
export function getCurrentSoilNutrients(
  state: SoilNutrientState | null | undefined,
  growthStage?: string,
): FertilizerComposition {
  if (!state) {
    return {};
  }

  const now = new Date().toISOString();

  // Если пересчитывали недавно (менее часа назад), используем кэш
  if (state.lastCalculatedAt && state.current) {
    const lastCalcTime = new Date(state.lastCalculatedAt).getTime();
    const hoursSinceCalc = (Date.now() - lastCalcTime) / (1000 * 60 * 60);

    if (hoursSinceCalc < 1) {
      // Пересчитываем только если прошло больше часа
      return state.current;
    }
  }

  // Пересчитываем с учетом стадии роста
  const calculated = calculateSoilNutrients(state, now, growthStage);
  return calculated;
}

/**
 * Вычисляет время до полного поглощения элемента (до 1% от начального)
 * 
 * @param currentAmount - текущее количество элемента (в граммах)
 * @param halfLifeHours - период полураспада элемента в часах
 * @param absorptionMultiplier - множитель скорости поглощения
 * @returns время в часах до полного поглощения
 */
export function calculateFullAbsorptionTime(
  currentAmount: number,
  halfLifeHours: number,
  absorptionMultiplier: number = 1.0,
): number {
  if (currentAmount <= 0) return 0;

  const adjustedHalfLife = halfLifeHours / Math.max(absorptionMultiplier, 0.1);
  // Время до 1%: t = -ln(0.01) * halfLife / ln(2)
  const timeTo1Percent = (-Math.log(0.01) * adjustedHalfLife) / Math.log(2);

  return Math.round(timeTo1Percent);
}

/**
 * Генерирует историю изменения элементов за указанный период
 * Полезно для построения графиков и прогнозирования
 *
 * @param state - состояние почвы
 * @param days - количество дней для генерации истории
 * @param growthStage - стадия роста растения
 * @returns массив состояний элементов по датам
 */
export function generateNutrientHistory(
  state: SoilNutrientState,
  days: number = 30,
  growthStage?: string,
): Array<{ date: string; nutrients: FertilizerComposition }> {
  const history: Array<{ date: string; nutrients: FertilizerComposition }> = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();

    const nutrients = calculateSoilNutrients(state, dateStr, growthStage);
    history.push({ date: dateStr, nutrients });
  }

  return history;
}

/**
 * Очищает старые записи из истории внесений
 * Удаляет записи старше указанного количества дней, если остаток элементов незначим
 *
 * @param state - состояние почвы
 * @param cutoffDays - сколько дней хранить историю (по умолчанию 90)
 * @returns обновленное состояние почвы
 */
export function cleanupOldAdditions(
  state: SoilNutrientState,
  cutoffDays: number = 90,
): SoilNutrientState {
  const now = new Date().toISOString();
  const cutoffTime = new Date(now).getTime() - cutoffDays * 24 * 60 * 60 * 1000;

  if (!state.additions || state.additions.length === 0) {
    return state;
  }

  // Фильтруем записи старше cutoffDays
  const filtered = state.additions.filter((addition) => {
    const additionTime = new Date(addition.date).getTime();
    if (additionTime < cutoffTime) {
      // Проверяем, есть ли еще значимый остаток от этого внесения
      const remaining = calculateRemainingForAddition(addition, now);
      return hasSignificantRemaining(remaining);
    }
    return true;
  });

  return {
    ...state,
    additions: filtered,
  };
}

/**
 * Вычисляет остаток элементов от одного внесения
 */
function calculateRemainingForAddition(
  addition: NutrientAddition,
  asOfDate: string,
): FertilizerComposition {
  const result: FertilizerComposition = {};
  const asOfTime = new Date(asOfDate).getTime();
  const additionTime = new Date(addition.date).getTime();
  const hoursElapsed = (asOfTime - additionTime) / (1000 * 60 * 60);

  Object.keys(addition.amount).forEach((key) => {
    const elementKey = key as keyof FertilizerComposition;
    const amount = addition.amount[elementKey];
    if (amount == null || amount <= 0) {
      return;
    }

    const rate = NUTRIENT_ABSORPTION_RATES[elementKey];
    if (!rate) {
      result[elementKey] = amount;
      return;
    }

    const remaining = calculateRemainingAmount(amount, hoursElapsed, rate.halfLifeHours);
    if (remaining > 0.001) {
      result[elementKey] = remaining;
    }
  });

  return result;
}

/**
 * Проверяет, есть ли значимый остаток элементов (> 0.01 г)
 */
function hasSignificantRemaining(remaining: FertilizerComposition): boolean {
  return Object.values(remaining).some((value) => (value ?? 0) > 0.01);
}

