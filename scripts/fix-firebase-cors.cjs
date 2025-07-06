#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Настройка CORS для Firebase Storage...\n');

// Создаем файл конфигурации CORS
const corsConfig = {
  cors: [
    {
      origin: ['*'],
      method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
      responseHeader: [
        'Content-Type',
        'Content-Length',
        'Date',
        'Server',
        'Range',
        'Accept-Ranges',
        'Cache-Control',
        'Content-Range',
        'ETag',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers',
        'Access-Control-Max-Age',
      ],
      maxAgeSeconds: 3600,
    },
  ],
};

const corsFilePath = path.join(process.cwd(), 'cors.json');
fs.writeFileSync(corsFilePath, JSON.stringify(corsConfig, null, 2));

console.log('✅ Создан файл cors.json');

// Попытка применить CORS конфигурацию
try {
  console.log('📡 Применяем CORS конфигурацию к Firebase Storage...');

  // Нужно получить storage bucket name из firebase config
  const firebaseConfigPath = path.join(process.cwd(), 'src/boot/firebase.ts');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = fs.readFileSync(firebaseConfigPath, 'utf8');
    const bucketMatch = config.match(/storageBucket:\s*['"]([^'"]+)['"]/);

    if (bucketMatch) {
      const bucketName = bucketMatch[1];
      console.log(`🪣 Найден bucket: ${bucketName}`);

      // Применяем CORS настройки
      console.log('🔧 Выполняем команду gsutil...');
      console.log('📋 Команда для ручного выполнения:');
      console.log(`gsutil cors set cors.json gs://${bucketName}`);

      // Пытаемся выполнить автоматически
      try {
        execSync(`gsutil cors set cors.json gs://${bucketName}`, { stdio: 'inherit' });
        console.log('✅ CORS конфигурация применена успешно!');
      } catch (error) {
        console.log('⚠️  Автоматическое применение не удалось. Выполните команду вручную:');
        console.log(`gsutil cors set cors.json gs://${bucketName}`);
        console.log('\n📋 Для установки gsutil:');
        console.log('1. Установите Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
        console.log('2. Авторизуйтесь: gcloud auth login');
        console.log('3. Выполните команду выше');
      }
    } else {
      console.log('❌ Не удалось найти storageBucket в firebase.ts');
    }
  }
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}

console.log('\n🔍 Альтернативные решения CORS проблемы:');
console.log('1. Проверьте Firebase Storage Rules');
console.log('2. Используйте Firebase Admin SDK для server-side операций');
console.log('3. Убедитесь, что домен добавлен в Firebase Authentication');
console.log('4. Проверьте настройки проекта в Firebase Console');

// Очищаем временный файл
setTimeout(() => {
  if (fs.existsSync(corsFilePath)) {
    fs.unlinkSync(corsFilePath);
    console.log('🧹 Удален временный файл cors.json');
  }
}, 5000);
