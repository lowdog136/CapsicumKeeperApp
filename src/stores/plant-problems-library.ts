import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PlantProblem {
  id: string;
  name: string;
  description: string;
  category: 'chlorosis' | 'pest' | 'disease' | 'deficiency' | 'other';
  symptoms: string[];
  causes: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usePlantProblemsLibrary = defineStore('plant-problems-library', () => {
  const problems = ref<PlantProblem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Предустановленные проблемы растений
  const defaultProblems: PlantProblem[] = [
    // Хлорозы
    {
      id: 'iron-chlorosis',
      name: 'Железный хлороз',
      description:
        'Основным элементом, которого не хватает растению, является железо. Зараженные листья желтеют, но цвет прожилок остается по-прежнему насыщенным. Особенно нужно присмотреться к молодым листочкам, поскольку они страдают в первую очередь. Железный хлороз чаще диагностируется у растений, высаженных в известковый грунт.',
      category: 'chlorosis',
      symptoms: [
        'Желтеют листья, но прожилки остаются зелеными',
        'Сначала страдают молодые листочки',
        'Листья становятся светло-желтыми или белесыми',
      ],
      causes: [
        'Недостаток железа в почве',
        'Высокий pH почвы (известковый грунт)',
        'Переувлажнение почвы',
        'Низкая температура почвы',
      ],
      solutions: [
        'Внесение хелата железа',
        'Опрыскивание листьев раствором сульфата железа',
        'Снижение pH почвы',
        'Улучшение дренажа',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sulfur-chlorosis',
      name: 'Серный хлороз',
      description:
        'Болезнь диагностируется при нехватке серы. Первые ее проявления можно наблюдать на молодых листочках. При данном виде хлороза сначала меняют цвет жилки, а затем и весь лист.',
      category: 'chlorosis',
      symptoms: [
        'Сначала желтеют жилки листьев',
        'Затем желтеет весь лист',
        'Начинается с молодых листочков',
        'Листья становятся равномерно желтыми',
      ],
      causes: ['Недостаток серы в почве', 'Бедная органикой почва', 'Высокий pH почвы'],
      solutions: [
        'Внесение сульфата калия',
        'Добавление органических удобрений',
        'Внесение сульфата магния',
      ],
      severity: 'low',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'magnesium-chlorosis',
      name: 'Магниевый хлороз',
      description:
        'Здесь речь идет о дефиците магния, чаще всего развивается из-за песчаного типа почвы. Железный и магниевый хлороз схожи по внешним характеристикам, однако при дефиците магния сначала меняет цвет край листа, а затем вся пластина. Листочки окрашиваются в оранжевый или красный оттенки.',
      category: 'chlorosis',
      symptoms: [
        'Сначала желтеет край листа',
        'Затем желтеет вся пластина',
        'Листья могут окрашиваться в оранжевый или красный оттенки',
        'Начинается со старых листьев',
      ],
      causes: [
        'Недостаток магния в почве',
        'Песчаная почва',
        'Высокое содержание калия',
        'Кислая почва',
      ],
      solutions: [
        'Внесение сульфата магния',
        'Опрыскивание листьев раствором магния',
        'Добавление доломитовой муки',
        'Снижение количества калийных удобрений',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'zinc-chlorosis',
      name: 'Цинковый хлороз',
      description:
        'Характерная особенность состояния нижних листьев – появление пятен. Весна – идеальный период для развития цинкового хлороза из-за большого количества азота в почве.',
      category: 'chlorosis',
      symptoms: [
        'Появление пятен на нижних листьях',
        'Межжилковый хлороз',
        'Мелкие листья',
        'Замедленный рост',
      ],
      causes: [
        'Недостаток цинка в почве',
        'Высокое содержание азота',
        'Высокий pH почвы',
        'Холодная почва',
      ],
      solutions: [
        'Внесение сульфата цинка',
        'Опрыскивание листьев раствором цинка',
        'Снижение количества азотных удобрений',
        'Прогрев почвы',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'nitrogen-chlorosis',
      name: 'Азотный хлороз',
      description:
        'Понять, что это именно этот вид хлороза очень просто, поскольку сначала цвет меняют прожилки (становятся белыми), далее теряет цвет весь лист, начиная с середины. Итог бездействия – высохшие листья начинают опадать. Происходить так может из-за повышенной кислотности или переизбытка золы.',
      category: 'chlorosis',
      symptoms: [
        'Сначала белеют прожилки',
        'Затем желтеет весь лист, начиная с середины',
        'Листья опадают',
        'Замедленный рост растения',
      ],
      causes: [
        'Недостаток азота в почве',
        'Повышенная кислотность почвы',
        'Переизбыток золы',
        'Переувлажнение почвы',
      ],
      solutions: [
        'Внесение азотных удобрений',
        'Нормализация pH почвы',
        'Улучшение дренажа',
        'Добавление органических удобрений',
      ],
      severity: 'high',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'calcium-chlorosis',
      name: 'Кальциевый хлороз',
      description:
        'Хлороз препятствует дальнейшему росту растения, цветки и бутоны начинают опадать.',
      category: 'chlorosis',
      symptoms: [
        'Остановка роста растения',
        'Опадание цветков и бутонов',
        'Деформация листьев',
        'Отмирание верхушечных почек',
      ],
      causes: [
        'Недостаток кальция в почве',
        'Кислая почва',
        'Переизбыток калия',
        'Переувлажнение почвы',
      ],
      solutions: [
        'Внесение кальциевой селитры',
        'Добавление доломитовой муки',
        'Нормализация pH почвы',
        'Улучшение дренажа',
      ],
      severity: 'high',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Вредители
    {
      id: 'aphids',
      name: 'Тля',
      description:
        'Мелкие насекомые, питающиеся соком растений. Могут быть зеленого, черного, белого или красного цвета.',
      category: 'pest',
      symptoms: [
        'Скручивание листьев',
        'Липкий налет на листьях',
        'Деформация молодых побегов',
        'Появление муравьев на растении',
      ],
      causes: [
        'Сухая жаркая погода',
        'Избыток азотных удобрений',
        'Ослабленные растения',
        'Отсутствие естественных врагов',
      ],
      solutions: [
        'Опрыскивание мыльным раствором',
        'Использование инсектицидов',
        'Привлечение божьих коровок',
        'Удаление пораженных частей',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'spider-mites',
      name: 'Паутинный клещ',
      description:
        'Микроскопические клещи, образующие паутину на растениях. Часто появляются в сухую жаркую погоду.',
      category: 'pest',
      symptoms: [
        'Тонкая паутина на листьях',
        'Мелкие желтые точки на листьях',
        'Опадание листьев',
        'Замедленный рост',
      ],
      causes: [
        'Сухой воздух',
        'Высокая температура',
        'Отсутствие вентиляции',
        'Ослабленные растения',
      ],
      solutions: [
        'Увеличение влажности воздуха',
        'Опрыскивание водой',
        'Использование акарицидов',
        'Изоляция пораженных растений',
      ],
      severity: 'high',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'whiteflies',
      name: 'Белокрылка',
      description:
        'Мелкие белые насекомые, похожие на моль. При встряхивании растения разлетаются.',
      category: 'pest',
      symptoms: [
        'Белые насекомые на листьях',
        'Липкий налет на листьях',
        'Пожелтение листьев',
        'Замедленный рост',
      ],
      causes: [
        'Высокая температура',
        'Высокая влажность',
        'Плохая вентиляция',
        'Ослабленные растения',
      ],
      solutions: [
        'Использование желтых клеевых ловушек',
        'Опрыскивание инсектицидами',
        'Улучшение вентиляции',
        'Снижение влажности',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'thrips',
      name: 'Трипсы',
      description:
        'Мелкие удлиненные насекомые, питающиеся соком растений. Могут переносить вирусы.',
      category: 'pest',
      symptoms: [
        'Серебристые пятна на листьях',
        'Деформация цветков',
        'Черные точки экскрементов',
        'Замедленный рост',
      ],
      causes: [
        'Сухая жаркая погода',
        'Ослабленные растения',
        'Отсутствие естественных врагов',
        'Плохая гигиена',
      ],
      solutions: [
        'Использование инсектицидов',
        'Опрыскивание мыльным раствором',
        'Удаление пораженных частей',
        'Улучшение гигиены',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'scale-insects',
      name: 'Щитовка',
      description: 'Мелкие насекомые, покрытые восковым щитком. Прикрепляются к стеблям и листьям.',
      category: 'pest',
      symptoms: [
        'Коричневые или белые бугорки на стеблях',
        'Липкий налет на листьях',
        'Пожелтение листьев',
        'Замедленный рост',
      ],
      causes: [
        'Ослабленные растения',
        'Плохая вентиляция',
        'Высокая влажность',
        'Отсутствие естественных врагов',
      ],
      solutions: [
        'Механическое удаление щитовок',
        'Опрыскивание инсектицидами',
        'Улучшение вентиляции',
        'Удаление пораженных частей',
      ],
      severity: 'high',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mealybugs',
      name: 'Мучнистый червец',
      description:
        'Белые пушистые насекомые, образующие колонии на растениях. Выделяют липкий секрет.',
      category: 'pest',
      symptoms: [
        'Белые пушистые комочки на растении',
        'Липкий налет на листьях',
        'Пожелтение листьев',
        'Замедленный рост',
      ],
      causes: [
        'Высокая влажность',
        'Плохая вентиляция',
        'Ослабленные растения',
        'Отсутствие естественных врагов',
      ],
      solutions: [
        'Механическое удаление червецов',
        'Опрыскивание спиртовым раствором',
        'Использование инсектицидов',
        'Улучшение вентиляции',
      ],
      severity: 'medium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Инициализация с предустановленными проблемами
  function initializeProblems() {
    problems.value = [...defaultProblems];
  }

  // Добавить новую проблему
  function addProblem(problem: Omit<PlantProblem, 'id' | 'createdAt' | 'updatedAt'>) {
    const newProblem: PlantProblem = {
      ...problem,
      id: `problem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    problems.value.push(newProblem);
    return newProblem;
  }

  // Найти проблему по названию
  function findProblemByName(name: string): PlantProblem | undefined {
    return problems.value.find((p) => p.name.toLowerCase() === name.toLowerCase());
  }

  // Получить все проблемы
  function getAllProblems(): PlantProblem[] {
    return problems.value;
  }

  // Получить проблемы по категории
  function getProblemsByCategory(category: PlantProblem['category']): PlantProblem[] {
    return problems.value.filter((p) => p.category === category);
  }

  // Поиск проблем
  function searchProblems(query: string): PlantProblem[] {
    const searchTerm = query.toLowerCase();
    return problems.value.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.symptoms.some((s) => s.toLowerCase().includes(searchTerm)),
    );
  }

  // Удалить проблему
  function removeProblem(id: string) {
    const index = problems.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      problems.value.splice(index, 1);
    }
  }

  // Переключить избранное
  function toggleFavorite(id: string) {
    const problem = problems.value.find((p) => p.id === id);
    if (problem) {
      problem.isFavorite = !problem.isFavorite;
      problem.updatedAt = new Date().toISOString();
    }
  }

  return {
    problems,
    loading,
    error,
    initializeProblems,
    addProblem,
    findProblemByName,
    getAllProblems,
    getProblemsByCategory,
    searchProblems,
    removeProblem,
    toggleFavorite,
  };
});
