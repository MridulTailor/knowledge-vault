import type { OAuthProvider, OAuthTokens, OIDCUserProfile } from "./types";
import jwt from "jsonwebtoken";

export const googleProvider: OAuthProvider = {
  id: "google",
  name: "Google",
  type: "oidc",

  getAuthorizationUrl({ state, codeChallenge, redirectUri }) {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });

    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async exchangeCodeForTokens({ code, codeVerifier, redirectUri }) {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const bodyParams: Record<string, string> = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };

    if (codeVerifier) {
      bodyParams.code_verifier = codeVerifier;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    };
  },

  async getUserProfile(tokens: OAuthTokens): Promise<OIDCUserProfile> {
    // If id_token is present, decode OIDC claims
    if (tokens.id_token) {
      const decoded = jwt.decode(tokens.id_token) as any;
      if (decoded && decoded.sub && decoded.email) {
        return {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name || null,
          image: decoded.picture || null,
          emailVerified: Boolean(decoded.email_verified),
        };
      }
    }

    // Fallback: Query Google UserInfo endpoint
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google user profile");
    }

    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      name: data.name || null,
      image: data.picture || null,
      emailVerified: Boolean(data.email_verified),
    };
  },
};

/**
 * Mock OIDC Provider for local development, CI tests, and demo environments.
 * Allows testing the full OAuth 2.0 PKCE and OIDC handshake end-to-end.
 */
export const mockProvider: OAuthProvider = {
  id: "mock",
  name: "Dev OIDC (Demo)",
  type: "oidc",

  getAuthorizationUrl({ state, codeChallenge, redirectUri }) {
    const params = new URLSearchParams({
      state,
      redirect_uri: redirectUri,
    });
    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
    }
    return `/api/auth/mock/consent?${params.toString()}`;
  },

  async exchangeCodeForTokens({ code }) {
    // Generate simulated OIDC ID Token & access token
    const demoEmail = "demo.developer@knowledgevault.io";
    const demoSub = "mock-user-oidc-12345";
    const idToken = jwt.sign(
      {
        sub: demoSub,
        email: demoEmail,
        name: "Demo Developer",
        picture: "https://api.dicebear.com/7.x/bottts/svg?seed=KnowledgeVault",
        email_verified: true,
        iss: "https://auth.knowledgevault.local",
        aud: "knowledge-vault-app",
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "1h" }
    );

    return {
      access_token: `mock_access_${code}`,
      id_token: idToken,
      token_type: "Bearer",
      expires_in: 3600,
    };
  },

  async getUserProfile(tokens: OAuthTokens): Promise<OIDCUserProfile> {
    if (tokens.id_token) {
      const decoded = jwt.decode(tokens.id_token) as any;
      if (decoded && decoded.sub && decoded.email) {
        return {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          image: decoded.picture,
          emailVerified: true,
        };
      }
    }

    return {
      id: "mock-user-oidc-12345",
      email: "demo.developer@knowledgevault.io",
      name: "Demo Developer",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=KnowledgeVault",
      emailVerified: true,
    };
  },
};

export const providers: Record<string, OAuthProvider> = {
  google: googleProvider,
  mock: mockProvider,
};

export function getProvider(id: string): OAuthProvider | undefined {
  return providers[id.toLowerCase()];
}
