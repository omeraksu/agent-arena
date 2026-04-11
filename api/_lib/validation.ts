import { timingSafeEqual } from "crypto";

/**
 * Validate an Ethereum address (0x + 40 hex chars).
 */
export function isValidAddress(addr: unknown): addr is string {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/i.test(addr);
}

/**
 * Timing-safe password comparison to prevent timing attacks.
 * Returns false if either value is empty.
 */
export function safePasswordCompare(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(inputBuf, expectedBuf);
}
