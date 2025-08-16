/* eslint-disable func-names */
const nodemailer = require('nodemailer');

const name =  process.env.EMAIL_ADDRESS;
const pass = process.env.EMAIL_PASS;

module.exports = function (app) {

  app.post('/api/email', (req, res) => {
    
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

  app.post('/api/emails', (req, res) => {
    
    console.log('Email send Request',);
    let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: name,
            pass: pass
        }
    });

    let body = JSON.parse(JSON.stringify(req.body));
    let keys = Object.keys(body)
    body = JSON.parse(keys[0]);
    console.log('Body',body);

    const info = body && body.text ? body.text : 'Message missing.'
    const msgFrom = body && body.from ? body.from : 'mail@henryk.co.za'
    const msgTo = body && body.to ? body.to : 'heinrichk91@gmail.com'
    const subject = body && body.subject ? body.subject : 'From Website'
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
