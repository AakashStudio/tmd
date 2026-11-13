import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken } from "@/lib/auth-crypto";
import { config } from "@/lib/config";
import { AuthProvider } from "@prisma/client";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "tmd.dizitio.com";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${protocol}://${host}`;

  if (error) {
    console.error("Google OAuth error from provider:", error);
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, baseUrl));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?auth_error=missing_oauth_params", baseUrl));
  }

  // Verify CSRF state against cookie
  const storedState = req.cookies.get("g_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    console.error("Google OAuth state mismatch or expired");
    return NextResponse.redirect(new URL("/?auth_error=invalid_state", baseUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth credentials missing on server");
    return NextResponse.redirect(new URL("/?auth_error=google_not_configured", baseUrl));
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Failed to exchange Google OAuth code:", errBody);
      return NextResponse.redirect(new URL("/?auth_error=token_exchange_failed", baseUrl));
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/?auth_error=no_access_token", baseUrl));
    }

    // 2. Fetch Google user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileRes.ok) {
      console.error("Failed to fetch Google userinfo:", await profileRes.text());
      return NextResponse.redirect(new URL("/?auth_error=profile_fetch_failed", baseUrl));
    }

    const googleUser: GoogleUserInfo = await profileRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/?auth_error=no_email_returned", baseUrl));
    }

    const email = googleUser.email.toLowerCase().trim();

    // 3. Find or Create User in Database
    // Check if identity already linked
    let identity = await prisma.authIdentity.findUnique({
      where: {
        provider_identifier: {
          provider: AuthProvider.GOOGLE,
          identifier: email,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    let user;

    if (identity) {
      user = identity.user;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
    } else {
      // Identity not found, check if user exists by email
      user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (user) {
        // Link Google auth identity to existing user
        await prisma.authIdentity.create({
          data: {
            userId: user.id,
            provider: AuthProvider.GOOGLE,
            identifier: email,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      } else {
        // Create new User and link Google AuthIdentity
        user = await prisma.user.create({
          data: {
            email,
            isVerified: Boolean(googleUser.email_verified),
            verifiedAt: googleUser.email_verified ? new Date() : null,
            authIdentities: {
              create: {
                provider: AuthProvider.GOOGLE,
                identifier: email,
              },
            },
          },
          include: { profile: true },
        });
      }
    }

    // 4. Create Session Token
    const sessionToken = await createSessionToken({
      userId: user.id,
      role: user.role,
      status: user.status,
    });

    // 5. Build Redirect response
    const targetUrl = new URL("/", baseUrl);
    const response = NextResponse.redirect(targetUrl);

    // Set secure session cookie
    response.cookies.set(config.auth.cookieName, sessionToken, {
      httpOnly: true,
      secure: config.app.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: config.auth.sessionTtlSeconds,
    });

    // Clear state cookie
    response.cookies.set("g_oauth_state", "", {
      httpOnly: true,
      secure: config.app.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Unexpected error during Google OAuth callback:", err);
    return NextResponse.redirect(new URL("/?auth_error=oauth_internal_error", baseUrl));
  }
}
