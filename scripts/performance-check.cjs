#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Скрипт для проверки производительности проекта
 * Анализирует размер bundle, зависимости и дает рекомендации
 */

console.log('🔍 Анализ производительности проекта...\n');

// Проверка размера node_modules
function checkNodeModulesSize() {
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const size = execSync(`du -sh ${nodeModulesPath} 2>/dev/null || echo "0"`, {
        encoding: 'utf8',
      }).trim();
      console.log(`📦 Размер node_modules: ${size}`);
    }
  } catch (error) {
    console.log('📦 Не удалось определить размер node_modules');
  }
}

// Анализ package.json
function analyzePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json не найден');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  console.log(`\n📋 Анализ зависимостей:`);
  console.log(`   • Рабочие зависимости: ${Object.keys(dependencies).length}`);
  console.log(`   • Зависимости разработки: ${Object.keys(devDependencies).length}`);

  // Проверка тяжелых зависимостей
  const heavyDependencies = [
    'lodash',
    'moment',
    'rxjs',
    'date-fns',
    'axios',
    'firebase',
    'vue',
    'quasar',
  ];

  const foundHeavy = heavyDependencies.filter((dep) => dependencies[dep] || devDependencies[dep]);

  if (foundHeavy.length > 0) {
    console.log(`   • Тяжелые зависимости: ${foundHeavy.join(', ')}`);
  }

  // Проверка на дублирующиеся зависимости
  const potentialDuplicates = [
    ['lodash', 'lodash-es'],
    ['moment', 'date-fns'],
    ['axios', 'fetch'],
  ];

  potentialDuplicates.forEach(([dep1, dep2]) => {
    if (
      (dependencies[dep1] || devDependencies[dep1]) &&
      (dependencies[dep2] || devDependencies[dep2])
    ) {
      console.log(`   ⚠️  Возможный дубликат: ${dep1} и ${dep2}`);
    }
  });
}

// Проверка dist папки
function checkDistSize() {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    try {
      const size = execSync(`du -sh ${distPath} 2>/dev/null || echo "0"`, {
        encoding: 'utf8',
      }).trim();
      console.log(`\n📁 Размер dist папки: ${size}`);

      // Проверка JS файлов
      const jsFiles = execSync(`find ${distPath} -name "*.js" -type f 2>/dev/null || echo ""`, {
        encoding: 'utf8',
      }).trim();
      if (jsFiles) {
        const jsCount = jsFiles.split('\n').filter((f) => f.trim()).length;
        console.log(`   • JS файлов: ${jsCount}`);
      }

      // Проверка CSS файлов
      const cssFiles = execSync(`find ${distPath} -name "*.css" -type f 2>/dev/null || echo ""`, {
        encoding: 'utf8',
      }).trim();
      if (cssFiles) {
        const cssCount = cssFiles.split('\n').filter((f) => f.trim()).length;
        console.log(`   • CSS файлов: ${cssCount}`);
      }
    } catch (error) {
      console.log('📁 Не удалось проанализировать dist папку');
    }
  } else {
    console.log('\n📁 Dist папка не найдена. Запустите сборку: npm run build');
  }
}

// Проверка конфигурации
function checkConfig() {
  console.log(`\n⚙️  Проверка конфигурации:`);

  // Проверка quasar.config.ts
  const quasarConfigPath = path.join(process.cwd(), 'quasar.config.ts');
  if (fs.existsSync(quasarConfigPath)) {
    const config = fs.readFileSync(quasarConfigPath, 'utf8');

    // Проверка оптимизаций
    const optimizations = [
      { key: 'preFetch', check: /preFetch:\s*true/, message: 'Prefetch включен' },
      { key: 'minify', check: /minify:\s*true/, message: 'Minification включен' },
      { key: 'manualChunks', check: /manualChunks/, message: 'Manual chunks настроен' },
      { key: 'terserOptions', check: /terserOptions/, message: 'Terser options настроен' },
    ];

    optimizations.forEach((opt) => {
      if (opt.check.test(config)) {
        console.log(`   ✅ ${opt.message}`);
      } else {
        console.log(`   ❌ ${opt.message} - не найден`);
      }
    });
  } else {
    console.log('   ❌ quasar.config.ts не найден');
  }
}

// Рекомендации по оптимизации
function showRecommendations() {
  console.log(`\n🚀 Рекомендации по оптимизации:`);

  const recommendations = [
    '1. Запустите анализ bundle: npm run build:analyze',
    '2. Проверьте неиспользуемые зависимости: npx depcheck',
    '3. Оптимизируйте изображения: используйте WebP формат',
    '4. Настройте Service Worker для кэширования',
    '5. Используйте lazy loading для компонентов',
    '6. Добавьте компрессию gzip/brotli на сервер',
    '7. Оптимизируйте Firebase импорты',
    '8. Используйте виртуализацию для больших списков',
    '9. Добавьте debounce для поиска',
    '10. Настройте HTTP заголовки для кэширования',
  ];

  recommendations.forEach((rec) => {
    console.log(`   • ${rec}`);
  });
}

// Проверка производительности файлов
function checkPerformanceFiles() {
  console.log(`\n📄 Проверка файлов производительности:`);

  const files = [
    { path: 'PERFORMANCE_OPTIMIZATION.md', name: 'Руководство по оптимизации' },
    { path: 'src/composables/useCache.ts', name: 'Кэширование' },
    { path: 'src/components/VirtualizedList.vue', name: 'Виртуализированный список' },
  ];

  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file.name} - создан`);
    } else {
      console.log(`   ❌ ${file.name} - не найден`);
    }
  });
}

// Основная функция
function main() {
  checkNodeModulesSize();
  analyzePackageJson();
  checkDistSize();
  checkConfig();
  checkPerformanceFiles();
  showRecommendations();

  console.log(`\n✨ Анализ завершен! Подробные рекомендации в PERFORMANCE_OPTIMIZATION.md`);
}

// Запуск скрипта
main();
