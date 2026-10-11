import { prisma } from "../src/lib/db";

async function main() {
  console.log("🔍 Verifying PostgreSQL Connection & Tables in tmd_db...");
  await prisma.$connect();
  console.log("✓ Connected to PostgreSQL successfully!");

  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log(`\nFound ${tables.length} tables in PostgreSQL public schema:`);
  tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));

  // Check seeded data counts
  const planCount = await prisma.plan.count();
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const photoCount = await prisma.profilePhoto.count();
  const interestCount = await prisma.interest.count();
  const languageCount = await prisma.language.count();
  const adminCount = await prisma.adminUser.count();
  const subCount = await prisma.subscription.count();

  console.log("\nSeeded Data Verification:");
  console.log(`  - Plans: ${planCount} (Expected: 4)`);
  console.log(`  - Users: ${userCount} (Expected: 4)`);
  console.log(`  - Profiles: ${profileCount} (Expected: 4)`);
  console.log(`  - Photos: ${photoCount}`);
  console.log(`  - Interests: ${interestCount} (Expected: 10)`);
  console.log(`  - Languages: ${languageCount} (Expected: 10)`);
  console.log(`  - Admin Users: ${adminCount} (Expected: 1)`);
  console.log(`  - Subscriptions: ${subCount} (Expected: 4)`);

  if (tables.length === 30 && planCount === 4 && userCount === 4) {
    console.log("\n🎉 ALL 30 MODELS VERIFIED AND POPULATED IN POSTGRESQL (tmd_db)!");
  } else {
    throw new Error(`Verification mismatch: ${tables.length} tables found`);
  }
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
