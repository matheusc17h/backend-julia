/** Generates unique identifiers for new aggregates. */
export interface IdGenerator {
  generate(): string
}

/** Generates the numeric one-time code used in password recovery. */
export interface CodeGenerator {
  numeric(length: number): string
}
