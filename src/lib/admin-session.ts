import { cookies } from "next/headers";
import { prisma } from "./db";
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";
import { AdminRole } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(config.auth.sessionSecret);
const ADMIN_COOKIE_NAME = "tmd_admin_session";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function setAdminSessionCookie(admin: AuthenticatedAdmin): Promise<string> {
  const token = await new SignJWT({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    scope: "ADMIN_CONSOLE",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);

  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.app.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminUser(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie.value, SECRET_KEY, {
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
