## Android Build & Install Guide

### 1. Environment Requirements

- **Node.js**: version 18 or newer (совместимо с проектом)
- **npm**: версия 8+
- **Java**: JDK 17 (Android Studio Otter уже включает нужный JDK)
- **Android SDK**: установленный путь (например, `/home/zooloo/Android/Sdk`)
- **Capacitor CLI** и **Quasar CLI** уже подключаются через `npx`

### 2. Подготовка проекта к мобильной сборке

1. Убедись, что в корне проекта выполнена установка зависимостей:
   ```bash
   npm install
   ```
2. Каталог `src-capacitor/` уже инициализирован. Путь Android SDK прописан в  
   `src-capacitor/android/local.properties`:
   ```
   sdk.dir=/home/zooloo/Android/Sdk
   ```
   При переносе проекта на другую машину обнови путь при необходимости.

### 3. Сборка APK

Релизный и дебаг-APK собираются командами:

```bash
# релизная сборка (unsigned)
npx quasar build -m capacitor -T android

# дебаг-сборка
cd src-capacitor/android
./gradlew assembleDebug
```

Итоговые файлы:

- `src-capacitor/android/app/build/outputs/apk/release/app-release-unsigned.apk`
- `src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`

`app-release-unsigned.apk` нужно подписывать вручную перед публикацией.  
`app-debug.apk` можно устанавливать напрямую на устройство.

### 4. Установка на устройство

1. Включи на телефоне режим разработчика и **USB debugging**.
2. Подключи устройство по USB.
3. Удали старую версию, чтобы гарантировать чистую установку:
   ```bash
   adb uninstall CapsicumKeeper.ru
   ```
4. Установи свежий APK:
   ```bash
   adb install src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. Открой приложение на телефоне — на главном экране отображается строка вида  
   `Build: mobile v3.2.0-rc.X (YYYY-MM-DD)` для проверки актуальности сборки.

### 5. Сборка и запуск через Android Studio

1. Выполни `npx quasar build -m capacitor -T android`, чтобы обновить `www/`.
2. Открой Studio командой:
   ```bash
   npx cap open android
   ```
3. В студии выбери `app` → `Run` (зелёный треугольник).  
   Приложение соберётся и установится на подключённое устройство/эмулятор.

### 6. Release Checklist

- Обнови версию в `package.json` (например, `3.2.1`) и синхронизируй build-маркер на главной странице.
- Собери релизный APK (`quasar build`) и подпиши его.
- Создай Git-тег и релиз (см. раздел Release в репозитории).
- Обнови документацию/CHANGELOG, если требуется.

### 7. Troubleshooting

- **Не находится SDK**: проверь `local.properties` или переменную `ANDROID_HOME`.
- **Консоль просит clean Gradle**: выполните `./gradlew clean` внутри `src-capacitor/android`.
- **APK не обновляется**: удалить старую версию, убедиться, что установлен свежий файл (дата и build-маркер).

