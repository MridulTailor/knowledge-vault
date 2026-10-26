import crypto from "crypto";

/**
 * Generates a cryptographically secure random string suitable for CSRF state or nonce.
 */
export function generateState(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Generates a high-entropy cryptographic random string for PKCE code verifier (RFC 7636 Section 4.1).
 * Min 43 characters, max 128 characters.
 */
export function generateCodeVerifier(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Generates a code challenge from a code verifier using S256 (RFC 7636 Section 4.2).
 * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier, "ascii")
    .digest("base64url");
}
