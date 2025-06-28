#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔍 Получение информации о Firebase проекте...\n');

try {
  // Получаем список проектов
  const projectsOutput = execSync('firebase projects:list', { encoding: 'utf8' });
  console.log('📋 Доступные проекты:');
  console.log(projectsOutput);

  console.log('\n📝 Инструкции по созданию сервисного аккаунта:');
  console.log('1. Перейдите в Firebase Console: https://console.firebase.google.com/');
  console.log('2. Выберите проект CapsicumKeeper (pepperfarmapp-e782b)');
  console.log('3. В левом меню найдите "Project settings" (⚙️)');
  console.log('4. Перейдите на вкладку "Service accounts"');
  console.log('5. Нажмите "Generate new private key"');
  console.log('6. Выберите "Firebase Admin SDK"');
  console.log('7. Нажмите "Generate key"');
  console.log('8. Скачайте JSON файл');
  console.log('\n📋 Затем добавьте секрет в GitHub:');
  console.log(
    '1. Перейдите в https://github.com/lowdog136/CapsicumKeeperApp/settings/secrets/actions',
  );
  console.log('2. Нажмите "New repository secret"');
  console.log('3. Name: FIREBASE_SERVICE_ACCOUNT');
  console.log('4. Value: скопируйте содержимое JSON файла');
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
