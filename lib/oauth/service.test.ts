import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleOAuthLoginOrRegister } from "./service";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("OAuth Service - Account Provisioning & Linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleProfile = {
    id: "google-sub-987",
    email: "jane.doe@example.com",
    name: "Jane Doe",
    image: "https://lh3.googleusercontent.com/photo.jpg",
  };

  const sampleTokens = {
    access_token: "mock-access-token",
    id_token: "mock-id-token",
    expires_in: 3600,
    token_type: "Bearer",
  };

  it("authenticates existing user when account is already linked", async () => {
    const existingUser = {
      id: "user-123",
      email: "jane.doe@example.com",
      name: "Jane Doe",
      image: "https://lh3.googleusercontent.com/photo.jpg",
    };

    mockPrisma.account.findUnique.mockResolvedValueOnce({
      id: "account-1",
      provider: "google",
      providerAccountId: "google-sub-987",
      user: existingUser,
    });

    mockPrisma.account.update.mockResolvedValueOnce({});

    const result = await handleOAuthLoginOrRegister("google", sampleProfile, sampleTokens);

    expect(result.user.id).toBe("user-123");
    expect(result.isNewUser).toBe(false);
    expect(result.token).toBeDefined();
    expect(mockPrisma.account.update).toHaveBeenCalled();
  });

  it("links new OAuth account to existing user with matching email", async () => {
    // No account found
    mockPrisma.account.findUnique.mockResolvedValueOnce(null);

    // Existing user found by email
    const existingUser = {
      id: "user-existing-456",
      email: "jane.doe@example.com",
      name: "Jane Doe",
      image: null,
    };
    mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
    mockPrisma.account.create.mockResolvedValueOnce({ id: "new-acc-id" });

    const result = await handleOAuthLoginOrRegister("google", sampleProfile, sampleTokens);

    expect(result.user.id).toBe("user-existing-456");
    expect(result.isNewUser).toBe(false);
    expect(mockPrisma.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-existing-456",
          provider: "google",
          providerAccountId: "google-sub-987",
        }),
      })
    );
  });

  it("provisions a new user without password when neither account nor email exists", async () => {
    mockPrisma.account.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const newUser = {
      id: "user-brand-new-789",
      email: "jane.doe@example.com",
      name: "Jane Doe",
      image: "https://lh3.googleusercontent.com/photo.jpg",
      password: null,
    };

    mockPrisma.user.create.mockResolvedValueOnce(newUser);
    mockPrisma.account.create.mockResolvedValueOnce({ id: "acc-brand-new" });

    const result = await handleOAuthLoginOrRegister("google", sampleProfile, sampleTokens);

    expect(result.isNewUser).toBe(true);
    expect(result.user.id).toBe("user-brand-new-789");
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jane.doe@example.com",
          password: null,
        }),
      })
    );
  });
});
