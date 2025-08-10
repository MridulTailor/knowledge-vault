import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { User } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"

export interface JWTPayload {
  userId: string
  email: string
}

export function generateToken(user: Pick<User, "id" | "email">): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}
