import { Injectable, Logger } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Envoi d'e-mails transactionnels.
 *
 * En développement, sans clé API, le message est simplement journalisé afin de
 * ne jamais bloquer un parcours métier. En production, Resend est utilisé via
 * son API HTTP (aucune dépendance supplémentaire).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: AppConfigService) {}

  async send(message: MailMessage): Promise<void> {
    const apiKey = this.config.mailApiKey;
    if (!apiKey) {
      this.logger.log(`[e-mail simulé] à ${message.to} — ${message.subject} — ${message.text}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.mailFrom,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `L'envoi de l'e-mail a échoué (${response.status}) : ${detail.slice(0, 200)}`,
      );
    }
  }
}
