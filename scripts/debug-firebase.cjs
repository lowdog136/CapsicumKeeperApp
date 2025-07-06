#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Отладка Firebase конфигурации...\n');

// Проверка конфигурации Firebase
function checkFirebaseConfig() {
  console.log('📋 Проверка конфигурации Firebase:');

  const firebaseConfigPath = path.join(process.cwd(), 'src/boot/firebase.ts');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = fs.readFileSync(firebaseConfigPath, 'utf8');

    // Извлекаем основные параметры
    const apiKeyMatch = config.match(/apiKey:\s*['"]([^'"]+)['"]/);
    const projectIdMatch = config.match(/projectId:\s*['"]([^'"]+)['"]/);
    const storageBucketMatch = config.match(/storageBucket:\s*['"]([^'"]+)['"]/);
    const authDomainMatch = config.match(/authDomain:\s*['"]([^'"]+)['"]/);

    if (apiKeyMatch) console.log(`   ✅ API Key: ${apiKeyMatch[1].substring(0, 10)}...`);
    if (projectIdMatch) console.log(`   ✅ Project ID: ${projectIdMatch[1]}`);
    if (storageBucketMatch) console.log(`   ✅ Storage Bucket: ${storageBucketMatch[1]}`);
    if (authDomainMatch) console.log(`   ✅ Auth Domain: ${authDomainMatch[1]}`);

    console.log('');
  } else {
    console.log('   ❌ Файл firebase.ts не найден');
  }
}

// Проверка правил Storage
function checkStorageRules() {
  console.log('🛡️  Проверка Storage Rules:');

  const storageRulesPath = path.join(process.cwd(), 'storage.rules');
  if (fs.existsSync(storageRulesPath)) {
    console.log('   ✅ Файл storage.rules найден');
    const rules = fs.readFileSync(storageRulesPath, 'utf8');

    // Проверяем основные правила
    if (rules.includes('pepper-photos')) {
      console.log('   ✅ Правила для pepper-photos настроены');
    }
    if (rules.includes('allow read: if true')) {
      console.log('   ✅ Чтение разрешено для всех');
    }
    if (rules.includes('request.auth != null')) {
      console.log('   ✅ Запись требует авторизации');
    }
  } else {
    console.log('   ❌ Файл storage.rules не найден');
  }
  console.log('');
}

// Проверка Firestore правил
function checkFirestoreRules() {
  console.log('🔐 Проверка Firestore Rules:');

  const firestoreRulesPath = path.join(process.cwd(), 'firestore.rules');
  if (fs.existsSync(firestoreRulesPath)) {
    console.log('   ✅ Файл firestore.rules найден');
    const rules = fs.readFileSync(firestoreRulesPath, 'utf8');

    // Проверяем базовые правила
    if (rules.includes('peppers')) {
      console.log('   ✅ Правила для коллекции peppers настроены');
    }
    if (rules.includes('varieties_v2')) {
      console.log('   ✅ Правила для коллекции varieties_v2 настроены');
    }
  } else {
    console.log('   ❌ Файл firestore.rules не найден');
  }
  console.log('');
}

// Анализ ошибок CORS
function analyzeCorsIssues() {
  console.log('🌐 Анализ проблем CORS:');
  console.log('   📍 Частые причины CORS ошибок:');
  console.log('      • Неправильная конфигурация CORS в Firebase Storage');
  console.log('      • Домен не добавлен в Authorized domains (Firebase Console)');
  console.log('      • Неправильные Storage Rules');
  console.log('      • Проблемы с preflight OPTIONS запросами');
  console.log('');

  console.log('   🔧 Способы решения:');
  console.log('      1. Настройте CORS: npm run firebase:fix-cors');
  console.log(
    '      2. Добавьте домен в Firebase Console > Authentication > Settings > Authorized domains',
  );
  console.log('      3. Проверьте Storage Rules на корректность');
  console.log('      4. Используйте Firebase Admin SDK для server-side операций');
  console.log('');
}

// Проверка сетевых запросов
function checkNetworkRequests() {
  console.log('🌍 Рекомендации по отладке сетевых запросов:');
  console.log('   1. Откройте DevTools (F12) > Network tab');
  console.log('   2. Фильтруйте по "firebase" или "googleapis"');
  console.log('   3. Проверьте статус код ответов:');
  console.log('      • 200 - успешно');
  console.log('      • 403 - проблемы с правилами/авторизацией');
  console.log('      • 404 - файл/endpoint не найден');
  console.log('      • CORS error - проблемы с CORS');
  console.log('   4. Проверьте Headers в запросах');
  console.log('');
}

// Проверка текущего окружения
function checkEnvironment() {
  console.log('🏗️  Информация о текущем окружении:');

  // Проверяем package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`   📦 Проект: ${pkg.name} v${pkg.version}`);

    // Проверяем Firebase зависимости
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.firebase) {
      console.log(`   🔥 Firebase: ${deps.firebase}`);
    }
    if (deps['firebase-admin']) {
      console.log(`   🔧 Firebase Admin: ${deps['firebase-admin']}`);
    }
    if (deps['firebase-tools']) {
      console.log(`   🛠️  Firebase Tools: ${deps['firebase-tools']}`);
    }
  }

  console.log(`   🌐 Node.js: ${process.version}`);
  console.log(`   📁 Working Directory: ${process.cwd()}`);
  console.log('');
}

// Рекомендации по безопасности
function securityRecommendations() {
  console.log('🔒 Рекомендации по безопасности:');
  console.log('   1. Никогда не коммитьте API ключи в репозиторий');
  console.log('   2. Используйте переменные окружения для секретов');
  console.log('   3. Настройте правильные Firebase Rules');
  console.log('   4. Ограничьте домены в Firebase Console');
  console.log('   5. Регулярно проверяйте логи безопасности');
  console.log('');
}

// Полезные команды
function usefulCommands() {
  console.log('🛠️  Полезные команды:');
  console.log('   • npm run firebase:fix-cors - исправить CORS');
  console.log('   • npm run perf:check - проверить производительность');
  console.log('   • firebase deploy - развернуть проект');
  console.log('   • firebase serve - локальный сервер');
  console.log('   • firebase login - авторизация');
  console.log('   • firebase projects:list - список проектов');
  console.log('');
}

// Основная функция
function main() {
  checkEnvironment();
  checkFirebaseConfig();
  checkStorageRules();
  checkFirestoreRules();
  analyzeCorsIssues();
  checkNetworkRequests();
  securityRecommendations();
  usefulCommands();

  console.log('✨ Отладка завершена! Если проблемы остались, проверьте Firebase Console.');
}

// Запуск скрипта
main();
