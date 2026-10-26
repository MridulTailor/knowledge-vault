import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/oauth/providers";
import { handleOAuthLoginOrRegister } from "@/lib/oauth/service";
import { sanitizeServerError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);

  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const baseUrl = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, "");

  // Handle provider-returned errors (e.g. user canceled consent)
  if (error) {
    const errorCode =
      error === "access_denied" ? "OAUTH_ACCESS_DENIED" : "OAUTH_EXCHANGE_FAILED";
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", errorCode);
    if (errorDescription) {
      redirectUrl.searchParams.set("error_details", errorDescription);
    }
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (!provider) {
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", "OAUTH_UNSUPPORTED_PROVIDER");
    return NextResponse.redirect(redirectUrl.toString());
  }

  if (providerId === "mock" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Mock authentication provider is disabled in production." },
      { status: 403 }
    );
  }

  if (!code || !state) {
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", "OAUTH_STATE_MISMATCH");
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Read stored OAuth session from cookie
  const sessionCookie = req.cookies.get("kv_oauth_session");
  if (!sessionCookie?.value) {
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", "OAUTH_STATE_MISMATCH");
    return NextResponse.redirect(redirectUrl.toString());
  }

  let sessionData: {
    state: string;
    codeVerifier: string;
    returnUrl: string;
    provider: string;
  };

  try {
    sessionData = JSON.parse(sessionCookie.value);
  } catch {
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", "OAUTH_STATE_MISMATCH");
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Verify CSRF state
  if (sessionData.state !== state) {
    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", "OAUTH_STATE_MISMATCH");
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/${provider.id}/callback`;

    // Exchange authorization code for tokens (OAuth 2.0 / OIDC)
    const tokens = await provider.exchangeCodeForTokens({
      code,
      codeVerifier: sessionData.codeVerifier,
      redirectUri,
    });

    // Retrieve user profile (OIDC Claims / UserInfo)
    const userProfile = await provider.getUserProfile(tokens);

    // Provision or link user in database and generate app JWT
    const { token } = await handleOAuthLoginOrRegister(
      provider.id,
      userProfile,
      tokens
    );

    // Redirect to the client-side callback page with token
    const callbackTarget = new URL("/auth/callback", baseUrl);
    callbackTarget.searchParams.set("token", token);
    if (sessionData.returnUrl) {
      callbackTarget.searchParams.set("returnUrl", sessionData.returnUrl);
    }

    const response = NextResponse.redirect(callbackTarget.toString());

    // Clear the OAuth session cookie
    response.cookies.delete("kv_oauth_session");

    return response;
  } catch (err: unknown) {
    // Sanitize server error: logs full trace server-side and returns safe error code
    const { errorCode, errorId, technicalSummary } = sanitizeServerError(err);

    const redirectUrl = new URL("/auth", baseUrl);
    redirectUrl.searchParams.set("error_code", errorCode);
    redirectUrl.searchParams.set("error_id", errorId);

    // Only include technical summary in development mode
    if (process.env.NODE_ENV === "development" && technicalSummary) {
      redirectUrl.searchParams.set("error_details", technicalSummary.substring(0, 300));
    }

    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete("kv_oauth_session");
    return response;
  }
}
