import { MailMessage, MailProvider } from '../../application/ports/mail-provider'

/**
 * Sends transactional e-mail through the Brevo (ex-Sendinblue) HTTP API.
 * Requires BREVO_API_KEY, MAIL_FROM_EMAIL and MAIL_FROM_NAME to be set —
 * MAIL_FROM_EMAIL must be a sender verified in the Brevo dashboard.
 */
export class BrevoMailProvider implements MailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html ?? `<pre style="font-family:inherit">${message.text}</pre>`,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`[brevo] falha ao enviar e-mail (status ${res.status}): ${body}`)
    }
  }
}
