/**
 * Скрипт для добавления задач по усвояемости удобрений в дорожную карту
 * Запуск: node scripts/add-fertilizer-absorption-tasks.js
 */

const tasks = [
  {
    title: 'Система уведомлений о низком содержании элементов',
    description: 'Реализовать систему напоминаний о низком содержании элементов (особенно макро). Добавить визуальные индикаторы в карточке перца и предупреждения о переизбытке азота при плодоношении.',
    category: 'feature',
    priority: 'high',
    status: 'planned',
    estimatedEffort: 'medium',
  },
  {
    title: 'Настройки усвояемости в формах удобрений',
    description: 'Добавить настройки усвояемости (fast/medium/slow) в форму создания/редактирования удобрений. Позволить пользователю указывать множители для каждого элемента.',
    category: 'feature',
    priority: 'medium',
    status: 'planned',
    estimatedEffort: 'small',
  },
  {
    title: 'График усвояемости как отдельная опция',
    description: 'Добавить график изменения элементов во времени как отдельную опцию с выбором периода (7/14/30 дней). Показывать динамику поглощения элементов.',
    category: 'feature',
    priority: 'medium',
    status: 'planned',
    estimatedEffort: 'medium',
  },
  {
    title: 'Получение информации об усвояемости из рецептов',
    description: 'Обновить логику массового полива для получения информации об усвояемости удобрений из рецепта. Сохранять тип усвояемости и множители в NutrientAddition.',
    category: 'improvement',
    priority: 'medium',
    status: 'planned',
    estimatedEffort: 'small',
  },
];

console.log('Задачи для добавления в дорожную карту:');
console.log(JSON.stringify(tasks, null, 2));
console.log('\nЭти задачи нужно добавить через интерфейс дорожной карты или через Firebase консоль.');

