# Client — техническое описание

Фронтенд **минималистичного блога**: авторизация, лента постов, CRUD для своих постов, профиль с удалением аккаунта. Общается с бэкендом по REST через **Axios**; состояние сессии и списка постов ведётся в **Redux Toolkit**.

---

## Стек

| Слой      | Технологии                                                         |
| --------- | ------------------------------------------------------------------ |
| Фреймворк | **Next.js 16** (App Router)                                        |
| UI        | **React 19**, функциональные компоненты                            |
| Язык      | **TypeScript 5** (`strict: true`, алиас `@/*` → `src/*`)           |
| Состояние | **Redux Toolkit 2** + **react-redux 9**                            |
| HTTP      | **Axios** с перехватчиками запроса/ответа                          |
| Формы     | **react-hook-form 7** + **@hookform/resolvers** + **Zod 4**        |
| Линтинг   | **ESLint 9** + `eslint-config-next` (core-web-vitals + typescript) |

Шрифт интерфейса: **JetBrains Mono** (Google Fonts), подключён в `src/app/layout.tsx` с подмножествами `latin` и `cyrillic`, CSS-переменная `--font-mono`.

---

## Структура проекта (Feature-Sliced подход)

Код сгруппирован по слоям под `src/`:

- **`app/`** — маршруты Next.js App Router, глобальные стили, корневой layout, провайдеры, singleton Redux `store`.
- **`entities/`** — доменные сущности **user** и **post**: типы (`model/types.ts`), Redux-slice, **createAsyncThunk** для API.
- **`features/`** — сценарии; сейчас **`features/auth/ui`** — формы входа и регистрации.
- **`widgets/`** — составные блоки UI: **Nav**, **Footer**, **PostForm**, **PostList**.
- **`shared/`** — переиспользуемое: `lib/axiosInstance`, константы маршрутов API и клиента, тип `ServerResponseType`, хуки `useAppDispatch` / `useAppSelector`, UI (**Modal**, **Toast**), общие стили форм.

Публичные ассеты — в `public/`.

---

## Маршруты приложения (App Router)

| Путь                   | Назначение                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Домашняя страница (клиентский компонент с демо `useEffect` / `useLayoutEffect` и счётчиком ререндеров)               |
| `/sign-in`, `/sign-up` | Страницы с формами **SignInForm** / **SignUpForm**                                                                   |
| `/sign-out`            | При монтировании диспатчит **signOutThunk**, тост, редирект на главную                                               |
| `/profile`             | Профиль текущего пользователя; удаление аккаунта через **deleteUserThunk** и модальное подтверждение                 |
| `/posts`               | Список постов + форма создания (**PostForm** + **PostList**)                                                         |
| `/posts/[id]`          | Детальная страница поста: загрузка через **getPostByIdThunk**, локальный `useState`, без записи в Redux-slice постов |

Константы путей клиента: `src/shared/constants/clientRoutes.ts` (`CLIENT_ROUTES`).

---

## Redux: store и слайсы

Файл `src/app/store/store.ts` собирает редьюсеры:

- **`user`** — `user`, `status` (`empty` \| `pending` \| `succeeded` \| `failed`), `lastError` (`ServerResponseType | null`).
- **`post`** — `posts` (массив `IPost`), тот же паттерн `status` / `lastError`.

Асинхронная логика только через **extraReducers** на thunk’и из `entities/*/api/*Thunk.ts`. Синхронных `reducers` в слайсах нет.

**Важно:** **getPostByIdThunk** объявлен в `apiPostThunk.ts`, но **не** подключён к `postSlice`; данные одного поста живут только в состоянии страницы `posts/[id]/page.tsx`. Остальные операции с постами (список, создание, обновление, удаление) синхронизированы со store.

Типы store экспортируются как `RootState` и `AppDispatch` для типизированных хуков.

---

## Провайдеры и клиентские границы

`src/app/layout.tsx` — серверный layout: оборачивает дерево в **`ReduxProvider`** (`'use client'`), внутри которого **`<Provider store={store}>`** и **`ToastProvider`**.

Любой компонент, использующий Redux, хуки навигации Next или браузерные API, помечен **`'use client'`**. Страница `/posts` остаётся серверным модулем и рендерит клиентские виджеты как дочерние компоненты — типичный паттерн App Router.

---

## HTTP-слой и авторизация

### Экземпляр Axios

`src/shared/lib/axiosInstance.ts`:

- **`baseURL`**: `process.env.NEXT_PUBLIC_API_URL` (см. `.env.example`).
- **`withCredentials: true`** — куки (например, refresh) уходят на сервер вместе с запросами.

### Access token в памяти

Модуль хранит **`accessToken`** в замыкании; **`setAccessToken`** вызывается из thunk’ов после sign-in / sign-up / refresh. В **request interceptor** заголовок **`Authorization: Bearer <token>`** добавляется, если его ещё не задали явно.

### Повтор при 403

**Response interceptor:** при статусе **403** выполняется одна попытка **GET** `USER_API_ROUTES.REFRESH_TOKENS` (`/tokens/refresh`), обновление `accessToken`, пометка запроса флагом `sent`, повтор исходного запроса. Ошибка refresh пробрасывается дальше.

Контракт ответов API описан типом **`ServerResponseType<T>`** (`statusCode`, `message`, `data`, `error`).

### Маршруты API (относительно `baseURL`)

- Пользователь: `src/shared/constants/userApiRoutes.ts` — `/auth/signUp`, `/auth/signIn`, `/auth/signOut`, `/tokens/refresh`, `/users` (+ `/:id` для удаления).
- Посты: `src/shared/constants/postApiRoutes.ts` — `/posts`, `/posts/:id` для GET/PUT/DELETE.

При сетевых сбоях без `response` thunk’и отдают **`defaultRejectedAxiosError`** (`503`, см. `shared/constants/defaultRejectedAxiosError.ts`).

---

## Формы и валидация

Все основные формы используют **react-hook-form** с **`zodResolver`** и схемами **Zod**:

- Вход: email + password.
- Регистрация: имя, email, пароль (минимум 8 символов, буква и цифра), подтверждение пароля (`refine` на совпадение).
- Посты (создание / редактирование в модалке): title и content с лимитами длины.

Режим валидации в основном **`onTouched`**. После успешных операций — **`showToast`** и навигация через **`useRouter`** где нужно.

---

## UI: уведомления и модалки

- **Toast** (`shared/ui/Toast`): глобальный **`showToast`** через колбэк `emit`, привязанный в `ToastProvider`; портал в `document.body`, `aria-live="polite"`, автоскрытие ~4.8 с.
- **Modal** (`shared/ui/Modal`): портал, блокировка скролла `body`, Escape и клик по оверлею (настраивается), варианты `default` / `danger`, слот **`ModalActions`** для кнопок.

Используются на списке постов (удаление/редактирование), в профиле (удаление аккаунта) и после auth/post-действий.

---

## Стилизация

Преимущественно **CSS Modules** рядом с компонентами (`*.module.css`), плюс **`globals.css`** и общие **`shared/styles/form.module.css`** для полей, кнопок и ошибок. Отдельного CSS-in-JS или Tailwind в зависимостях нет.

---

## Конфигурация Next.js

`next.config.ts` задаёт только **`reactStrictMode: false`** (двойные эффекты в dev отключены — важно учитывать при отладке побочных эффектов).

---

## Скрипты npm

```bash
npm run dev    # next dev
npm run build  # next build
npm run start  # next start
npm run lint   # eslint
```

---

## Запуск и окружение

1. Установка зависимостей: `npm install`.
2. Создать `.env.local` или `.env` с **`NEXT_PUBLIC_API_URL`** — базовый URL API (без завершающего слэша, как правило).
3. Бэкенд должен отдавать ответы в формате **`ServerResponseType`**, поддерживать cookie + refresh по описанной схеме и эндпоинты из констант маршрутов.

---

## Заметки для разработки

- **Навигация:** в **`Nav`** при монтировании вызывается **`refreshTokensThunk`** — при каждом заходе на сайт делается попытка восстановить сессию по refresh-cookie.
- **Права на посты:** в **PostList** кнопки Edit/Delete показываются, если `Number(post.user_id) === Number(user.id)`.
- **Домашняя страница** содержит учебные `console.log` в эффектах — при необходимости продакшн-сборки их стоит убрать или завязать на dev-only.
