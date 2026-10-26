export interface OAuthTokens {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface OIDCUserProfile {
  id: string; // Provider's unique user ID (sub)
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
}

export interface OAuthProvider {
  id: "google" | "mock";
  name: string;
  type: "oauth" | "oidc";
  getAuthorizationUrl: (params: {
    state: string;
    codeChallenge?: string;
    redirectUri: string;
  }) => string;
  exchangeCodeForTokens: (params: {
    code: string;
    codeVerifier?: string;
    redirectUri: string;
  }) => Promise<OAuthTokens>;
  getUserProfile: (tokens: OAuthTokens) => Promise<OIDCUserProfile>;
}
