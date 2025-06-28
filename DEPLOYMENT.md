# Деплой CapsicumKeeper в Firebase

## 🚀 Быстрый старт

### 1. Установка Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Авторизация

```bash
firebase login
```

### 3. Инициализация проекта (если еще не сделано)

```bash
firebase init
```

Выберите:

- Hosting
- Storage
- Используйте существующий проект: `capsicumkeeper-e782b`

### 4. Сборка и деплой

```bash
# Сборка + деплой одной командой
npm run build:firebase

# Или по отдельности
npm run build
npm run deploy
```

## 📁 Структура деплоя

```
capsicumkeeper-e782b/
├── hosting/          # Веб-приложение
│   └── dist/spa/     # Собранные файлы Quasar
├── storage/          # Изображения перцев
│   └── pepper-photos/
└── firestore/        # База данных
    └── peppers/
```

## 🔧 Конфигурация

### Firebase Hosting

- **Домен**: `https://capsicumkeeper-e782b.web.app`
- **Папка**: `dist/spa` (собранные файлы Quasar)
- **SPA**: Все маршруты перенаправляются на `index.html`

### Firebase Storage

- **Правила**: `storage.rules`
- **Папка**: `pepper-photos/`
- **Лимиты**: 5MB на файл, только изображения

## 🌐 Домены

После деплоя приложение будет доступно по адресам:

- `https://capsicumkeeper-e782b.web.app`
- `https://capsicumkeeper-e782b.firebaseapp.com`

## 📊 Мониторинг

### Firebase Console

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `capsicumkeeper-e782b`
3. Разделы:
   - **Hosting**: статистика посещений, версии
   - **Storage**: загруженные изображения
   - **Firestore**: данные перцев
   - **Analytics**: аналитика (если включена)

### Логи

```bash
# Просмотр логов
firebase hosting:log

# Просмотр логов в реальном времени
firebase hosting:log --tail
```

## 🔄 CI/CD (GitHub Actions)

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: capsicumkeeper-e782b
```

## 🛠️ Устранение проблем

### Ошибка "Project not found"

```bash
firebase use capsicumkeeper-e782b
```

### Ошибка "Permission denied"

```bash
firebase login --reauth
```

### Ошибка сборки

```bash
# Очистка кэша
rm -rf node_modules
npm install
npm run build
```

### Проблемы с Storage

1. Проверьте правила в `storage.rules`
2. Убедитесь, что Storage включен в Firebase Console
3. Проверьте CORS настройки

## 📈 Оптимизация

### Кэширование

- Статические файлы кэшируются на 1 год
- HTML файлы не кэшируются для SPA

### Сжатие

- Firebase автоматически сжимает файлы
- Включите gzip в браузере

### CDN

- Firebase использует глобальную CDN
- Файлы раздаются из ближайшего региона

## 🔐 Безопасность

### Правила доступа

- Firestore: только авторизованные пользователи
- Storage: чтение всем, запись авторизованным
- Hosting: публичный доступ

### Переменные окружения

```bash
# Локальная разработка
firebase functions:config:set app.environment="development"

# Продакшн
firebase functions:config:set app.environment="production"
```
