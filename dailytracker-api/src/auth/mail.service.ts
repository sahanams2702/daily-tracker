import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordReset(to: string, link: string) {
    if (!this.transporter) {
      // dev fallback: no SMTP configured, print the link instead
      this.logger.warn(`SMTP not configured. Password reset link for ${to}: ${link}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM') ?? 'MarkItUp <no-reply@markitup.local>',
      to,
      subject: 'Reset your MarkItUp password',
      text: `Use this link to reset your password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: `<p>Use this link to reset your password (valid for 1 hour):</p><p><a href="${link}">Reset password</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
    });
  }
}