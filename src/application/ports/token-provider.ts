export interface TokenPayload {
  sub: string
  role: string
}

/** Issues and validates stateless access tokens. */
export interface TokenProvider {
  sign(payload: TokenPayload): string
  verify(token: string): TokenPayload | null
}
