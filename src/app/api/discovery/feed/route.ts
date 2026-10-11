import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDiscoveryFeed } from "@/services/discoveryService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Please complete your profile to access discovery" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedCity = searchParams.get("city");
    const minAgeParam = searchParams.get("minAge");
    const maxAgeParam = searchParams.get("maxAge");
    const cursor = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const result = await getDiscoveryFeed({
      user,
      requestedCity,
      minAgeParam,
      maxAgeParam,
      cursor,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Discovery feed error:", error);
    if (error.message === "PROFILE_REQUIRED") {
      return NextResponse.json(
        { error: "Please complete your profile to access discovery" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error fetching discovery feed" },
      { status: 500 }
    );
  }
}
