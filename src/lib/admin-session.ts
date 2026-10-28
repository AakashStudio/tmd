import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";
import { AdminRole } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(config.auth.sessionSecret);
export const ADMIN_COOKIE_NAME = "tmd_admin_session";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function createAdminSessionToken(admin: AuthenticatedAdmin): Promise<string> {
  return await new SignJWT({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    scope: "ADMIN_CONSOLE",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function setAdminSessionCookie(admin: AuthenticatedAdmin): Promise<string> {
  const token = await createAdminSessionToken(admin);

  try {
    const cookieStore = cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.app.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } catch {
    // Outside Next.js request context (e.g. tests)
  }

  return token;
}

export async function clearAdminSessionCookie(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch {
    // Outside Next.js request context
  }
}

export async function getAdminUser(req?: NextRequest): Promise<AuthenticatedAdmin | null> {
  let token: string | null = null;

  if (req) {
    token = req.cookies.get(ADMIN_COOKIE_NAME)?.value ?? null;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
      token = sessionCookie?.value ?? null;
    } catch {
      token = null;
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    if (payload.scope !== "ADMIN_CONSOLE" || !payload.adminId) {
      return null;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId as string },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  } catch {
    return null;
  }
}
