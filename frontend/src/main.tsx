import React from 'react';
import ReactDOM from 'react-dom';
import App from './client/App';
import './client/app.css';
import './serviceWorker';

const root = document.getElementById('root');

if (root) {
  ReactDOM.render(<App />, root);
}
