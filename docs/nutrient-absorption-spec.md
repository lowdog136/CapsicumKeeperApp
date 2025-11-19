# Спецификация: Моделирование поглощения элементов растением

## Цель

Реализовать систему, которая учитывает поглощение элементов растением из почвы с течением времени. Разные элементы поглощаются с разной скоростью, и их концентрация в почве должна уменьшаться в зависимости от времени, прошедшего с момента внесения.

## Текущее состояние

### Хранение данных

1. **`Pepper.soilNutrients`** (`SoilNutrientState`):
   - `current: FertilizerComposition` - текущее состояние элементов в почве (в граммах)
   - `lastUpdated: string` - когда последний раз обновлялось состояние
   - `lastWateredAt?: string | null` - когда последний раз поливали
   - `lastFertilizedAt?: string | null` - когда последний раз удобряли

2. **История поливов** (`WateringEvent`):
   - Хранится в подколлекции `wateringBatches/{batchId}/events`
   - Содержит `nutrientDelta` - сколько элементов было добавлено
   - Содержит `appliedAt` - когда был полив

3. **История удобрений** (`Pepper.fertilizingHistory`):
   - Массив записей с датой и составом удобрения
   - Используется для отображения статистики в `PepperChartsDialog`

### Проблема

Сейчас при поливе элементы просто добавляются в `soilNutrients.current`, но не учитывается:
- Время, прошедшее с момента внесения
- Скорость поглощения каждого элемента растением
- Естественное разложение/вымывание элементов

## Предлагаемое решение

### 1. Модель поглощения элементов

#### Скорость поглощения (Half-life или Decay Rate)

Каждый элемент имеет свой период полураспада (время, за которое поглощается 50% элемента):

```typescript
interface NutrientAbsorptionRate {
  // Период полураспада в часах (время, за которое поглощается 50% элемента)
  halfLifeHours: number;
  // Альтернативно: коэффициент поглощения в час (0-1)
  // absorptionRatePerHour?: number;
}

const NUTRIENT_ABSORPTION_RATES: Record<keyof FertilizerComposition, NutrientAbsorptionRate> = {
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
```

#### Формула расчета остатка элемента

Используем экспоненциальное затухание:

```
remaining = initial * (0.5 ^ (hoursElapsed / halfLifeHours))
```

Или в более общем виде:

```
remaining = initial * Math.exp(-decayConstant * hoursElapsed)
где decayConstant = Math.log(2) / halfLifeHours
```

### 2. Хранение истории внесения элементов

#### Вариант A: Хранить историю в `soilNutrients` (рекомендуется)

Расширить `SoilNutrientState` для хранения истории внесений:

```typescript
interface NutrientAddition {
  date: string; // ISO string
  amount: FertilizerComposition; // сколько было добавлено
  source: 'watering' | 'fertilizing' | 'manual'; // источник
  sourceId?: string; // ID события полива/удобрения
}

export interface SoilNutrientState {
  current: FertilizerComposition; // вычисляемое значение (кэш)
  thresholds?: NutrientThresholds | null;
  lastUpdated: string; // когда последний раз пересчитывалось
  lastWateredAt?: string | null;
  lastFertilizedAt?: string | null;
  
  // НОВОЕ: История внесений
  additions?: NutrientAddition[]; // хронологический список внесений
  lastCalculatedAt?: string; // когда последний раз пересчитывалось current
}
```

**Преимущества:**
- Полная история внесений
- Можно пересчитать состояние на любой момент времени
- Можно показать график изменения элементов

**Недостатки:**
- Больше данных в документе перца
- Нужно периодически очищать старые записи

#### Вариант B: Использовать только `lastFertilizedAt` и `current`

Хранить только последнее внесение и текущее состояние:

```typescript
export interface SoilNutrientState {
  current: FertilizerComposition;
  lastCalculatedAt: string; // когда последний раз пересчитывалось
  lastFertilizedAt?: string | null;
  // ...
}
```

**Преимущества:**
- Проще реализация
- Меньше данных

**Недостатки:**
- Неточность при множественных внесениях
- Нельзя пересчитать на прошлую дату

**Рекомендация:** Использовать Вариант A для точности и гибкости.

### 3. Алгоритм пересчета состояния почвы

#### Функция `calculateSoilNutrients`

```typescript
function calculateSoilNutrients(
  state: SoilNutrientState,
  asOfDate: string = new Date().toISOString()
): FertilizerComposition {
  const result: FertilizerComposition = {};
  const asOfTime = new Date(asOfDate).getTime();
  
  if (!state.additions || state.additions.length === 0) {
    return result;
  }
  
  // Для каждого элемента вычисляем остаток от всех внесений
  const allElements = new Set<string>();
  state.additions.forEach(addition => {
    Object.keys(addition.amount).forEach(key => {
      if (addition.amount[key] != null && addition.amount[key]! > 0) {
        allElements.add(key);
      }
    });
  });
  
  allElements.forEach(elementKey => {
    let totalRemaining = 0;
    
    state.additions.forEach(addition => {
      const elementAmount = addition.amount[elementKey];
      if (elementAmount == null || elementAmount <= 0) return;
      
      const additionTime = new Date(addition.date).getTime();
      const hoursElapsed = (asOfTime - additionTime) / (1000 * 60 * 60);
      
      if (hoursElapsed < 0) return; // будущие внесения игнорируем
      
      const rate = NUTRIENT_ABSORPTION_RATES[elementKey as keyof FertilizerComposition];
      if (!rate) return;
      
      // Экспоненциальное затухание
      const decayConstant = Math.log(2) / rate.halfLifeHours;
      const remaining = elementAmount * Math.exp(-decayConstant * hoursElapsed);
      
      totalRemaining += remaining;
    });
    
    // Округляем до 3 знаков после запятой
    if (totalRemaining > 0.001) {
      result[elementKey] = Math.round(totalRemaining * 1000) / 1000;
    }
  });
  
  return result;
}
```

#### Оптимизация: Кэширование результата

Чтобы не пересчитывать при каждом обращении, кэшируем результат:

```typescript
function getCurrentSoilNutrients(state: SoilNutrientState): FertilizerComposition {
  const now = new Date().toISOString();
  
  // Если пересчитывали недавно (менее часа назад), используем кэш
  if (state.lastCalculatedAt) {
    const lastCalcTime = new Date(state.lastCalculatedAt).getTime();
    const hoursSinceCalc = (Date.now() - lastCalcTime) / (1000 * 60 * 60);
    
    if (hoursSinceCalc < 1 && state.current) {
      // Пересчитываем только если прошло больше часа
      return state.current;
    }
  }
  
  // Пересчитываем
  const calculated = calculateSoilNutrients(state, now);
  
  // Обновляем кэш (но не сохраняем в Firestore сразу - только при необходимости)
  return calculated;
}
```

### 4. Обновление при поливе/удобрении

#### При поливе (`applyWatering`)

```typescript
const normalizedSoil = normalizeSoilState(pepperData.soilNutrients, now);

// Добавляем новое внесение в историю
const newAddition: NutrientAddition = {
  date: now,
  amount: addition, // элементы, добавленные при поливе
  source: 'watering',
  sourceId: eventRef.id,
};

normalizedSoil.additions = [
  ...(normalizedSoil.additions ?? []),
  newAddition,
];

// Пересчитываем текущее состояние
normalizedSoil.current = calculateSoilNutrients(normalizedSoil, now);
normalizedSoil.lastCalculatedAt = now;
```

#### При ручном удобрении

Аналогично, но `source: 'fertilizing'`.

### 5. Очистка старых записей

Чтобы не хранить бесконечную историю, периодически удаляем записи, где остаток элемента < 0.01 г:

```typescript
function cleanupOldAdditions(state: SoilNutrientState): SoilNutrientState {
  const now = new Date().toISOString();
  const cutoffDays = 90; // храним историю за 90 дней
  
  if (!state.additions || state.additions.length === 0) {
    return state;
  }
  
  const cutoffTime = new Date(now).getTime() - (cutoffDays * 24 * 60 * 60 * 1000);
  
  // Фильтруем записи старше cutoffDays
  const filtered = state.additions.filter(addition => {
    const additionTime = new Date(addition.date).getTime();
    if (additionTime < cutoffTime) {
      // Проверяем, есть ли еще значимый остаток
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

function hasSignificantRemaining(remaining: FertilizerComposition): boolean {
  return Object.values(remaining).some(value => (value ?? 0) > 0.01);
}
```

### 6. Отображение в UI

#### В `PepperChartsDialog.vue`

Вместо суммирования всех удобрений, показывать текущее состояние почвы:

```typescript
const elementStats = computed<ElementStats>(() => {
  const macro: Record<string, number> = {};
  const micro: Record<string, number> = {};
  
  // Используем soilNutrients.current вместо суммирования fertilizingHistory
  const current = props.pepper.soilNutrients?.current ?? {};
  
  macroElementsList.forEach((el) => {
    macro[el.symbol] = current[el.symbol] ?? 0;
  });
  
  microElementsList.forEach((el) => {
    micro[el.symbol] = current[el.symbol] ?? 0;
  });
  
  return { macro, micro, totalGrams: Object.values(current).reduce((a, b) => a + (b ?? 0), 0) };
});
```

#### В карточке перца

Показывать время последнего обновления и предупреждение, если элементы почти закончились.

### 7. Миграция существующих данных

Для существующих перцев нужно:

1. Создать `additions` из `fertilizingHistory` и истории поливов
2. Пересчитать `current` на текущую дату
3. Установить `lastCalculatedAt`

```typescript
async function migratePepperSoilNutrients(pepper: Pepper): Promise<SoilNutrientState> {
  const additions: NutrientAddition[] = [];
  const now = new Date().toISOString();
  
  // Из истории удобрений
  if (pepper.fertilizingHistory) {
    pepper.fertilizingHistory.forEach(entry => {
      if (entry.composition && entry.grams) {
        const amount = multiplyNutrients(entry.composition, entry.grams / 100);
        additions.push({
          date: entry.date,
          amount,
          source: 'fertilizing',
        });
      }
    });
  }
  
  // Из истории поливов (если есть доступ к событиям)
  // TODO: загрузить события поливов из wateringBatches
  
  // Сортируем по дате
  additions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const state: SoilNutrientState = {
    current: calculateSoilNutrients({ additions, lastUpdated: now }, now),
    lastUpdated: now,
    lastCalculatedAt: now,
    lastFertilizedAt: pepper.soilNutrients?.lastFertilizedAt ?? null,
    lastWateredAt: pepper.soilNutrients?.lastWateredAt ?? null,
    additions,
  };
  
  return state;
}
```

## План реализации

### Этап 1: Базовая модель поглощения
1. ✅ Определить скорости поглощения для всех элементов
2. ✅ Создать функцию `calculateSoilNutrients`
3. ✅ Создать функцию `getCurrentSoilNutrients` с кэшированием
4. ✅ Добавить тесты для расчета поглощения

### Этап 2: Расширение модели данных
1. ✅ Обновить `SoilNutrientState` для хранения `additions`
2. ✅ Обновить `applyWatering` для добавления записей в историю
3. ✅ Обновить функции удобрения для добавления записей

### Этап 3: Миграция данных
1. ✅ Создать скрипт миграции для существующих перцев
2. ✅ Запустить миграцию в фоне
3. ✅ Проверить корректность данных

### Этап 4: Обновление UI
1. ✅ Обновить `PepperChartsDialog` для отображения текущего состояния
2. ✅ Добавить индикатор времени последнего обновления
3. ✅ Добавить предупреждения о низком уровне элементов

### Этап 5: Оптимизация
1. ✅ Реализовать очистку старых записей
2. ✅ Оптимизировать пересчет (ленивая загрузка)
3. ✅ Добавить фоновую задачу для периодического пересчета

## Вопросы для обсуждения

1. **Скорости поглощения**: Предложенные значения основаны на общих знаниях. Нужно ли их настраивать пользователем или использовать фиксированные значения?

2. **Точность расчета**: Достаточно ли экспоненциальной модели, или нужна более сложная (учитывающая стадию роста, температуру, влажность)?

3. **История**: Сколько времени хранить историю внесений? 90 дней достаточно?

4. **Производительность**: При большом количестве перцев пересчет может быть затратным. Нужен ли фоновый процесс или пересчитывать по требованию?

5. **Миграция**: Как обрабатывать старые данные без `additions`? Автоматически мигрировать или по требованию?

## Альтернативные подходы

### Упрощенный вариант (если полная история слишком сложна)

Хранить только последнее внесение и время:

```typescript
interface SoilNutrientState {
  current: FertilizerComposition;
  lastAddition: {
    date: string;
    amount: FertilizerComposition;
  };
  lastCalculatedAt: string;
}
```

Пересчитывать только от последнего внесения. Это проще, но менее точно при множественных внесениях.

