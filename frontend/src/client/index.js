import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './app.css';
// import runtime from 'serviceworker-webpack-plugin/lib/runtime';
// import registerEvents from 'serviceworker-webpack-plugin/lib/browser/registerEvents'
// import applyUpdate from 'serviceworker-webpack-plugin/lib/browser/applyUpdate'
import '../serviceWorker';
// if (
//     'serviceWorker' in navigator &&
//     (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
//   ) {
//     const registration = runtime.register()

//     registerEvents(registration, {
//       onInstalled: () => {
//         console.log('onInstalled')
//       },
//       onUpdateReady: () => {
//         console.log('onUpdateReady')
//       },

//       onUpdating: () => {
//         console.log('onUpdating')
//       },
//       onUpdateFailed: () => {
//         console.log('onUpdateFailed')
//       },
//       onUpdated: () => {
//         console.log('onUpdated')
//       },
//     })
//   } else {
//     console.log('serviceWorker not available')
//   }

ReactDOM.render(<App />, document.getElementById('root'));
