import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/oauth/providers";
import { generateState, generateCodeVerifier, generateCodeChallenge } from "@/lib/oauth/pkce";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.json(
      { error: `Unsupported OAuth provider: ${providerId}` },
      { status: 400 }
    );
  }

  if (providerId === "mock" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Mock authentication provider is disabled in production." },
      { status: 403 }
    );
  }

  const origin = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, "");
  const redirectUri = `${origin}/api/auth/${provider.id}/callback`;
  const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/dashboard";

  // Generate CSRF state and PKCE verifier/challenge
  const state = generateState(32);
  const codeVerifier = generateCodeVerifier(32);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authUrl = provider.getAuthorizationUrl({
    state,
    codeChallenge,
    redirectUri,
  });

  const targetUrl = authUrl.startsWith("http")
    ? authUrl
    : new URL(authUrl, origin).toString();

  const response = NextResponse.redirect(targetUrl);

  // Store state and codeVerifier in a secure HttpOnly cookie for callback verification
  const sessionData = JSON.stringify({
    state,
    codeVerifier,
    returnUrl,
    provider: provider.id,
  });

  response.cookies.set("kv_oauth_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
