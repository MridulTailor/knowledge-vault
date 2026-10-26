import { describe, it, expect } from "vitest";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
} from "./pkce";

describe("OAuth 2.0 PKCE Utilities (RFC 7636)", () => {
  it("generates URL-safe CSRF state strings", () => {
    const state1 = generateState();
    const state2 = generateState();

    expect(state1).toBeDefined();
    expect(state2).toBeDefined();
    expect(state1).not.toBe(state2);
    // Base64url should only contain [A-Za-z0-9_-]
    expect(state1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates high-entropy code verifier with valid length", () => {
    const verifier = generateCodeVerifier();
    // 32 random bytes in base64url produces 43 characters (RFC 7636 min length is 43)
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("calculates S256 code challenge correctly matching RFC 7636 test vector", () => {
    // RFC 7636 Appendix B Test Vector
    const testVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expectedChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    const calculatedChallenge = generateCodeChallenge(testVerifier);
    expect(calculatedChallenge).toBe(expectedChallenge);
  });
});
