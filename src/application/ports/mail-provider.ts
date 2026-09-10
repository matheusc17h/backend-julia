export interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

/** Sends transactional e-mail (password recovery code, etc.). */
export interface MailProvider {
  send(message: MailMessage): Promise<void>
}
