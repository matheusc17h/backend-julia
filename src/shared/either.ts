/**
 * Minimal `Either` type used by use cases to return a domain error (left)
 * or a success value (right) without throwing.
 */
export type Either<L, R> =
  | { readonly ok: false; readonly value: L }
  | { readonly ok: true; readonly value: R }

export function left<L, R = never>(value: L): Either<L, R> {
  return { ok: false, value }
}

export function right<R, L = never>(value: R): Either<L, R> {
  return { ok: true, value }
}
