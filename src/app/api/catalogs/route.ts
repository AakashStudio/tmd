import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [interests, languages] = await Promise.all([
      prisma.interest.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.language.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      interests,
      languages,
    });
  } catch (error) {
    console.error("Error in /api/catalogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalogs" },
      { status: 500 }
    );
  }
}
