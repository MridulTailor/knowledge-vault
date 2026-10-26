import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const state = searchParams.get("state") || "";
  const redirectUri = searchParams.get("redirect_uri");

  if (!redirectUri) {
    return NextResponse.json({ error: "Missing redirect_uri" }, { status: 400 });
  }

  // Simulate user granting consent in the mock provider
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", "mock_auth_code_" + Date.now());
  callbackUrl.searchParams.set("state", state);

  return NextResponse.redirect(callbackUrl.toString());
}
