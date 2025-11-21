import { Application, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const name = process.env.EMAIL_ADDRESS;
const pass = process.env.EMAIL_PASS;

const createTransport = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: name,
      pass,
    },
  });

export default function sendEmail(app: Application) {
  app.post('/api/email', async (req: Request, res: Response) => {
    try {
      const transport = createTransport();
      const info = req.body && (req.body as any).text ? (req.body as any).text : 'Message missing.';
      const msgFrom = req.body && (req.body as any).email ? (req.body as any).email : 'mail@henryk.co.za';

      const message = {
        from: msgFrom,
        to: 'heinrichk91@gmail.com',
        subject: 'From Website',
        text: info,
      };

      await transport.sendMail(message);
      res.json({ Ok: '100' });
    } catch (err) {
      console.log('Email sending error:', err);
      res.json({ Ok: '50' });
    }
  });

  app.post('/api/emails', async (req: Request, res: Response) => {
    try {
      const transport = createTransport();
      const rawBody = JSON.parse(JSON.stringify(req.body));
      const keys = Object.keys(rawBody);
      const parsedBody = JSON.parse(keys[0]);

      const info = parsedBody?.text ?? 'Message missing.';
      const msgFrom = parsedBody?.from ?? 'mail@henryk.co.za';
      const msgTo = parsedBody?.to ?? 'heinrichk91@gmail.com';
      const subject = parsedBody?.subject ?? 'From Website';

      const message = {
        from: msgFrom,
        to: msgTo,
        subject,
        text: info,
      };

      await transport.sendMail(message);
      res.json({ Ok: '100' });
    } catch (err) {
      console.log('Email sending error:', err);
      res.json({ Ok: '50' });
    }
  });
}
