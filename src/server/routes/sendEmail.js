/* eslint-disable func-names */
var cors = require('cors');
const nodemailer = require('nodemailer');

const name =  process.env.EMAIL_ADDRESS;
const pass = process.env.EMAIL_PASS;

module.exports = function (app) {

  app.post('/api/email',cors(), (req, res) => {
    
    console.log('Email send Request',);
    let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: name,
            pass: pass
        }
    });

    const info = req.body && req.body.text ? req.body.text : 'Message missing.'
    const msgFrom = req.body && req.body.email ? req.body.email : 'mail@henryk.co.za'

    const message = {
        from: msgFrom, // Sender address
        to: 'heinrichk91@gmail.com',         // List of recipients
        subject: 'From Website', // Subject line
        text: info // Plain text body
    };

    transport.sendMail(message, function(err, info) {

        if (err) {
          console.log('Email sending error:',err)
          res.json({ Ok: '50' });
        } else {
            res.json({ Ok: '100' });
          console.log('Success sending email!',info);
        }
    });
  });

  app.post('/api/emails',cors(), (req, res) => {
    
    console.log('Email send Request',);
    let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: name,
            pass: pass
        }
    });
    console.log('req.body',req.body);
    const info = req.body && req.body.text ? req.body.text : 'Message missing.'
    const msgFrom = req.body && req.body.from ? req.body.from : 'mail@henryk.co.za'
    const msgTo = req.body && req.body.to ? req.body.to : 'heinrichk91@gmail.com'
    const subject = req.body && req.body.subject ? req.body.subject : 'From Website'
    const message = {
        from: msgFrom, // Sender address
        to: msgTo,         // List of recipients
        subject: subject, // Subject line
        text: info // Plain text body
    };

    transport.sendMail(message, function(err, info) {

        if (err) {
          console.log('Email sending error:',err)
          res.json({ Ok: '50' });
        } else {
            res.json({ Ok: '100' });
          console.log('Success sending email!',info);
        }
    });
  });
};
