import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MASTER_INTERESTS = [
  { name: "Photography", slug: "photography", icon: "📸", category: "Art & Culture" },
  { name: "Coffee & Cafes", slug: "coffee-cafes", icon: "☕", category: "Food & Drink" },
  { name: "Hiking & Trekking", slug: "hiking-trekking", icon: "🏔️", category: "Outdoor" },
  { name: "Tech & Coding", slug: "tech-coding", icon: "💻", category: "Career" },
  { name: "Fitness & Gym", slug: "fitness-gym", icon: "🏋️", category: "Sports" },
  { name: "Live Music", slug: "live-music", icon: "🎵", category: "Entertainment" },
  { name: "Standup Comedy", slug: "standup-comedy", icon: "🎤", category: "Entertainment" },
  { name: "Cooking & Baking", slug: "cooking-baking", icon: "🍳", category: "Food & Drink" },
  { name: "Board Games", slug: "board-games", icon: "🎲", category: "Gaming" },
  { name: "Travel & Exploring", slug: "travel-exploring", icon: "✈️", category: "Outdoor" },
  { name: "Street Food & Foodie", slug: "street-food-foodie", icon: "🍕", category: "Food & Drink" },
  { name: "Movies & Cinema", slug: "movies-cinema", icon: "🎬", category: "Entertainment" },
  { name: "Dogs & Pets", slug: "dogs-pets", icon: "🐶", category: "Lifestyle" },
  { name: "Reading & Books", slug: "reading-books", icon: "📚", category: "Art & Culture" },
  { name: "Gaming & Esports", slug: "gaming-esports", icon: "🎮", category: "Gaming" },
  { name: "Yoga & Wellness", slug: "yoga-wellness", icon: "🧘", category: "Sports" },
  { name: "Cocktails & Nightlife", slug: "cocktails-nightlife", icon: "🍸", category: "Food & Drink" },
  { name: "Cricket & Sports", slug: "cricket-sports", icon: "🏏", category: "Sports" },
  { name: "Nature & Camping", slug: "nature-camping", icon: "🏕️", category: "Outdoor" },
  { name: "Dancing & Clubs", slug: "dancing-clubs", icon: "💃", category: "Entertainment" },
  { name: "Anime & Manga", slug: "anime-manga", icon: "🌸", category: "Entertainment" },
  { name: "Art & Painting", slug: "art-painting", icon: "🎨", category: "Art & Culture" },
  { name: "Road Trips & Driving", slug: "road-trips-driving", icon: "🏎️", category: "Outdoor" },
  { name: "Cycling", slug: "cycling", icon: "🚴", category: "Sports" },
  { name: "Fashion & Styling", slug: "fashion-styling", icon: "👗", category: "Lifestyle" },
  { name: "Poetry & Writing", slug: "poetry-writing", icon: "✍️", category: "Art & Culture" },
  { name: "Swimming", slug: "swimming", icon: "🏊", category: "Sports" },
  { name: "Wine & Fine Dining", slug: "wine-fine-dining", icon: "🍷", category: "Food & Drink" },
];

export async function GET() {
  try {
    let interests = await prisma.interest.findMany({
      orderBy: { name: "asc" },
    });

    // Ensure rich catalog exists
    if (interests.length < 20) {
      for (const item of MASTER_INTERESTS) {
        await prisma.interest.upsert({
          where: { slug: item.slug },
          update: item,
          create: item,
        });
      }
      interests = await prisma.interest.findMany({
        orderBy: { name: "asc" },
      });
    }

    const languages = await prisma.language.findMany({
      orderBy: { name: "asc" },
    });

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
