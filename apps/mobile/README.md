# Vocabulando Mobile (React Native / Expo + Widgets Nativos)

- **Lógica compartilhada:** consome `@vocabulando/domain` (SRS, Streak, Zod, segurança).
- **Offline-First:** eventos gravados localmente em SQLite e sincronizados com `/api/events` via `eventId` idempotente.
- **Widgets à Prova de Falhas:**
  - iOS (`native/ios/VocabulandoWidget.swift`): `WidgetKit` com pré-cache de 14 dias em `App Group` + fallback embutido.
  - Android (`native/android/VocabulandoGlanceWidget.kt`): `Jetpack Glance` com pré-cache de 14 dias em `SharedPreferences` + fallback embutido.
