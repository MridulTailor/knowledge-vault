import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import type { OAuthTokens, OIDCUserProfile } from "./types";
import type { User } from "@prisma/client";

export interface OAuthAuthResult {
  token: string;
  user: User;
  isNewUser: boolean;
}

/**
 * Handles the OAuth/OIDC login or registration process.
 * Links accounts to existing users or provisions new user accounts seamlessly.
 */
export async function handleOAuthLoginOrRegister(
  providerId: string,
  profile: OIDCUserProfile,
  tokens: OAuthTokens
): Promise<OAuthAuthResult> {
  // 1. Check if this provider account already exists
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: providerId,
        providerAccountId: profile.id,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingAccount && existingAccount.user) {
    // Update token details on the existing account
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || existingAccount.refresh_token,
        id_token: tokens.id_token || existingAccount.id_token,
        expires_at: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : existingAccount.expires_at,
        scope: tokens.scope || existingAccount.scope,
      },
    });

    const user = existingAccount.user;
    const appToken = generateToken(user);
    return { token: appToken, user, isNewUser: false };
  }

  // 2. Check if a user with the same email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email.toLowerCase() },
  });

  let user: User;
  let isNewUser = false;

  if (existingUser) {
    // Link provider account to existing user
    user = existingUser;
    // Optionally update user name or image if not set
    if (!user.name && profile.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: profile.name, image: user.image || profile.image },
      });
    }
  } else {
    // Create new user without password
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        name: profile.name || profile.email.split("@")[0],
        image: profile.image,
        password: null, // OAuth users don't have a local password
      },
    });
  }

  // 3. Create the Account link
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "oauth",
      provider: providerId,
      providerAccountId: profile.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : undefined,
      token_type: tokens.token_type,
      scope: tokens.scope,
    },
  });

  // 4. Generate app JWT token
  const appToken = generateToken(user);

  return { token: appToken, user, isNewUser };
}
