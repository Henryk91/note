# 📝 Note: Modern Productivity Hub

A full-stack personal notes and productivity app built with **React**, **Node.js** and **MongoDB**. It combines nested notebooks, Markdown notes and time-tracking logs with Pomodoro, Memento and offline support, on phone and desktop.

---

## ✨ Key Features

- 📑 **Notebooks and nested folders**: any depth, with a phone page stack (swipe back) and a three-pane desktop layout (sidebar tree, note list, editor) that collapses to two panes on medium screens
- ✍️ **Markdown notes that save as you type**: notes are always editable and autosave shortly after you stop typing (and on leaving the note); the stored Markdown is kept byte-for-byte for anything you didn't change
- ⏱️ **Logs**: a folder named `Log` gets its own screen with a quick entry box, previous/next day, editable entry times and three modes (time tracker with day summaries, tally counter, journal). Continue buttons, break words, pinned logs and a quick-log sheet (`Ctrl/Cmd+L`)
- 🔎 **Search** scoped to the open notebook (`Ctrl/Cmd+F`), with hits that open the note, folder or log day
- 🗑️ **Recently Deleted**: deletes are soft, with Undo and restore
- 🔄 **Offline-first**: writes are queued in IndexedDB (Dexie) and sent when back online; reads come from a cache saved in the browser
- 🌓 **Six themes**: Dark, Ocean, Green, Night, Red and Monokai, applied before the app loads (also in the installed app)
- 🧠 **Cognitive tools**: Pomodoro timer and Memento (weeks of life)
- 🔐 **Security**:
  - JWT access and refresh tokens in httpOnly cookies, with refresh token rotation
  - Request sanitising (HPP, XSS, MongoSanitize); rendered Markdown is sanitised with DOMPurify
  - Rate limiting and Helmet security headers with CSP

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Server State**: TanStack Query, saved to the browser for offline use
- **Client State**: Redux Toolkit (theme and navigation)
- **Routing**: React Router v5
- **Editor**: TipTap (Markdown-backed), `marked` for rendering, DOMPurify for sanitising
- **Icons**: Tabler Icons (FontAwesome on a few older screens)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Styling**: plain CSS with theme variables
- **Testing**: Jest + Testing Library, Storybook

### Backend

- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with express-jwt
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, HPP, express-mongo-sanitize, xss, express-rate-limit
- **Logging**: Pino with pino-pretty
- **Email**: NodeMailer
- **Testing**: Mocha, Chai, Supertest, mongodb-memory-server

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x
- **npm**: v10.x
- **MongoDB**: a local instance (for example `docker run -d --name notes-mongo -p 27017:27017 mongo:7`) or a MongoDB Atlas URI

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Henryk91/note.git
   cd note
   ```

2. **Install dependencies:**

   ```bash
   npm install --prefix frontend
   npm install --prefix backend
   npm install
   ```

3. **Configure environment variables:**

   Create `backend/.env` (the backend loads it with dotenv; values set on the command line take precedence). Settings are validated on start-up and the server won't start without the two secrets.

   ```env
   # Required
   JWT_SECRET=your_jwt_secret_min_10_chars
   REFRESH_SECRET=your_refresh_secret_min_10_chars
   MONGODB_URI=mongodb://localhost:27017/note

   # Optional - Server
   NODE_ENV=development
   PORT=8080
   RATE_LIMIT_MAX=1000           # requests per 15 minutes per IP

   # Optional - Authentication
   ACCESS_EXPIRES=15m
   REFRESH_EXPIRES=30d
   MAX_SESSIONS=3
   COOKIE_SECURE=false

   # Optional - CORS (comma-separated)
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

   # Optional - Features
   ADMIN_USER_ID=
   GOOGLE_TRANSLATE_TOKEN=
   LOG_SITES_NOTE_ID=
   TRANSLATION_PRACTICE_FOLDER_ID=TranslationPractice
   WEATHER_DATA_API_KEY=
   OPENAI_API_KEY=
   OPENAI_MODEL=gpt-4o
   OPENAI_MAX_TOKENS=5
   OPENAI_TEMPERATURE=0

   # Optional - Email
   SMTP_USER_NAME=
   SMTP_EMAIL_PASSWORD=

   # Optional - Site Track logging
   SITE_LOG_SKIP_REFERRER=localhost,127.0.0.1
   SITE_LOG_SKIP_IPS=127.0.0.1
   ```

### Running the Application

#### Development Mode

Runs the frontend dev server (port 3000, proxies `/api` to the backend) and the backend (port 8080) together:

```bash
npm run dev
```

To point a run at a different database without editing `.env`, set it on the command line:

```bash
MONGODB_URI=mongodb://localhost:27017/notes-dev npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8080/api  
Health Check: http://localhost:8080/health

#### Sample data

`backend/scripts/seed-dev.ts` fills a **local** database with notebooks, nested folders, notes and logs shaped like real use (it refuses to run against anything but `localhost` / `127.0.0.1`). With the backend running on the local database:

```bash
cd backend
MONGODB_URI=mongodb://localhost:27017/notes-dev npx ts-node scripts/seed-dev.ts
```

`SEED_RESET=1` removes the seed user's earlier data first.

#### Production Mode

Build and serve the production bundle:

```bash
npm run build
npm start
```

Serves the app and the API on http://localhost:8080 (configurable with `PORT`).

#### Docker

`docker-compose.yml` runs the app with a MongoDB container. It reads a `.env` file in the **project root** (not `backend/.env`); in it, point the app at the container:

```env
MONGODB_URI=mongodb://mongo:27017/note
JWT_SECRET=...
REFRESH_SECRET=...
```

```bash
docker-compose up
```

---

## 🧪 Testing & Quality

### Backend Integration Tests

Run against an in-memory MongoDB (`__tests__/integration/`):

```bash
npm test
```

### Frontend Tests

Unit, component and snapshot tests with Jest and Testing Library (`frontend/tests/`):

```bash
npm run test:frontend
npm --prefix frontend test -- tests/LogRow.test.tsx   # one file
npm --prefix frontend test -- -u                      # update snapshots
```

Storybook: `npm --prefix frontend run storybook` (port 6006).

### Linting

```bash
npm run lint:backend   # Backend (airbnb + prettier)
npm run lint:frontend  # Frontend
npm run lint           # Backend, then frontend
npm run lint:fix       # Auto-fix issues
```

Known issues: the backend has 11 existing lint problems, so `npm run lint` stops there; the frontend ESLint config is not TypeScript-aware yet and reports many false errors.

---

## 📂 Project Structure

```
note/
├── backend/
│   ├── src/server/
│   │   ├── routes/           # API routes, all mounted under /api
│   │   ├── middleware/       # Auth, Zod validation, error handling
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access
│   │   ├── models/           # Mongoose schemas (notes v1, notes-v2, users, translations)
│   │   ├── validation/       # Zod schemas
│   │   ├── clients/          # Google Translate, OpenAI
│   │   ├── config.ts         # Environment configuration (Zod)
│   │   ├── index.ts          # Express app
│   │   └── jwt-setup.ts      # JWT middleware
│   ├── scripts/              # seed-dev.ts (local sample data)
│   └── tsconfig.json         # Outputs to ../build/server
│
├── frontend/
│   ├── src/
│   │   ├── core/             # Providers, routes, Redux store
│   │   ├── features/
│   │   │   ├── auth/         # Login, sign-up, person store
│   │   │   ├── notes/        # Notebooks, folders, notes, logs, search
│   │   │   │   ├── api/      # Notes API calls
│   │   │   │   ├── editor/   # TipTap note editor (Markdown round trip)
│   │   │   │   ├── log/      # Log screen, summaries, quick log
│   │   │   │   ├── layout/   # Phone toolbar, desktop panes
│   │   │   │   └── ...
│   │   │   ├── memento/
│   │   │   └── pomodoro/
│   │   ├── shared/           # Components, header, hooks, styles (themes), utils
│   │   ├── layouts/          # App header and main layout
│   │   ├── offlineQueue/     # Dexie write queue and sync
│   │   └── App.tsx
│   ├── tests/                # Jest tests and snapshots
│   ├── public/
│   └── vite.config.ts        # Outputs to ../build/client
│
├── __tests__/integration/    # Backend API tests
├── build/                    # Production build (client + server)
├── docker-compose.yml
├── Dockerfile                # Multi-stage production build
└── package.json              # Root scripts for both projects
```

---

## 🔌 API Routes

All routes are under `/api`.

- **Auth**: `POST /register`, `/login`, `/logout`, `/logout-all`, `/refresh`; `GET /me`
- **Notes (v2, used by the app)**: `GET|POST|PUT|DELETE /note-v2`, `GET /note-v2/with-children`, `/note-v2/path`, `/note-v2/deleted` (Recently Deleted), `/note-v2/pinned-logs`
- **Search**: `GET /search?q=&notebook=`
- **Notes (v1, legacy)**: `GET /note`, `/note-names`; `POST /save`, `/update`, `/update-one`
- **Site Track**: `GET /log*`
- **Translations**: `/translate-practice`, `/full-translate-practice`, `/translate-levels`, `/saved-translation`, `POST /translate`, `/confirm-translation`, `/translation-scores`
- **Dashboard**: `GET /dash-data/countries`, `/historical`, `/map-data`, `/weather`
- **Email**: `POST /email`, `/emails`
- **Health**: `GET /health` (outside `/api`)

---

## 🛡️ Security Features

- **Helmet**: security headers including CSP
- **CORS**: configurable origin allowlist with subdomain support
- **Rate Limiting**: 1000 requests per 15 minutes per IP by default (`RATE_LIMIT_MAX`)
- **Input Sanitising**: XSS escaping of body, query and params, and MongoDB injection prevention
- **Output Sanitising**: rendered Markdown goes through DOMPurify
- **HPP**: HTTP parameter pollution protection
- **JWT**: token-based authentication with refresh token rotation
- **Cookies**: httpOnly, Secure and SameSite in production

---

## 🐳 Docker Support

The multi-stage Dockerfile:

- **Builder stage**: installs dev dependencies and builds the frontend and backend
- **Runner stage**: minimal production image with only runtime dependencies
- **Output**: serves from `/app/build` with Node.js 20 Alpine

---

## 👤 Author

**Henry Koekemoer**

- GitHub: [@Henryk91](https://github.com/Henryk91)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
