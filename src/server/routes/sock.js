/* eslint-disable func-names */
const Handler = require('../controllers/handlers.js');
const cors = require('cors');
const dbHandler = new Handler();
const express = require('express');
const fetch = require('node-fetch');

module.exports = function (app) {
  let isRunning = false;
  const documents = {};
  const userId = {};

  function getDocs(userId) {
    // Get List Of Contacts
    var keys = Object.keys(documents);
    var i;
    var found = [];
    for (i = 0; i < keys.length; i++) {
      if (documents[keys[i]].users[0].indexOf(userId) > -1) {
        var a = [keys[i], documents[keys[i]].users[1]];
        found.push(a);
      } else if (documents[keys[i]].users[1].indexOf(userId) > -1) {
        var a = [keys[i], documents[keys[i]].users[0]];
        found.push(a);
      }
    }
    found.sort(function (a, b) {
      return a[1] > b[1] ? 1 : -1;
    });
    return found;
  }

  function loginRequest(user, next) {
    console.log('Trying to log in');
    
    let docId = '';
    dbHandler.userLogin(user, (dbResp) => {
      docId = dbResp;
      console.log('Db Trying to log in res',dbResp);
      if (docId.indexOf('Login') < 0) {
        next({ id: docId })
      } else {
        next({ status: dbResp })
      }
    });
  }

  function createAccount(user, next) {
    fetch(`/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    })
      .then((res) => res.json())
      .then((data) => {
        next(data);
      })
      .catch((error) => {
        next(error);
      });
  }

  const INDEX = '/index.html';
  // const PORT = process.env.PORT || 8090;
  const PORT = 8090;
  const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

  const socketIO = require('socket.io');
  const io = socketIO(server);

  io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));

    let previousId;
    const safeJoin = (currentId) => {
      socket.leave(previousId);
      socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
      previousId = currentId;
    };

    socket.on('getDocArr', (docId) => {
      safeJoin(docId);
      socket.emit('doc-Arr', documents[docId]);
    });

    socket.on('userReg', (user) => {
      if (user[0]) {
        console.log(user);
        createAccount(user[0], (res) => {
          if (res.id) {
            console.log(res);
            io.emit('userAuth' + user[1], ['User Added. You Can now log in.']);
          } else {
            console.log(res);
            io.emit('userAuth' + user[1], [res]);
          }
        });
      }
    });

    socket.on('userAuth', (clientId) => {
      if (clientId[0].length > 0 && clientId[1].length > 0) {
        let user = {
          email: clientId[0],
          password: clientId[1],
        };
        console.log('Checking User:', user);
        loginRequest(user, (res) => {
            console.log('res',res);
          if (res.id) {
            console.log('user: ' + clientId[0] + ' confirmed');
            userId[clientId[0]] = clientId[1];
            io.emit('userAuth' + clientId[2], ['confirm']);
          } else {
            console.log('user: ' + clientId[0] + ' denied');
            io.emit('userAuth' + clientId[2], ['Password Error. Or Username Already in use.']);
          }
        });
      } else {
        io.emit('userAuth' + clientId[2], ['Username or Password Missing']);
      }
    });

    socket.on('addDoc', (doc) => {
      documents[doc.id] = doc;
      safeJoin(doc.id);
      var user1 = doc.users[0];
      var user2 = doc.users[1];
      io.emit('documents' + user1, getDocs(user1));
      io.emit('documents' + user2, getDocs(user2));
    });

    socket.on('editArr', (doc) => {
      documents[doc.id] = doc;
      socket.to(doc.id).emit('doc-Arr', doc);
    });

    socket.on('sendMsg', (doc) => {
      documents[doc.id].doc.push(doc.doc[0]);
      socket.to(doc.id).emit('doc-Msg', doc);
      console.log('AAAAAAAAAAAAAAAAAAA', doc.id, doc);
      io.emit('newMsg' + doc.doc[0].receiver, doc.doc[0].sender);
    });

    socket.on('arrDocuments', (user) => {
      io.emit('documents' + user + 'END', getDocs(user));
    });

    console.log(`Socket ${socket.id} has connected`);
  });

  setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
};
