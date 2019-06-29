
# React Note List

## Introduction

This is React note list app that gets data via a Node back-end server from a Mongo Database.

Once loaded add a username at the top and click on either my notes or all notes

- My Notes will only show notes created by you.
- All Notes will show all notes in the list.

A live demo version can be found [here](https://henryk91-note.glitch.me) 

### Development mode

In dev mode, 2 servers are running. The front end code will be served by a webpack dev server for hot and live reloading. The Express code will be served by a node server using nodemon to automatically restart the server whenever server side code changes.

### Production mode

In the production mode, only 1 server is running. Client side code will be bundled into static files using webpack and served by the Node.js/Express server.

### Testing

Testing is done with a Jest/Enzyme combination. The folder also contains a snapshot folder for all components as well as a file with test data.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Henryk91/note-list.git

# Go inside the directory
cd note-list

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Tests
npm run test

# Run Test and keep waching
npm run test:watch

# Run Test and print out a detailed chart 
npm run test:coverage

```

## Documentation

### Folder Structure

All the source code is inside src directory. Inside src there are client and server directories. All the front-end code (react, css, js) are in the client directory. Backend Node.js/Express is are in the server directory.

All components are in their own folder (src/client/view/component) with the css file. For ease of testing all component css is linked into the main app.css file that is linked into the index.

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
