import { PrismaClient, PlanCode, UserRole, UserStatus, RelationshipIntention, PhotoStatus, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error("⛔ CRITICAL: Development seed data cannot be executed in production environment without ALLOW_SEED=true.");
  }
  console.log("🌱 Starting TMD Database Seed (Development Mode)...");

  // 1. Seed Master Plans
  console.log("Seeding Master Plans...");
  const plans = [
    {
      code: PlanCode.FREE,
      name: "Free",
      priceInPaise: 0,
      durationDays: 0,
      isPro: false,
      features: JSON.stringify({
        swipesLimitPerWindow: 10,
        rewind: false,
        whoLikedYou: 0,
        citySelection: false,
        distanceFilter: false,
        ads: true,
        events: false,
      }),
    },
    {
      code: PlanCode.TIER_49,
      name: "₹49 / 15 Days",
      priceInPaise: 4900,
      durationDays: 15,
      isPro: false,
      features: JSON.stringify({
        swipesLimitPerWindow: null,
        rewind: false,
        whoLikedYou: 10,
        citySelection: false,
        distanceFilter: false,
        ads: true,
        events: false,
      }),
    },
    {
      code: PlanCode.TIER_149,
      name: "₹149 / 15 Days",
      priceInPaise: 14900,
      durationDays: 15,
      isPro: false,
      features: JSON.stringify({
        swipesLimitPerWindow: null,
        rewind: true,
        whoLikedYou: "unlimited",
        citySelection: true,
        distanceFilter: true,
        ads: false,
        events: false,
      }),
    },
    {
      code: PlanCode.PRO_499,
      name: "₹499 PRO / 10 Days",
      priceInPaise: 49900,
      durationDays: 10,
      isPro: true,
      features: JSON.stringify({
        swipesLimitPerWindow: null,
        rewind: true,
        whoLikedYou: "unlimited",
        citySelection: true,
        distanceFilter: true,
        ads: false,
        events: true,
        createEvents: true,
        nameChange: true,
        dobCorrection: true,
      }),
    },
  ];

  const planMap: Record<string, string> = {};
  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
    planMap[p.code] = plan.id;
  }

  // 2. Seed Master Interests
  console.log("Seeding Master Interests...");
  const interests = [
    { name: "Photography", slug: "photography", icon: "camera", category: "Art & Culture" },
    { name: "Coffee", slug: "coffee", icon: "coffee", category: "Food & Drink" },
    { name: "Hiking", slug: "hiking", icon: "mountain", category: "Outdoor" },
    { name: "Tech & Coding", slug: "tech-coding", icon: "laptop", category: "Career" },
    { name: "Fitness & Gym", slug: "fitness-gym", icon: "dumbbell", category: "Sports" },
    { name: "Live Music", slug: "live-music", icon: "music", category: "Entertainment" },
    { name: "Standup Comedy", slug: "standup-comedy", icon: "smile", category: "Entertainment" },
    { name: "Cooking", slug: "cooking", icon: "utensils", category: "Food & Drink" },
    { name: "Board Games", slug: "board-games", icon: "dice", category: "Gaming" },
    { name: "Travel", slug: "travel", icon: "plane", category: "Outdoor" },
  ];

  const interestMap: Record<string, string> = {};
  for (const item of interests) {
    const res = await prisma.interest.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
    interestMap[item.slug] = res.id;
  }

  // 3. Seed Master Languages
  console.log("Seeding Master Languages...");
  const languages = [
    { name: "English", code: "en" },
    { name: "Hindi", code: "hi" },
    { name: "Punjabi", code: "pa" },
    { name: "Bengali", code: "bn" },
    { name: "Marathi", code: "mr" },
    { name: "Telugu", code: "te" },
    { name: "Tamil", code: "ta" },
    { name: "Gujarati", code: "gu" },
    { name: "Kannada", code: "kn" },
    { name: "Malayalam", code: "ml" },
  ];

  const languageMap: Record<string, string> = {};
  for (const lang of languages) {
    const res = await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
    languageMap[lang.code] = res.id;
  }

  // 4. Seed Super Admin
  console.log("Seeding Super Admin...");
  const adminPasswordHash = await bcrypt.hash("AdminSecretPass#2026", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@thematchdate.com" },
    update: {
      passwordHash: adminPasswordHash,
      name: "TMD Super Admin",
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: "admin@thematchdate.com",
      passwordHash: adminPasswordHash,
      name: "TMD Super Admin",
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 5. Seed Test Users with Profiles and Tiers
  console.log("Seeding Test Users...");

  const testUsersData = [
    {
      phone: "+919876543210",
      email: "aarav.sharma@example.com",
      name: "Aarav Sharma",
      dob: new Date("1999-04-12"), // 27 years old
      age: 27,
      gender: "Male",
      interestedIn: "Female",
      city: "Delhi",
      bio: "Tech architect who loves indie coffee houses and weekend mountain treks.",
      profession: "Software Architect",
      education: "B.Tech Computer Science",
      height: 180,
      intention: RelationshipIntention.LONG_TERM,
      planCode: PlanCode.FREE,
      interests: ["tech-coding", "coffee", "hiking"],
      languages: ["en", "hi"],
      photos: [
        { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", order: 1, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800", order: 2, isPrimary: false },
      ],
    },
    {
      phone: "+919876543211",
      email: "ananya.patel@example.com",
      name: "Ananya Patel",
      dob: new Date("2000-08-20"), // 26 years old
      age: 26,
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      bio: "Product designer passionate about typography, ceramics, and vinyl records.",
      profession: "Product Designer",
      education: "National Institute of Design",
      height: 165,
      intention: RelationshipIntention.LONG_TERM,
      planCode: PlanCode.TIER_49,
      interests: ["photography", "coffee", "live-music"],
      languages: ["en", "hi", "gu"],
      photos: [
        { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800", order: 1, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800", order: 2, isPrimary: false },
      ],
    },
    {
      phone: "+919876543212",
      email: "rohan.mehta@example.com",
      name: "Rohan Mehta",
      dob: new Date("1998-02-15"), // 28 years old
      age: 28,
      gender: "Male",
      interestedIn: "Female",
      city: "Mumbai",
      bio: "Fintech analyst by day, amateur standup open-mic comic by night.",
      profession: "Investment Analyst",
      education: "CFA, MBA Finance",
      height: 175,
      intention: RelationshipIntention.SHORT_TERM_CASUAL,
      planCode: PlanCode.TIER_149,
      interests: ["standup-comedy", "fitness-gym", "travel"],
      languages: ["en", "hi", "mr"],
      photos: [
        { url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800", order: 1, isPrimary: true },
      ],
    },
    {
      phone: "+919876543213",
      email: "priya.nair@example.com",
      name: "Priya Nair",
      dob: new Date("1997-11-05"), // 28 years old
      age: 28,
      gender: "Female",
      interestedIn: "Male",
      city: "Bengaluru",
      bio: "Curator of live music events & culinary pop-ups. TMD Pro community member.",
      profession: "Event Producer",
      education: "Mass Communication",
      height: 168,
      intention: RelationshipIntention.LONG_TERM,
      planCode: PlanCode.PRO_499,
      interests: ["live-music", "cooking", "travel", "photography"],
      languages: ["en", "hi", "ml"],
      photos: [
        { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800", order: 1, isPrimary: true },
      ],
    },
  ];

  for (const u of testUsersData) {
    const user = await prisma.user.upsert({
      where: { phone: u.phone },
      update: {
        email: u.email,
        status: UserStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
      },
      create: {
        phone: u.phone,
        email: u.email,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // Profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        name: u.name,
        dob: u.dob,
        age: u.age,
        gender: u.gender,
        interestedIn: u.interestedIn,
        city: u.city,
        bio: u.bio,
        profession: u.profession,
        education: u.education,
        height: u.height,
        relationshipIntention: u.intention,
      },
      create: {
        userId: user.id,
        name: u.name,
        dob: u.dob,
        age: u.age,
        gender: u.gender,
        interestedIn: u.interestedIn,
        city: u.city,
        bio: u.bio,
        profession: u.profession,
        education: u.education,
        height: u.height,
        relationshipIntention: u.intention,
      },
    });

    // Profile Photos
    await prisma.profilePhoto.deleteMany({ where: { profileId: profile.id } });
    for (const ph of u.photos) {
      await prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          storageKey: `seed_${profile.id}_${ph.order}`,
          url: ph.url,
          order: ph.order,
          isPrimary: ph.isPrimary,
          status: PhotoStatus.APPROVED,
        },
      });
    }

    // Preferences
    await prisma.preference.upsert({
      where: { userId: user.id },
      update: {
        minAge: 21,
        maxAge: 35,
        targetCity: u.city,
        preferredGenders: JSON.stringify([u.interestedIn]),
      },
      create: {
        userId: user.id,
        minAge: 21,
        maxAge: 35,
        targetCity: u.city,
        preferredGenders: JSON.stringify([u.interestedIn]),
      },
    });

    // Subscriptions
    const planId = planMap[u.planCode];
    if (planId) {
      const now = new Date();
      const planDays = u.planCode === PlanCode.PRO_499 ? 10 : 15;
      const endDate = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);

      await prisma.subscription.upsert({
        where: { id: `sub_${user.id}` },
        update: {
          planId,
          status: "ACTIVE",
          startDate: now,
          endDate: u.planCode === PlanCode.FREE ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) : endDate,
        },
        create: {
          id: `sub_${user.id}`,
          userId: user.id,
          planId,
          status: "ACTIVE",
          startDate: now,
          endDate: u.planCode === PlanCode.FREE ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) : endDate,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
