# WardrobeAI

A minimalist full-stack web application for managing and sharing wardrobe-related content. Features JWT-based authentication with silent token refresh, post feed with full CRUD, and profile management.

---

## Stack

### Frontend (`/client`)

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16 — App Router                                 |
| UI         | React 19, functional components                         |
| Language   | TypeScript 5 (`strict: true`, alias `@/*` → `src/*`)   |
| State      | Redux Toolkit 2 + react-redux 9                         |
| HTTP       | Axios with request / response interceptors              |
| Forms      | react-hook-form 7 + Zod 4 + @hookform/resolvers         |
| Styling    | CSS Modules + global design tokens in `globals.css`     |
| Linting    | ESLint 9 (flat config) + Prettier 3                     |

### Backend (`/server`)

> In progress.

---

## Features

- **Auth** — sign up, sign in, sign out via HTTP-only cookies + in-memory access token
- **Silent refresh** — response interceptor retries the original request after a 403 with a fresh token
- **Posts** — create, read, update, delete; edit and delete restricted to post owner
- **Profile** — view account info, delete account with modal confirmation
- **Toast notifications** — global `showToast` utility, `aria-live` accessible, auto-dismiss
- **Modal** — portal-based, scroll-lock, Escape / overlay-click to close, `default` / `danger` variants

---

## Project Structure

```
FinalProject/
├── client/                   # Next.js frontend
│   └── src/
│       ├── app/              # Routes, global styles, layout, Redux store, providers
│       ├── entities/         # Domain: user & post — types, slices, thunks
│       ├── features/         # Use-cases: auth forms (sign-in / sign-up)
│       ├── widgets/          # Composite UI: Header, Footer, PostForm, PostList
│       └── shared/           # Reusable: axiosInstance, hooks, constants, Modal, Toast
└── server/                   # Backend (coming soon)
```

### Architecture

The client follows **Feature-Sliced Design** (FSD). Layers from most to least stable:

```
shared → entities → features → widgets → app
```

Each layer may only import from layers below it.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Client

```bash
cd client
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### `client/.env.local`

| Variable                | Description                                      | Example                      |
| ----------------------- | ------------------------------------------------ | ---------------------------- |
| `NEXT_PUBLIC_API_URL`   | Base URL of the REST API (no trailing slash)     | `http://localhost:5000/api`  |

See `client/.env.example` for the full template.

---

## Scripts

```bash
# Development
npm run dev           # next dev

# Production
npm run build         # next build
npm run start         # next start

# Code quality
npm run lint          # eslint — check
npm run lint:fix      # eslint --fix — auto-fix imports & rules
npm run type-check    # tsc --noEmit — full TypeScript check
npm run format        # prettier --write — format all files
npm run format:check  # prettier --check — verify formatting (CI)
```

---

## Auth Flow

```
sign-in / sign-up
      │
      ▼
  accessToken stored in closure (memory only)
  refreshToken stored in HTTP-only cookie
      │
      ▼
  Every request → Authorization: Bearer <accessToken>
      │
  403 response?
      │
      ▼
  GET /tokens/refresh → new accessToken → retry original request
```

---

## API Contract

All responses follow `ServerResponseType<T>`:

```typescript
{
  statusCode: number;
  message:    string;
  data:       T | null;
  error:      string | null;
}
```

### Endpoints

| Resource | Method | Path                  |
| -------- | ------ | --------------------- |
| Auth     | POST   | `/auth/signUp`        |
| Auth     | POST   | `/auth/signIn`        |
| Auth     | POST   | `/auth/signOut`       |
| Tokens   | GET    | `/tokens/refresh`     |
| Users    | GET    | `/users`              |
| Users    | DELETE | `/users/:id`          |
| Posts    | GET    | `/posts`              |
| Posts    | POST   | `/posts`              |
| Posts    | GET    | `/posts/:id`          |
| Posts    | PUT    | `/posts/:id`          |
| Posts    | DELETE | `/posts/:id`          |

---

## Code Style

Formatting and linting are enforced automatically:

- **Prettier** — formats on save (VSCode), config in `client/.prettierrc`
- **ESLint** — removes unused imports, sorts import groups on save
- **TypeScript** — `strict: true`, no implicit any

Import order enforced by `eslint-plugin-simple-import-sort`:

```
side-effects → react/next → external packages → @/ aliases → relative
```

---

## Notes for Developers

- `reactStrictMode: false` in `next.config.ts` — double-invocation of effects in dev is disabled. Keep this in mind when debugging side effects.
- `refreshTokensThunk` is called in `Header` on every mount — session is restored silently on page load via refresh cookie.
- Post edit/delete buttons are shown only when `post.user_id === user.id`.
- `getPostByIdThunk` is intentionally **not** connected to `postSlice` — single post data lives only in the page component's local state.
