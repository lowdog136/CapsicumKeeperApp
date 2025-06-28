module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Новая функциональность
        'fix', // Исправление багов
        'docs', // Изменения в документации
        'style', // Изменения в форматировании кода
        'refactor', // Рефакторинг кода
        'perf', // Улучшения производительности
        'test', // Добавление тестов
        'chore', // Изменения в конфигурации, зависимостях
        'ci', // Изменения в CI/CD
        'build', // Изменения в системе сборки
        'revert', // Откат изменений
      ],
    ],
    'subject-case': [0], // Отключаем проверку регистра в заголовке
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
