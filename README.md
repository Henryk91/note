# 📝 Note: Modern Productivity Hub

A high-performance, full-stack personal organization and productivity application built with **React**, **Node.js**, and **MongoDB**. This project combines structured note-taking with cognitive tools like Pomodoro, Memento, and offline synchronization.

---

## ✨ Key Features

- 📑 **Advanced Note Management**: Nested note structures with deep linking and search capabilities
- 🔄 **Offline-First Synchronization**: Robust offline support using IndexedDB (Dexie) with background sync queue
- 🌓 **Dynamic Theming**: Multiple premium themes (Ocean, Dark, Night, Green, Red)
- ⏱️ **Cognitive Tools**: Built-in Pomodoro timer and Stoic Memento practices
- 🔐 **Hardened Security**:
  - JWT-based authentication with refresh token rotation
  - Multi-layer request sanitization (HPP, XSS, MongoSanitize)
  - Rate limiting and secure cookie handling
  - Helmet security headers with CSP

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **State Management**: Redux Toolkit
- **Routing**: React Router v5
- **Icons**: FontAwesome 5
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **Styling**: Vanilla CSS with dynamic theming

### Backend

- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with express-jwt
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, HPP, express-mongo-sanitize, xss
- **Logging**: Pino with pino-pretty
- **Email**: NodeMailer
- **Testing**: Mocha, Chai, Supertest, mongodb-memory-server

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x
- **npm**: v10.x
- **MongoDB**: Local instance or MongoDB Atlas URI

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

   Create a `.env` file in the **project root** with the following:

   ```env
   # Required
   NODE_ENV=development
   PORT=8080
   JWT_SECRET=your_jwt_secret_min_10_chars
   REFRESH_SECRET=your_refresh_secret_min_10_chars
   MONGODB_URI=mongodb://localhost:27017/note

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

   # Optional - Email
   SMTP_USER_NAME=
   SMTP_EMAIL_PASSWORD=

   # Optional - Logging
   SITE_LOG_SKIP_REFERRER=localhost,127.0.0.1
   SITE_LOG_SKIP_IPS=127.0.0.1
   ```

### Running the Application

#### Development Mode

Runs frontend dev server (port 3000) and backend server (port 8080) concurrently:

```bash
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8080/api  
Health Check: http://localhost:8080/health

#### Production Mode

Build and serve optimized production bundle:

```bash
npm run build
npm start
```

Serves on http://localhost:8080 (configurable via `PORT` env var)

#### Docker Deployment

```bash
docker-compose up
```

---

## 🧪 Testing & Quality

### Backend Integration Tests

Run against in-memory MongoDB:

```bash
npm run test
```

### Frontend Snapshot Tests

```bash
npm run test:frontend
```

### Linting

```bash
npm run lint           # Check all
npm run lint:backend   # Backend only
npm run lint:frontend  # Frontend only
npm run lint:fix       # Auto-fix issues
```

---

## 📂 Project Structure

```
note/
├── backend/
│   ├── src/
│   │   ├── server/
│   │   │   ├── controllers/      # Request handlers
│   │   │   ├── middleware/       # Auth, validation, error handling
│   │   │   ├── models/           # Mongoose schemas
│   │   │   ├── repositories/     # Data access layer
│   │   │   ├── routes/           # API route definitions
│   │   │   ├── services/         # Business logic
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   ├── utils/            # Helpers and utilities
│   │   │   ├── config.ts         # Environment configuration
│   │   │   ├── index.ts          # Express app entry point
│   │   │   └── jwt-setup.ts      # JWT middleware configuration
│   │   └── types/                # Shared type definitions
│   ├── package.json
│   └── tsconfig.json             # Outputs to ../build/server
│
├── frontend/
│   ├── src/
│   │   ├── Components/           # React components
│   │   │   ├── Home/
│   │   │   ├── Login/
│   │   │   ├── Memento/
│   │   │   ├── NewNote/
│   │   │   ├── NoteDetail/
│   │   │   ├── NoteDetailPage/
│   │   │   ├── Pomodoro/
│   │   │   └── SearchBar/
│   │   ├── Helpers/              # Utilities and API requests
│   │   ├── hooks/                # Custom React hooks
│   │   ├── offlineQueue/         # Offline sync logic
│   │   ├── store/                # Redux store and slices
│   │   └── App.tsx               # Root component
│   ├── public/                   # Static assets
│   ├── package.json
│   └── vite.config.ts            # Outputs to ../build/client
│
├── __tests__/
│   ├── integration/              # Backend API tests
│   │   ├── auth.test.ts
│   │   ├── notes.test.ts
│   │   ├── translation.test.ts
│   │   └── setup.ts
│   └── *.snapshot.js             # Frontend component snapshots
│
├── build/                        # Production build output
│   ├── client/                   # Vite frontend bundle
│   └── server/                   # Compiled TypeScript backend
│
├── .env                          # Environment variables (gitignored)
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Multi-stage production build
├── package.json                  # Root workspace scripts
└── README.md
```

---

## 🔌 API Routes

- **Authentication**: `/api/auth/*` - Login, logout, token refresh
- **Notes**: `/api/notes/*` - CRUD operations for notes
- **Translations**: `/api/translations/*` - Translation practice management
- **Dashboard**: `/api/dashboard/*` - User analytics and stats
- **Email**: `/api/email/*` - Email notifications
- **Health**: `/health` - Server health check

---

## 🛡️ Security Features

- **Helmet**: Comprehensive security headers including CSP
- **CORS**: Configurable origin whitelist with subdomain support
- **Rate Limiting**: 300 requests per 15 minutes per IP
- **Input Sanitization**: XSS protection and MongoDB injection prevention
- **HPP**: HTTP Parameter Pollution protection
- **JWT**: Secure token-based authentication with rotation
- **Cookie Security**: HttpOnly, Secure, SameSite cookies in production

---

## 🐳 Docker Support

The project includes a multi-stage Dockerfile optimized for production:

- **Builder stage**: Installs dev dependencies and builds both frontend and backend
- **Runner stage**: Minimal production image with only runtime dependencies
- **Output**: Serves from `/app/build` with Node.js 20 Alpine

---

## 👤 Author

**Henry Koekemoer**

- GitHub: [@Henryk91](https://github.com/Henryk91)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
