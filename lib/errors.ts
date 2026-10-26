import { GraphQLError } from "graphql";

export type AuthErrorCode =
  | "AUTH_DATABASE_ERROR"
  | "OAUTH_ACCESS_DENIED"
  | "OAUTH_STATE_MISMATCH"
  | "OAUTH_CONFIGURATION_ERROR"
  | "OAUTH_EXCHANGE_FAILED"
  | "OAUTH_UNSUPPORTED_PROVIDER"
  | "ACCOUNT_LINK_ERROR"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface FormattedError {
  code: string;
  title: string;
  message: string;
  suggestion?: string;
  technicalDetails?: string;
  errorId?: string;
}

interface ErrorDefinition {
  title: string;
  message: string;
  suggestion?: string;
}

const ERROR_DICTIONARY: Record<AuthErrorCode, ErrorDefinition> = {
  AUTH_DATABASE_ERROR: {
    title: "Database Unavailable",
    message: "Our authentication database is currently unreachable or schema tables are synchronizing.",
    suggestion: "Please try again shortly. If you are developing locally, run `npx prisma db push`.",
  },
  OAUTH_ACCESS_DENIED: {
    title: "Authentication Canceled",
    message: "The login request was canceled or consent was not granted by your identity provider.",
    suggestion: "Click 'Continue with Google' if you would like to try signing in again.",
  },
  OAUTH_STATE_MISMATCH: {
    title: "Security Verification Expired",
    message: "The authentication session timed out or the CSRF security check could not be verified.",
    suggestion: "Please return to the login screen and start a fresh sign-in request.",
  },
  OAUTH_CONFIGURATION_ERROR: {
    title: "Provider Configuration Missing",
    message: "Google OAuth credentials are not properly configured on the server.",
    suggestion: "Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your environment variables.",
  },
  OAUTH_EXCHANGE_FAILED: {
    title: "Provider Communication Error",
    message: "Could not exchange the authorization code with the identity provider.",
    suggestion: "Please verify your network connection and try signing in again.",
  },
  OAUTH_UNSUPPORTED_PROVIDER: {
    title: "Unsupported Provider",
    message: "The requested authentication provider is not supported.",
    suggestion: "Please choose one of the available sign-in methods.",
  },
  ACCOUNT_LINK_ERROR: {
    title: "Account Linking Failed",
    message: "Unable to associate this social login with your existing account.",
    suggestion: "Try signing in using your original email and password credentials.",
  },
  INVALID_CREDENTIALS: {
    title: "Invalid Credentials",
    message: "The email address or password you entered is incorrect.",
    suggestion: "Please check your typing and try again.",
  },
  EMAIL_ALREADY_EXISTS: {
    title: "Account Already Exists",
    message: "An account with this email address is already registered.",
    suggestion: "Please sign in with your password or use Google sign-in.",
  },
  NETWORK_ERROR: {
    title: "Network Connection Issue",
    message: "Failed to connect to the authentication server.",
    suggestion: "Check your internet connection and try reloading the page.",
  },
  UNKNOWN_ERROR: {
    title: "Authentication Error",
    message: "An unexpected error occurred during authentication.",
    suggestion: "Please try again. If the issue persists, contact support.",
  },
};

/**
 * Server-Side Error Sanitizer
 * Catches any backend/Prisma/OAuth error, generates an error ID, securely logs
 * the full error to the server, and returns a safe sanitized code for clients.
 */
export function sanitizeServerError(error: unknown): {
  errorCode: AuthErrorCode;
  errorId: string;
  technicalSummary?: string;
} {
  const errorId = `kv_err_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 6)}`;

  // Log full error trace securely on the server with errorId
  console.error(`[AUTH_ERROR][${errorId}]`, error);

  let rawMessage = "";
  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "string") {
    rawMessage = error;
  }

  let errorCode: AuthErrorCode = "UNKNOWN_ERROR";

  // Classify Database / Prisma Errors
  if (
    rawMessage.includes("The table") ||
    rawMessage.includes("does not exist") ||
    rawMessage.includes("Can't reach database") ||
    rawMessage.includes("Connection refused") ||
    rawMessage.includes("PrismaClientInitializationError") ||
    rawMessage.includes("PrismaClientKnownRequestError") ||
    rawMessage.includes("PrismaClientUnknownRequestError")
  ) {
    errorCode = "AUTH_DATABASE_ERROR";
  }
  // Classify OAuth / IdP Errors
  else if (
    rawMessage.includes("access_denied") ||
    rawMessage.includes("consent") ||
    rawMessage.includes("user_cancelled")
  ) {
    errorCode = "OAUTH_ACCESS_DENIED";
  } else if (
    rawMessage.includes("CSRF") ||
    rawMessage.includes("state") ||
    rawMessage.includes("session expired")
  ) {
    errorCode = "OAUTH_STATE_MISMATCH";
  } else if (
    rawMessage.includes("client_id") ||
    rawMessage.includes("client_secret") ||
    rawMessage.includes("missing credentials")
  ) {
    errorCode = "OAUTH_CONFIGURATION_ERROR";
  } else if (
    rawMessage.includes("token exchange failed") ||
    rawMessage.includes("fetch failed")
  ) {
    errorCode = "OAUTH_EXCHANGE_FAILED";
  }

  // Provide a clean sanitized single-line technical summary for dev mode only
  const technicalSummary = rawMessage
    ? rawMessage.replace(/\n\s+/g, " ").replace(/\/Users\/[^\s]+/g, "[internal-path]")
    : undefined;

  return { errorCode, errorId, technicalSummary };
}

/**
 * Client-Side Error Formatter
 * Takes an error code, Error instance, or GraphQL error and formats it into
 * a user-friendly presentation object.
 */
export function formatClientError(
  error: unknown,
  fallbackMessage?: string
): FormattedError {
  let code: AuthErrorCode = "UNKNOWN_ERROR";
  let technicalDetails: string | undefined;

  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    rawMessage = String((error as { message: unknown }).message);
  }

  // Check if rawMessage directly matches an error code key
  if (rawMessage in ERROR_DICTIONARY) {
    code = rawMessage as AuthErrorCode;
  } else if (rawMessage) {
    const lower = rawMessage.toLowerCase();
    if (
      lower.includes("invalid email or password") ||
      lower.includes("invalid credential") ||
      lower.includes("incorrect password") ||
      lower.includes("wrong password") ||
      lower.includes("unauthenticated")
    ) {
      code = "INVALID_CREDENTIALS";
    } else if (
      lower.includes("email already exists") ||
      lower.includes("already registered") ||
      lower.includes("user already exists")
    ) {
      code = "EMAIL_ALREADY_EXISTS";
    } else if (
      lower.includes("network") ||
      lower.includes("fetch") ||
      lower.includes("failed to fetch")
    ) {
      code = "NETWORK_ERROR";
    } else if (
      lower.includes("database") ||
      lower.includes("table") ||
      lower.includes("prisma")
    ) {
      code = "AUTH_DATABASE_ERROR";
      technicalDetails = rawMessage;
    } else {
      technicalDetails = rawMessage;
    }
  }

  const definition = ERROR_DICTIONARY[code] || ERROR_DICTIONARY.UNKNOWN_ERROR;

  return {
    code,
    title: definition.title,
    message: fallbackMessage || definition.message,
    suggestion: definition.suggestion,
    technicalDetails,
  };
}
