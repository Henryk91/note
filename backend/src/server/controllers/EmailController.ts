import { Request, Response } from 'express';
import { emailService } from '../services/EmailService';

export class EmailController {
  async sendEmail(req: Request, res: Response) {
    try {
      const { text, email } = req.body || {};
      await emailService.sendEmail({
        text: text || 'Message missing.',
        from: email,
      });
      res.json({ Ok: '100' });
    } catch (err) {
      console.error('Email sending error:', err);
      res.json({ Ok: '50' });
    }
  }

  async sendEmails(req: Request, res: Response) {
    try {
      let parsedBody = req.body;

      // Handle legacy weirdness where body might be double-stringified or a single key
      if (typeof req.body === 'object' && !req.body.text && !req.body.to) {
        const keys = Object.keys(req.body);
        if (keys.length > 0) {
          try {
            parsedBody = JSON.parse(keys[0]);
          } catch (e) {
            // Not JSON, just use as is
          }
        }
      }

      const { text, from, to, subject } = parsedBody || {};

      await emailService.sendEmail({
        text: text || 'Message missing.',
        from,
        to,
        subject,
      });
      res.json({ Ok: '100' });
    } catch (err) {
      console.error('Emails sending error:', err);
      res.json({ Ok: '50' });
    }
  }
}

export const emailController = new EmailController();
