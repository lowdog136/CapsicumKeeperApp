# 🚀 Release Process

Этот документ описывает процесс создания релизов для CapsicumKeeper.

## Автоматические релизы

### Быстрый релиз

Для создания релиза используйте npm скрипты:

```bash
# Патч релиз (0.1.0 -> 0.1.1) - исправления багов
npm run release:patch

# Минорный релиз (0.1.0 -> 0.2.0) - новая функциональность
npm run release:minor

# Мажорный релиз (0.1.0 -> 1.0.0) - breaking changes
npm run release:major
```

### Что происходит автоматически:

1. ✅ Обновляется версия в `package.json`
2. ✅ Создается git коммит с новой версией
3. ✅ Создается git тег
4. ✅ Изменения отправляются в GitHub
5. ✅ Запускается GitHub Actions workflow
6. ✅ Создается GitHub Release
7. ✅ Проект собирается и деплоится в Firebase

## Ручной процесс

Если нужно создать релиз вручную:

```bash
# 1. Обновить версию в package.json
# 2. Обновить CHANGELOG.md
git add .
git commit -m "chore: prepare release v1.2.3"
git tag -a v1.2.3 -m "Version 1.2.3"
git push origin main
git push origin v1.2.3
```

## Conventional Commits

Используйте conventional commits для автоматического генерирования changelog:

```bash
# Новая функциональность
git commit -m "feat: add user authentication"

# Исправление бага
git commit -m "fix: resolve login issue"

# Документация
git commit -m "docs: update README"

# Рефакторинг
git commit -m "refactor: improve code structure"
```

## Типы версий

- **Patch (0.0.1)** - исправления багов, не ломающие API
- **Minor (0.1.0)** - новая функциональность, обратно совместимая
- **Major (1.0.0)** - breaking changes, несовместимые изменения

## GitHub Secrets

Для работы автоматических релизов нужны секреты:

- `FIREBASE_SERVICE_ACCOUNT` - JSON ключ сервисного аккаунта Firebase

## Мониторинг

- GitHub Releases: https://github.com/lowdog136/CapsicumKeeperApp/releases
- GitHub Actions: https://github.com/lowdog136/CapsicumKeeperApp/actions
- Firebase Console: https://console.firebase.google.com/project/capsicum-keeper-app
