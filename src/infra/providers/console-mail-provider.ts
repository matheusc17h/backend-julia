import { MailMessage, MailProvider } from '../../application/ports/mail-provider'

/**
 * Development mail provider: prints the message to stdout instead of sending it.
 * Replace with a real SMTP/nodemailer/SES adapter in production — the rest of the
 * app only depends on the `MailProvider` port.
 */
export class ConsoleMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    console.log('\n----- E-MAIL (dev) -----')
    console.log(`Para:     ${message.to}`)
    console.log(`Assunto:  ${message.subject}`)
    console.log(message.text)
    console.log('------------------------\n')
  }
}
