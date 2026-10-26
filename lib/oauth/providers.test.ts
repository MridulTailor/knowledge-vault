import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { googleProvider, mockProvider, getProvider } from "./providers";

describe("OAuth 2.0 & OIDC Providers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "mock-google-client-id",
      GOOGLE_CLIENT_SECRET: "mock-google-secret",
      JWT_SECRET: "test-secret-key-12345",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Provider Registry", () => {
    it("retrieves configured providers by case-insensitive name", () => {
      expect(getProvider("google")).toBeDefined();
      expect(getProvider("GOOGLE")).toBeDefined();
      expect(getProvider("mock")).toBeDefined();
      expect(getProvider("github")).toBeUndefined();
      expect(getProvider("nonexistent")).toBeUndefined();
    });
  });

  describe("Google OIDC Provider", () => {
    it("builds authorization URL with OpenID Connect scopes and PKCE", () => {
      const url = googleProvider.getAuthorizationUrl({
        state: "test-state-123",
        codeChallenge: "test-challenge-s256",
        redirectUri: "http://localhost:3000/api/auth/google/callback",
      });

      const parsed = new URL(url);
      expect(parsed.origin).toBe("https://accounts.google.com");
      expect(parsed.pathname).toBe("/o/oauth2/v2/auth");
      expect(parsed.searchParams.get("client_id")).toBe("mock-google-client-id");
      expect(parsed.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/google/callback");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("scope")).toBe("openid email profile");
      expect(parsed.searchParams.get("state")).toBe("test-state-123");
      expect(parsed.searchParams.get("code_challenge")).toBe("test-challenge-s256");
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    });
  });

  describe("Mock OIDC Provider (Dev/Testing)", () => {
    it("exchanges mock code for tokens including a valid signed OIDC ID Token", async () => {
      const tokens = await mockProvider.exchangeCodeForTokens({
        code: "test_code_xyz",
        redirectUri: "http://localhost:3000/api/auth/mock/callback",
      });

      expect(tokens.access_token).toBe("mock_access_test_code_xyz");
      expect(tokens.id_token).toBeDefined();

      const profile = await mockProvider.getUserProfile(tokens);
      expect(profile.id).toBe("mock-user-oidc-12345");
      expect(profile.email).toBe("demo.developer@knowledgevault.io");
      expect(profile.name).toBe("Demo Developer");
      expect(profile.emailVerified).toBe(true);
    });
  });
});
