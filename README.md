
<div align="center">

```
██╗    ██╗ █████╗ ██████╗ ██████╗ ██████╗  ██████╗ ██████╗ ███████╗     █████╗ ██╗
██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝    ██╔══██╗██║
██║ █╗ ██║███████║██████╔╝██║  ██║██████╔╝██║   ██║██████╔╝█████╗      ███████║██║
██║███╗██║██╔══██║██╔══██╗██║  ██║██╔══██╗██║   ██║██╔══██╗██╔══╝      ██╔══██║██║
╚███╔███╔╝██║  ██║██║  ██║██████╔╝██║  ██║╚██████╔╝██████╔╝███████╗    ██║  ██║██║
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚═╝  ╚═╝╚═╝
```

**Your personal AI-powered wardrobe stylist**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Three.js](https://img.shields.io/badge/Three.js-r184-000000?style=flat-square&logo=three.js)](https://threejs.org)

</div>

---

## Что это

WardrobeAI — полноценное full-stack приложение, которое превращает ваш цифровой гардероб в умного стилиста. Загружайте вещи, и AI сам соберёт для вас образы с учётом погоды, ваших предпочтений и базы стайлинг-правил. Спросите живого AI-стилиста в чате — он знает каждую вещь в вашем шкафу.

---

## Ключевые возможности

### Гардероб
- Добавляйте вещи с фото — система автоматически **удаляет фон** с изображения ([@imgly/background-removal](https://github.com/imgly/background-removal))
- Категории, сезоны, бренды, материалы, цвета — полная карточка вещи
- AI анализирует метаданные каждой загруженной вещи для лучших рекомендаций

### AI-генерация образов
- **Gemini 1.5 Flash** собирает образ из вашего гардероба (primary)
- **GPT-4o-mini** подхватывает, если Gemini недоступен (fallback)
- Образ учитывает: текущую погоду, ваши пожелания, прикреплённые вещи
- RAG-система подбирает релевантные стайлинг-правила из базы знаний
- AI генерирует название образа и объясняет, почему именно эти вещи работают вместе
- Встроенная ротация обуви: одна и та же пара не повторяется в каждом луке

### AI-чат стилист
- Полноценный чат в реальном времени через **WebSocket**
- Три AI-модели: **GigaChat** (Sber), **Gemini**, **GPT-4o-mini**
- Стилист "знает" весь ваш гардероб и может прикрепить конкретные вещи к ответу
- История диалога сохраняется между сессиями

### Погода
- Геолокация прямо из браузера
- Данные в реальном времени через **Open-Meteo API** (бесплатно, без ключа)
- AI учитывает температуру и погодные условия при подборе образа

### Планировщик событий
- Создавайте события и привязывайте к ним образы
- Никогда не думайте "что надеть" перед важной встречей

### Дашборд
- Аналитика вашего гардероба: категории, цвета, сезоны
- Статистика образов и использования вещей

---

## Стек

### Frontend `/client`

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 16 — App Router |
| UI | React 19, функциональные компоненты |
| Язык | TypeScript 5 (`strict: true`) |
| State | Redux Toolkit 2 + react-redux 9 |
| HTTP | Axios с interceptors (silent token refresh) |
| Формы | react-hook-form 7 + Zod 4 + @hookform/resolvers |
| 3D / визуал | Three.js r184, @react-three/fiber 9, @shadergradient/react |
| Компоненты | Radix UI (Dialog, Toast, Slot) |
| Стили | CSS Modules + design tokens (Obsidian dark theme) |
| i18n | i18next + react-i18next |
| Иконки | lucide-react |
| Linting | ESLint 9 (flat config) + Prettier 3 |

### Backend `/server`

| Слой | Технология |
|------|-----------|
| Фреймворк | Express 5 |
| БД | PostgreSQL + Sequelize 6 |
| Auth | JWT (access + refresh) через HTTP-only cookies |
| Real-time | WebSocket (`ws`) |
| AI — генерация образов | Gemini 1.5 Flash → GPT-4o-mini (fallback) |
| AI — чат | GigaChat (Sber) + Gemini + GPT-4o-mini |
| RAG | LangChain + GigaChat embeddings + векторный поиск |
| Изображения | @imgly/background-removal-node + Jimp |
| Погода | Open-Meteo API (геокодинг + прогноз) |
| Валидация | Zod 4 |
| Upload | Multer |

---

## Архитектура

### Frontend — Feature-Sliced Design

```
client/src/
├── app/                     # Роуты, layout, Redux store, провайдеры (i18n, Redux)
│   ├── (protected)/         # Защищённые страницы (authGuard)
│   │   ├── ai/              # AI-чат со стилистом
│   │   ├── dashboard/       # Аналитика гардероба
│   │   ├── events/          # Планировщик событий
│   │   ├── look-builder/    # Конструктор образов
│   │   ├── looks/           # Сохранённые образы
│   │   ├── profile/         # Профиль пользователя
│   │   └── wardrobe/        # Управление гардеробом
│   └── auth/                # Страница входа / регистрации
│
├── entities/                # Доменные модели + slices + thunks
│   ├── cloth/               # Вещи гардероба
│   ├── look/                # Образы
│   ├── user/                # Пользователь
│   ├── dashboard/           # Данные дашборда
│   ├── events/              # События
│   ├── message/             # Сообщения чата
│   └── weather/             # Погода
│
├── features/                # Фичи (use-cases)
│   ├── wardrobe/            # CRUD вещей (диалоги добавления/редактирования)
│   └── send-message/        # Отправка сообщения в чат
│
├── widgets/                 # Составные UI-блоки
│   ├── Header/              # Шапка с авторизацией
│   ├── Footer/
│   ├── LookBuilder/         # Конструктор образа
│   ├── LookCard/            # Карточка образа
│   ├── Chat/                # AI-чат виджет
│   ├── OutfitOfTheDay/      # Образ дня
│   ├── CalendarPlans/       # Календарь событий
│   └── CategoryBreakdown/   # Разбивка гардероба по категориям
│
└── shared/                  # Переиспользуемое
    ├── ui/                  # Card, Modal, Toast, Spinner, ThemeToggle, SidebarNav
    ├── lib/                 # axiosInstance, helpers
    ├── hooks/               # useAppDispatch, useGeolocation, useTheme, ...
    ├── constants/           # API routes
    └── i18n/                # Локализация
```

Слои импортируют только вниз: `app → widgets → features → entities → shared`

### Backend — Сервисная архитектура

```
server/src/
├── app.js                   # Entry point: Express + HTTP server + WebSocket
├── config/                  # serverConfig, CORS, cookies, JWT, multer, aiConfig
├── routes/                  # api.routes → auth, tokens, users, profile,
│                            #   cloth, looks, events, chats, upload,
│                            #   dashboard, weather
├── controllers/             # HTTP-обработчики (thin layer)
├── services/
│   ├── Auth.service.js      # Регистрация, вход, выход, refresh
│   ├── Cloth.service.js     # CRUD вещей
│   ├── Look.service.js      # CRUD образов
│   ├── LookGenerate.service.js   # AI-генерация образов (Gemini + GPT fallback)
│   ├── AiChat.service.js    # Логика AI-стилиста в чате
│   ├── WardrobeAnalyze.service.js # Анализ гардероба для чата
│   ├── GigaChat.service.js  # GigaChat клиент (Sber)
│   ├── ImageProcessing.service.js # Удаление фона + оптимизация
│   ├── Weather.service.js   # Open-Meteo геолокация + прогноз
│   ├── Event.service.js     # События
│   ├── Profile.service.js   # Профиль
│   └── File.service.js      # Файловые операции
├── rag/
│   ├── styleRagStore.js     # Векторное хранилище стайлинг-правил
│   ├── styleRulesRetriever.js # Семантический поиск правил
│   ├── GigaChatEmbeddings.js  # Эмбеддинги через GigaChat
│   └── stylingRulesLoader.js  # Загрузка базы знаний
├── db/
│   ├── models/              # User, Profile, Cloth, Look, LookCloth,
│   │                        # Chat, ChatMessage, MessageCloth, Event
│   ├── migrations/          # Sequelize миграции
│   └── seeders/             # Тестовые данные
├── middleware/              # verifyAccessToken, verifyRefreshToken,
│                            # rateLimit, upload, removeHttpHeader
├── schemas/                 # Zod-схемы для валидации AI-ответов
├── utils/                   # hashPassword, generateJWT, stylistPrompt, ...
└── ws/
    └── chatWs.js            # WebSocket сервер чата
```

---

## AI-пайплайн: генерация образа

```
POST /api/looks/generate
        │
        ▼
  Загрузка гардероба пользователя (до 80 вещей)
        │
        ▼
  RAG-поиск релевантных стайлинг-правил
  (GigaChat Embeddings → векторный поиск)
        │
        ▼
  Построение промта (профиль + погода + вещи + правила)
        │
        ▼
  ┌─────────────────────────────┐
  │  Gemini 1.5 Flash           │ ──────────────────►  JSON { items, look_name, occasion }
  │  (structured outputs)       │
  └─────────────────────────────┘
        │  timeout / error
        ▼
  ┌─────────────────────────────┐
  │  GPT-4o-mini (fallback)     │ ──────────────────►  JSON { items, look_name, occasion }
  │  via GenAPI proxy           │
  └─────────────────────────────┘
        │
        ▼
  Zod-валидация ответа AI
        │
        ▼
  Post-processing:
  • Дедупликация вещей
  • Принудительно ровно 1 низ
  • Обувь обязательна (ротация для разнообразия)
  • Прикреплённые вещи становятся "якорями"
        │
        ▼
  AI-комментарий "почему этот образ" (Gemini → GPT fallback)
        │
        ▼
  DB транзакция: Look + LookCloth
        │
        ▼
  Кэш (5 мин, до 500 записей)
```

---

## Auth Flow

```
sign-up / sign-in
      │
      ▼
  accessToken → память браузера (closure)
  refreshToken → HTTP-only cookie
      │
      ▼
  Каждый запрос: Authorization: Bearer <accessToken>
      │
  403 ответ?
      │
      ▼
  GET /api/tokens/refresh → новый accessToken → retry запроса
```

---

## API

Все ответы приходят в едином формате:

```typescript
{
  statusCode: number;
  message:    string;
  data:       T | null;
  error:      string | null;
}
```

### Эндпоинты

| Ресурс | Метод | Путь |
|--------|-------|------|
| Auth | POST | `/api/auth/signUp` |
| Auth | POST | `/api/auth/signIn` |
| Auth | POST | `/api/auth/signOut` |
| Tokens | GET | `/api/tokens/refresh` |
| Users | GET | `/api/users` |
| Users | DELETE | `/api/users/:id` |
| Profile | GET/PUT | `/api/profile` |
| Cloth | GET/POST | `/api/cloth` |
| Cloth | GET/PUT/DELETE | `/api/cloth/:id` |
| Looks | GET/POST | `/api/looks` |
| Looks | GET/PUT/DELETE | `/api/looks/:id` |
| Looks | POST | `/api/looks/generate` |
| Events | GET/POST/PUT/DELETE | `/api/events` |
| Chat | GET/POST | `/api/chats` |
| Dashboard | GET | `/api/dashboard` |
| Upload | POST | `/api/upload` |
| Weather | GET | `/api/weather` |
| **WebSocket** | WS | `ws://host:port?token=<accessToken>` |

---

## Быстрый старт

### Требования

- Node.js ≥ 18
- PostgreSQL (любая современная версия)
- API-ключи: `GEMINI_API_KEY`, `OPENAI_API_KEY` (GenAPI), `GIGACHAT_CREDENTIALS` (опционально)

### Backend

```bash
cd server
npm install

# Создайте .env (см. раздел "Переменные окружения")
cp .env.example .env

# Создать БД и накатить миграции
npm run db:create
npm run db:migrate

# (Опционально) тестовые данные
npm run db:seed

# Запуск в dev-режиме
npm run dev
```

Сервер запустится на `http://localhost:4000` (автоматически ищет свободный порт).

### Frontend

```bash
cd client
npm install

# Создайте .env.local
cp .env.example .env.local

# Запуск в dev-режиме
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

---

## Переменные окружения

### `server/.env`

| Переменная | Описание |
|-----------|---------|
| `PORT` | Порт сервера (default: `4000`) |
| `NODE_ENV` | `development` / `production` |
| `DB_NAME` | Имя БД PostgreSQL |
| `DB_USER` | Пользователь БД |
| `DB_PASS` | Пароль БД |
| `DB_HOST` | Хост БД |
| `DB_PORT` | Порт БД |
| `JWT_ACCESS` | Секрет для access token |
| `JWT_REFRESH` | Секрет для refresh token |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | GenAPI key (OpenAI-compatible) |
| `GIGACHAT_CREDENTIALS` | GigaChat auth credentials (Sber) |
| `GIGACHAT_MODEL` | Модель GigaChat (default: `GigaChat`) |
| `GIGACHAT_SCOPE` | Scope API GigaChat |
| `GIGACHAT_INSECURE` | `true` для отключения TLS verify (dev only) |

### `client/.env.local`

| Переменная | Описание | Пример |
|-----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | Base URL REST API | `http://localhost:4000/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:4000` |

---

## Скрипты

### Frontend

```bash
npm run dev           # next dev
npm run build         # next build
npm run start         # next start
npm run lint          # ESLint проверка
npm run lint:fix      # ESLint автофикс
npm run type-check    # tsc --noEmit
npm run format        # Prettier — форматирование
npm run format:check  # Prettier — проверка (CI)
```

### Backend

```bash
npm run dev           # node --watch (hot reload)
npm run start         # node (prod)
npm run start:prod    # NODE_ENV=production node
npm run db:create     # Создать БД
npm run db:migrate    # Накатить миграции
npm run db:seed       # Загрузить тестовые данные
npm run db:unseed     # Откатить seeds
npm run db:reset      # Полный сброс: drop → create → migrate → seed
```

---

## Структура БД

```
User ────────── Profile (1:1)
  │
  ├── Cloth[] ──────────────── LookCloth ──── Look
  │                                │            │
  │                            MessageCloth     └── metadata: { occasion, item_roles, why }
  │
  ├── Look[]
  ├── Event[]
  └── Chat[] ──── ChatMessage[] ──── MessageCloth[]
```

---

## Детали реализации

- `reactStrictMode: false` — двойной вызов эффектов в dev отключён намеренно (WebSocket + Three.js)
- `refreshTokensThunk` вызывается в `Header` при каждом монтировании — сессия восстанавливается автоматически по refresh-cookie
- LookGenerate: `persist = false` в режиме превью-чата — образ не сохраняется в БД, но и не кэшируется
- RAG-индекс прогревается при старте сервера (best-effort, не блокирует запуск)
- Сервер автоматически находит свободный порт, если `BASE_PORT` занят (до 10 попыток)
- GigaChat: для dev-окружений `NODE_TLS_REJECT_UNAUTHORIZED=0` устанавливается автоматически

---

## Кодстайл

- **Prettier** — форматирование по сохранению (VSCode)
- **ESLint** — удаляет неиспользуемые импорты, сортирует группы импортов
- **TypeScript** — `strict: true`, без implicit any
- Порядок импортов: `side-effects → react/next → external → @/* aliases → relative`

## ✦ Демо

🔗 [ai-wardrobe.ru](https://ai-wardrobe.ru)
