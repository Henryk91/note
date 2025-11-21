# React Note List

## Introduction

This is React note list app that gets data via a Node back-end server from a Mongo Database.

Once loaded add a username at the top and click on either my notes or all notes

- My Notes will only show notes created by you.

A live demo version can be found [here](https://henryk91-note.glitch.me) 

### Development mode

In dev mode, 2 servers are running. The front end code is served by a webpack dev server for hot and live reloading (now in `frontend/`). The Express code is served by a node server using ts-node-dev (now in `backend/`) to automatically restart whenever server side code changes.

### Production mode

In production, only the backend server runs. Client side code is bundled into static files using webpack and served by the Node.js/Express server from `/dist`.

### Testing

Frontend snapshots run with Jest/Enzyme. Backend integration tests run with Mocha/Chai/Supertest against an in-memory MongoDB.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Henryk91/note.git

# Go inside the directory
cd note

# Install dependencies per package
npm install --prefix frontend
npm install --prefix backend

# Start dev servers (frontend + backend together)
npm run dev

# Build for production (frontend first, then backend)
npm run build

# Start production server (serves built assets from /dist)
npm start

# Run backend integration tests
npm run test

# Run frontend snapshot tests
npm run test:frontend

```

## Documentation

### Folder Structure

- `frontend/` — package.json and node_modules for the React app. Source lives in `frontend/src/client`; static assets live in `frontend/public`.
- `backend/` — package.json and node_modules for the API. Source lives in `backend/src/server` (types in `backend/src/types`).
- Configs are scoped per package: `frontend/webpack.config.js`, `frontend/.babelrc`, `frontend/.eslintrc.cjs`, `frontend/jest.config.js` (with `frontend/enzyme.config.js`); backend TypeScript + ESLint live in `backend/tsconfig*.json` and `backend/.eslintrc.cjs`.

All components are in their own folder (frontend/src/client/view/component) with the CSS file. For ease of testing all component CSS is linked into the main `app.css` file that is linked into the index.

## Specifics

### Mongo Database Key

A file with the name .env needs to be set up to store the api key in this format: DB='<url-with-username-and-password>' (no spaces as this is a shell file)

### Ports

In dev mode there will be 2 servers running, the webpack dev server for react is open on port 3000
the node server for the back end is on port 8080.

### Concurrently

[Concurrently](https://github.com/kimmobrunfeldt/concurrently) is used to serve both servers at the same time in dev mode.

### React Router

React-router-dom is used for client side routing.

### ESLint

ESLint is a linter tool that has been added to help identify and report JavaScript patterns.
