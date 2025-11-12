import type { FertilizerComposition, SoilNutrientState, NutrientAddition } from 'src/components/models';

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
 * @returns остаток элемента в граммах
 */
export function calculateRemainingAmount(
  initialAmount: number,
  hoursElapsed: number,
  halfLifeHours: number,
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

  // Экспоненциальное затухание
  const decayConstant = Math.log(2) / halfLifeHours;
  const remaining = initialAmount * Math.exp(-decayConstant * hoursElapsed);

  // Округляем до 3 знаков после запятой
  return Math.round(remaining * 1000) / 1000;
}

/**
 * Вычисляет текущее состояние элементов в почве на основе истории внесений
 * Учитывает поглощение элементов растением с течением времени
 *
 * @param state - состояние почвы с историей внесений
 * @param asOfDate - дата, на которую нужно вычислить состояние (по умолчанию текущая)
 * @returns текущее состояние элементов в почве (в граммах)
 */
export function calculateSoilNutrients(
  state: SoilNutrientState,
  asOfDate: string = new Date().toISOString(),
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

      const remaining = calculateRemainingAmount(
        elementAmount,
        hoursElapsed,
        rate.halfLifeHours,
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
export function getCurrentSoilNutrients(state: SoilNutrientState | null | undefined): FertilizerComposition {
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

  // Пересчитываем
  const calculated = calculateSoilNutrients(state, now);
  return calculated;
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

