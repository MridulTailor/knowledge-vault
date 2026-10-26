import { describe, it, expect, vi } from "vitest";
import { sanitizeServerError, formatClientError } from "./errors";

describe("Error Handling System", () => {
  describe("Server-Side Error Sanitizer (sanitizeServerError)", () => {
    it("sanitizes raw Prisma database missing table errors without leaking file paths", () => {
      // Mock console.error to avoid polluting test logs
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const rawPrismaError = new Error(
        "Invalid `prisma.account.findUnique()` invocation in /Users/mridultailor/Developer/Personal Projects/knowledge-vault/.next/dev/server/chunks/route.js:491:165\nThe table 'public.accounts' does not exist in the current database."
      );

      const result = sanitizeServerError(rawPrismaError);

      expect(result.errorCode).toBe("AUTH_DATABASE_ERROR");
      expect(result.errorId).toMatch(/^kv_err_/);
      expect(result.technicalSummary).toBeDefined();
      // Verifies internal developer absolute path is stripped
      expect(result.technicalSummary).not.toContain("/Users/mridultailor/");

      consoleSpy.mockRestore();
    });

    it("sanitizes OAuth access denied errors", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = sanitizeServerError(new Error("user_cancelled or access_denied"));
      expect(result.errorCode).toBe("OAUTH_ACCESS_DENIED");

      consoleSpy.mockRestore();
    });

    it("sanitizes CSRF state validation mismatch errors", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = sanitizeServerError("Invalid state parameter (CSRF protection failed)");
      expect(result.errorCode).toBe("OAUTH_STATE_MISMATCH");

      consoleSpy.mockRestore();
    });
  });

  describe("Client-Side Error Formatter (formatClientError)", () => {
    it("formats known error codes into user-friendly presentation", () => {
      const formatted = formatClientError("AUTH_DATABASE_ERROR");

      expect(formatted.code).toBe("AUTH_DATABASE_ERROR");
      expect(formatted.title).toBe("Database Unavailable");
      expect(formatted.message).toContain("Our authentication database is currently unreachable");
      expect(formatted.suggestion).toBeDefined();
    });

    it("maps raw invalid credential strings to clean message", () => {
      const formatted = formatClientError("Invalid email or password");

      expect(formatted.code).toBe("INVALID_CREDENTIALS");
      expect(formatted.title).toBe("Invalid Credentials");
      expect(formatted.message).toBe("The email address or password you entered is incorrect.");
      expect(formatted.technicalDetails).toBeUndefined();
    });

    it("maps Error instances with invalid credentials correctly without technical details", () => {
      const formatted = formatClientError(new Error("Invalid email or password"));

      expect(formatted.code).toBe("INVALID_CREDENTIALS");
      expect(formatted.title).toBe("Invalid Credentials");
      expect(formatted.message).toBe("The email address or password you entered is incorrect.");
      expect(formatted.technicalDetails).toBeUndefined();
    });

    it("falls back gracefully for unexpected errors", () => {
      const formatted = formatClientError(new Error("Some random third party error"));

      expect(formatted.code).toBe("UNKNOWN_ERROR");
      expect(formatted.title).toBe("Authentication Error");
      expect(formatted.technicalDetails).toBe("Some random third party error");
    });
  });
});
