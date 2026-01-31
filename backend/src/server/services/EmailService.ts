import nodemailer from 'nodemailer';
import config from '../config';

export interface EmailOptions {
  from?: string;
  to?: string;
  subject?: string;
  text: string;
}

export class EmailService {
  private createTransport() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: config.smtpUserName,
        pass: config.smtpEmailPassword,
      },
    });
  }

  async sendEmail(options: EmailOptions) {
    const transport = this.createTransport();
    const message = {
      from: options.from || 'mail@henryk.co.za',
      to: options.to || config.smtpUserName,
      subject: options.subject || 'From Website',
      text: options.text,
    };

    return transport.sendMail(message);
  }
}

export const emailService = new EmailService();
