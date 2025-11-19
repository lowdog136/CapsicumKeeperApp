# План реализации: Улучшенная усвояемость удобрений

## Текущее состояние

У нас уже реализована базовая модель поглощения элементов:
- Экспоненциальное затухание с периодами полураспада для каждого элемента
- История внесений (`soilNutrients.additions`)
- Автоматический пересчет текущего состояния

**Проблема:** Модель использует фиксированные скорости поглощения для каждого элемента, но не учитывает:
- Тип удобрения (быстро/медленно усвояемые)
- Форму удобрения (гранулированное, жидкое, хелаты)
- Стадию роста растения (разные стадии - разная скорость поглощения)
- Условия окружающей среды (температура, влажность)

## Цель улучшения

Реализовать более точную модель усвояемости, которая учитывает:
1. **Тип удобрения** - быстро/медленно усвояемые формы
2. **Форму удобрения** - гранулированное, жидкое, хелаты
3. **Стадию роста растения** - корректировка скорости поглощения
4. **Визуализацию процесса** - график изменения элементов во времени

## План реализации

### Этап 1: Расширение модели данных

#### 1.1. Добавить типы усвояемости удобрений (расширяемые)

```typescript
// В src/components/models.ts

// Базовые типы усвояемости (можно расширять)
export type FertilizerAvailabilityType = 
  | 'fast'      // Быстро усвояемое (жидкие, хелаты) - множитель ~1.5
  | 'medium'    // Средняя усвояемость (гранулированное) - множитель 1.0
  | 'slow'      // Медленно усвояемое (органическое, пролонгированное) - множитель ~0.6
  | string;     // Позволяет добавлять кастомные типы в будущем

export interface FertilizerAvailability {
  type: FertilizerAvailabilityType;
  // Множитель скорости поглощения (0.5 = в 2 раза медленнее, 2.0 = в 2 раза быстрее)
  // Если не указан, используется значение по умолчанию для типа
  absorptionMultiplier?: number;
}

// Расширить FertilizerComposition для хранения информации об усвояемости
export interface FertilizerComposition {
  // ... существующие поля ...
  
  // НОВОЕ: Усвояемость каждого элемента (опционально)
  availability?: Record<keyof FertilizerComposition, FertilizerAvailability>;
}
```

#### 1.2. Обновить NutrientAddition для хранения типа удобрения

```typescript
export interface NutrientAddition {
  date: string;
  amount: FertilizerComposition;
  source: 'watering' | 'fertilizing' | 'manual';
  sourceId?: string | null;
  
  // НОВОЕ: Информация об удобрении
  fertilizerId?: string | null;        // ID удобрения из библиотеки
  fertilizerName?: string | null;      // Название удобрения
  availabilityType?: FertilizerAvailabilityType; // Тип усвояемости
  absorptionMultipliers?: Record<string, number>; // Множители для каждого элемента
}
```

#### 1.3. Добавить настройки усвояемости в библиотеку удобрений

```typescript
// В src/stores/fertilizer-library-firestore.ts

export interface Fertilizer {
  // ... существующие поля ...
  
  // НОВОЕ: Настройки усвояемости
  availabilityType?: FertilizerAvailabilityType;
  // Множители скорости поглощения для каждого элемента (опционально)
  // Если не указано, используется базовое значение из NUTRIENT_ABSORPTION_RATES
  absorptionMultipliers?: Record<string, number>;
}
```

### Этап 2: Улучшение алгоритма расчета

#### 2.1. Обновить calculateRemainingAmount для учета типа усвояемости

```typescript
// В src/utils/nutrient-absorption.ts

export function calculateRemainingAmount(
  initialAmount: number,
  hoursElapsed: number,
  halfLifeHours: number,
  absorptionMultiplier: number = 1.0, // НОВОЕ: множитель скорости
): number {
  if (hoursElapsed < 0) return 0;
  if (initialAmount <= 0) return 0;
  if (halfLifeHours <= 0) return initialAmount;

  // Применяем множитель к периоду полураспада
  // Если множитель > 1, элемент поглощается быстрее (меньший период полураспада)
  // Если множитель < 1, элемент поглощается медленнее (больший период полураспада)
  const adjustedHalfLife = halfLifeHours / absorptionMultiplier;
  
  const decayConstant = Math.log(2) / adjustedHalfLife;
  const remaining = initialAmount * Math.exp(-decayConstant * hoursElapsed);

  return Math.round(remaining * 1000) / 1000;
}
```

#### 2.2. Обновить calculateSoilNutrients для учета усвояемости

```typescript
export function calculateSoilNutrients(
  state: SoilNutrientState,
  asOfDate: string = new Date().toISOString(),
  growthStage?: string, // НОВОЕ: стадия роста для корректировки
): FertilizerComposition {
  const result: FertilizerComposition = {};
  const asOfTime = new Date(asOfDate).getTime();

  if (!state.additions || state.additions.length === 0) {
    return result;
  }

  // Множитель скорости поглощения в зависимости от стадии роста
  const stageMultiplier = getGrowthStageMultiplier(growthStage);

  // ... существующая логика ...

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
        finalMultiplier, // НОВОЕ: передаем множитель
      );
      totalRemaining += remaining;
    });

    if (totalRemaining > 0.001) {
      result[elementKey] = totalRemaining;
    }
  });

  return result;
}

// НОВОЕ: Множитель скорости поглощения в зависимости от стадии роста
// Значения основаны на физиологии растений и потребностях на разных стадиях
function getGrowthStageMultiplier(stage?: string): number {
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

// НОВОЕ: Множитель для конкретного элемента в зависимости от стадии роста
// Учитывает специфические потребности элементов на разных стадиях
function getElementStageMultiplier(
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

// НОВОЕ: Множитель усвояемости в зависимости от типа удобрения
// Значения основаны на исследованиях скорости растворения и усвоения удобрений
function getAvailabilityMultiplier(type?: FertilizerAvailabilityType): number {
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
```

### Этап 3: Обновление логики внесения удобрений

#### 3.1. Обновить applyWatering для сохранения информации об удобрении

```typescript
// В src/stores/mass-watering-store.ts

// При создании NutrientAddition из рецепта полива
const newAddition: NutrientAddition = {
  date: now,
  amount: addition,
  source: 'watering',
  sourceId: eventRef.id,
  
  // НОВОЕ: Информация об удобрении из рецепта
  fertilizerId: batchData.recipeId ? getFertilizerIdFromRecipe(batchData.recipeId) : null,
  availabilityType: getAvailabilityTypeFromRecipe(batchData.recipeId),
  absorptionMultipliers: getAbsorptionMultipliersFromRecipe(batchData.recipeId),
};
```

#### 3.2. Обновить ручное внесение удобрений

```typescript
// При ручном внесении удобрения из библиотеки
const newAddition: NutrientAddition = {
  date: now,
  amount: calculatedAmount, // из состава удобрения
  source: 'fertilizing',
  fertilizerId: fertilizer.id,
  fertilizerName: fertilizer.name,
  availabilityType: fertilizer.availabilityType ?? 'medium',
  absorptionMultipliers: fertilizer.absorptionMultipliers,
};
```

### Этап 4: Обновление UI

#### 4.1. Добавить настройки усвояемости в форму удобрения

```vue
<!-- В src/components/FertilizerEntryForm.vue -->

<q-select
  v-model="form.availabilityType"
  :options="availabilityOptions"
  label="Тип усвояемости"
  outlined
  dense
/>

<q-input
  v-for="element in allElements"
  :key="element"
  v-model.number="form.absorptionMultipliers[element]"
  :label="`Множитель ${element}`"
  type="number"
  min="0.1"
  max="3.0"
  step="0.1"
  outlined
  dense
/>
```

#### 4.2. Добавить график изменения элементов во времени (как отдельная опция)

**Важно:** График должен быть опциональным, чтобы не перегружать интерфейс.

```vue
<!-- В src/components/PepperChartsDialog.vue -->

<!-- Кнопка для открытия графика (в разделе удобрений) -->
<div class="row justify-end q-mb-md">
  <q-btn 
    icon="show_chart" 
    label="График усвояемости" 
    color="primary"
    outline
    dense
    @click="showNutrientHistoryChart = true"
  />
</div>

<!-- График (показывается только при активации) -->
<q-card v-if="showNutrientHistoryChart" class="q-mt-md">
  <q-card-section>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Динамика элементов в почве</div>
      <q-btn 
        flat 
        dense 
        round
        icon="close" 
        @click="showNutrientHistoryChart = false"
      />
    </div>
    
    <!-- Выбор периода -->
    <div class="row q-mb-md">
      <q-btn-toggle
        v-model="nutrientChartPeriod"
        :options="[
          { label: '7 дней', value: 7 },
          { label: '14 дней', value: 14 },
          { label: '30 дней', value: 30 },
        ]"
        @update:model-value="updateNutrientChart"
      />
    </div>
    
    <!-- График -->
    <div class="chart-container" style="height: 300px;">
      <canvas ref="nutrientChart" />
    </div>
    
    <!-- Легенда -->
    <div class="row q-mt-md q-gutter-sm">
      <q-chip 
        v-for="element in selectedElements" 
        :key="element"
        :color="getElementColor(element)"
        text-color="white"
        dense
      >
        {{ element }}
      </q-chip>
    </div>
  </q-card-section>
</q-card>
```

```typescript
// В script секции

const showNutrientHistoryChart = ref(false);
const nutrientChartPeriod = ref(14); // По умолчанию 14 дней
const selectedElements = ref<Array<keyof FertilizerComposition>>(['N', 'P', 'K']);

const updateNutrientChart = () => {
  if (!showNutrientHistoryChart.value) return;
  
  const history = generateNutrientHistory(
    props.pepper.soilNutrients,
    nutrientChartPeriod.value,
    props.pepper.stage, // Передаем стадию роста для корректного расчета
  );
  
  // Обновляем график (используя Chart.js или другую библиотеку)
  renderNutrientChart(history, selectedElements.value);
};
```

#### 4.3. Показывать информацию об усвояемости в статистике

```vue
<!-- В разделе статистики по элементам -->

<div v-for="element in macroElementsList" :key="element.symbol">
  <div class="element-stat-item">
    <!-- ... существующий код ... -->
    
    <!-- НОВОЕ: Индикатор скорости поглощения -->
    <q-badge 
      :color="getAbsorptionSpeedColor(element.symbol)"
      :label="getAbsorptionSpeedLabel(element.symbol)"
    />
    
    <!-- НОВОЕ: Прогноз полного поглощения -->
    <div class="text-caption text-grey-6">
      Полное поглощение через: {{ getFullAbsorptionTime(element.symbol) }}
    </div>
  </div>
</div>
```

#### 4.4. Система уведомлений о низком содержании элементов

```vue
<!-- В src/components/PepperCard.vue или PepperChartsDialog.vue -->

<q-banner 
  v-if="hasLowNutrients"
  dense
  class="bg-warning text-white q-mb-sm"
>
  <template v-slot:avatar>
    <q-icon name="warning" />
  </template>
  <div class="text-subtitle2">Низкое содержание элементов</div>
  <div class="text-caption">
    <span v-for="(element, index) in lowNutrients" :key="element">
      {{ element }}<span v-if="index < lowNutrients.length - 1">, </span>
    </span>
  </div>
  <template v-slot:action>
    <q-btn flat dense label="Подробнее" @click="showNutrientDetails = true" />
  </template>
</q-banner>
```

```typescript
// В computed свойствах

const hasLowNutrients = computed(() => {
  const current = getCurrentSoilNutrients(props.pepper.soilNutrients);
  const thresholds = props.pepper.soilNutrients?.thresholds?.min;
  
  if (!thresholds) return false;
  
  // Проверяем макроэлементы (они критичнее)
  const macroElements: (keyof FertilizerComposition)[] = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];
  
  return macroElements.some(element => {
    const currentValue = current[element] ?? 0;
    const minValue = thresholds[element] ?? 0;
    return currentValue < minValue;
  });
});

const lowNutrients = computed(() => {
  const current = getCurrentSoilNutrients(props.pepper.soilNutrients);
  const thresholds = props.pepper.soilNutrients?.thresholds?.min;
  
  if (!thresholds) return [];
  
  const macroElements: (keyof FertilizerComposition)[] = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];
  const low: string[] = [];
  
  macroElements.forEach(element => {
    const currentValue = current[element] ?? 0;
    const minValue = thresholds[element] ?? 0;
    if (currentValue < minValue) {
      low.push(getElementName(element));
    }
  });
  
  return low;
});
```

### Этап 5: Вспомогательные функции

#### 5.1. Функция прогноза полного поглощения

```typescript
// В src/utils/nutrient-absorption.ts

/**
 * Вычисляет время до полного поглощения элемента (до 1% от начального)
 */
export function calculateFullAbsorptionTime(
  currentAmount: number,
  halfLifeHours: number,
  absorptionMultiplier: number = 1.0,
): number {
  if (currentAmount <= 0) return 0;
  
  const adjustedHalfLife = halfLifeHours / absorptionMultiplier;
  // Время до 1%: t = -ln(0.01) * halfLife / ln(2)
  const timeTo1Percent = -Math.log(0.01) * adjustedHalfLife / Math.log(2);
  
  return Math.round(timeTo1Percent);
}
```

#### 5.2. Функция получения истории изменения элементов

```typescript
/**
 * Генерирует историю изменения элементов за указанный период
 */
export function generateNutrientHistory(
  state: SoilNutrientState,
  days: number = 30,
): Array<{ date: string; nutrients: FertilizerComposition }> {
  const history: Array<{ date: string; nutrients: FertilizerComposition }> = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();
    
    const nutrients = calculateSoilNutrients(state, dateStr);
    history.push({ date: dateStr, nutrients });
  }
  
  return history;
}
```

## План реализации по этапам

### Этап 1: Базовая структура (1-2 дня)
1. ✅ Расширить модели данных (`FertilizerAvailabilityType`, `NutrientAddition`)
2. ✅ Добавить поля усвояемости в библиотеку удобрений
3. ✅ Обновить типы и интерфейсы

### Этап 2: Алгоритм расчета (2-3 дня)
1. ✅ Обновить `calculateRemainingAmount` для учета множителей
2. ✅ Добавить `getGrowthStageMultiplier` и `getAvailabilityMultiplier`
3. ✅ Обновить `calculateSoilNutrients` для передачи множителей
4. ✅ Добавить функции прогноза и истории

### Этап 3: Интеграция с внесением удобрений (1-2 дня)
1. ✅ Обновить `applyWatering` для сохранения информации об удобрении
2. ✅ Обновить ручное внесение удобрений
3. ✅ Обновить миграцию данных (если нужно)

### Этап 4: UI и визуализация (2-3 дня)
1. ✅ Добавить настройки усвояемости в форму удобрения
2. ✅ Добавить график изменения элементов во времени
3. ✅ Показывать информацию об усвояемости в статистике
4. ✅ Добавить прогноз полного поглощения

### Этап 5: Тестирование и оптимизация (1-2 дня)
1. ✅ Протестировать с разными типами удобрений
2. ✅ Проверить корректность расчетов
3. ✅ Оптимизировать производительность
4. ✅ Обновить документацию

## Дополнительные функции

### Система уведомлений о низком содержании элементов

#### Пороги для макроэлементов (рекомендуемые)

```typescript
// В src/utils/nutrient-absorption.ts

export const DEFAULT_NUTRIENT_THRESHOLDS: NutrientThresholds = {
  min: {
    N: 2.0,  // Минимум азота (г)
    P: 1.5,  // Минимум фосфора (г)
    K: 2.0,  // Минимум калия (г)
    Ca: 1.0, // Минимум кальция (г)
    Mg: 0.5, // Минимум магния (г)
    S: 0.5,  // Минимум серы (г)
  },
  max: {
    N: 50.0, // Максимум азота (г) - предупреждение о переизбытке
    P: 30.0,
    K: 50.0,
    // ...
  },
};
```

#### Логика уведомлений

- **Критический уровень**: Элемент ниже минимума → красное уведомление
- **Предупреждение**: Элемент близок к минимуму (< 120% от минимума) → желтое уведомление
- **Переизбыток**: Элемент выше максимума → оранжевое уведомление

### Учет стадии плодоношения для азота

При стадии "плодоношение":
- Множитель поглощения азота: **0.5** (в 2 раза медленнее)
- Это означает, что азот будет поглощаться медленнее, но также нужно снижать дозировку при внесении
- Система должна предупреждать о переизбытке азота в период плодоношения

## Вопросы для обсуждения

1. **Типы усвояемости**: ✅ Оставляем 3 базовых типа (fast/medium/slow), но делаем расширяемыми для будущих добавлений

2. **Множители по умолчанию**: ✅ Используем: fast=1.5, medium=1.0, slow=0.6 (на основе исследований скорости растворения удобрений)

3. **Стадии роста**: ✅ Используем предложенные множители, но добавляем специфику для азота при плодоношении (0.5x)

4. **График**: ✅ Делаем отдельной опцией с выбором периода (7/14/30 дней)

5. **Обратная совместимость**: ✅ Используем 'medium' по умолчанию для старых записей

6. **Уведомления**: ✅ Реализуем систему напоминаний о низком содержании элементов (особенно макро)

## Примеры использования

### Пример 1: Быстро усвояемое удобрение (хелаты)
- Тип: `fast` (множитель 1.5)
- Фосфор: 50% → поглощается в 1.5 раза быстрее базового значения
- Через 7 дней останется ~25% вместо ~50% (при базовом периоде полураспада 14 дней)

### Пример 2: Медленно усвояемое удобрение (органическое)
- Тип: `slow` (множитель 0.6)
- Азот: 30% → поглощается в 0.6 раза (медленнее)
- Через 7 дней останется ~70% вместо ~50% (при базовом периоде полураспада 7 дней)

### Пример 3: Стадия вегетации
- Множитель стадии: 1.5
- Все элементы поглощаются в 1.5 раза быстрее
- Комбинируется с множителем типа удобрения

### Пример 4: Стадия плодоношения с азотом
- Монокалийфосфат (50% P, 33% K) с типом `fast`
- Фосфор: базовый период 14 дней, множитель типа 1.5, множитель стадии 1.3 → эффективный период ~7 дней
- Калий: базовый период 10 дней, множитель типа 1.5, множитель стадии 1.3 → эффективный период ~5 дней
- Азот (если был): базовый период 7 дней, множитель типа 1.5, множитель стадии 0.5 → эффективный период ~9 дней (медленнее!)

### Пример 5: Уведомление о низком содержании
- Текущее состояние: N=1.5г, P=1.0г, K=2.5г
- Пороги: N≥2.0г, P≥1.5г, K≥2.0г
- Система показывает уведомление: "Низкое содержание: N, P"
- Рекомендация: внести удобрение с высоким содержанием N и P

