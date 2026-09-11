import { Either, left, right } from '../../shared/either'
import { ValidationError } from '../../shared/errors'
import { Email } from '../customer/email'

export interface NewsletterSubscriberProps {
  id: string
  email: Email
  createdAt: Date
}

/** E-mail captado pelo formulário de newsletter (rodapé), pra remarketing. */
export class NewsletterSubscriber {
  private constructor(private props: NewsletterSubscriberProps) {}

  static create(input: { id: string; email: string; now?: Date }): Either<ValidationError, NewsletterSubscriber> {
    const email = Email.create(input.email)
    if (!email.ok) return left(email.value)

    return right(
      new NewsletterSubscriber({
        id: input.id,
        email: email.value,
        createdAt: input.now ?? new Date(),
      }),
    )
  }

  static restore(props: NewsletterSubscriberProps): NewsletterSubscriber {
    return new NewsletterSubscriber(props)
  }

  get id(): string {
    return this.props.id
  }
  get email(): Email {
    return this.props.email
  }

  toPublic() {
    return {
      id: this.props.id,
      email: this.props.email.value,
      createdAt: this.props.createdAt,
    }
  }
}
