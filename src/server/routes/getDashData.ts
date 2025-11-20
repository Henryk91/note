/* eslint-disable func-names */
const Handler = require('../controllers/handlers.js');
const fetch = require("node-fetch");

module.exports = function (app) {
  app.get('/api/dash-data/weather', (req, res) => {
    const Api_Key = process.env.Api_Key;
  var coordinates = req.query.coordinates;
  fetch(
    `https://api.darksky.net/forecast/${Api_Key}/${coordinates}?units=auto&exclude=alerts`
  )
    .then((fetchRes) => fetchRes.json())
    .then(function (json) {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(json));
    })
    .catch(function (error) {
      res.send(JSON.stringify(error));
    });
  });

  app.get('/api/dash-data/countries', (req, res) => {
    fetch('https://disease.sh/v3/covid-19/countries')
      .then((fRes) => fRes.json())
      .then((data) => {
        console.log('Countries req.');
        res.json(data);
      })
  });
  app.get('/api/dash-data/historical', (req, res) => {
    fetch('https://disease.sh/v3/covid-19/historical/all?lastdays=80')
      .then((fRes) => fRes.json())
      .then((data) => {
        console.log('Countries req.');
        res.json(data);
      })
  });
  app.get('/api/dash-data/map-data', (req, res) => {
    fetch('https://thevirustracker.com/timeline/map-data.json')
      .then((fRes) => fRes.json())
      .then((data) => {
        console.log('The Virus tracker');
        res.json(data);
      })
  });
  
};
