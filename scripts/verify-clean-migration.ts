import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function verifyCleanDatabaseMigration() {
  console.log("=================================================================");
  console.log("🐘 VERIFYING CLEAN-DATABASE PRISMA MIGRATION (ISOLATED)");
  console.log("=================================================================\n");

  const testDbName = "tmd_clean_migration_test";
  const maintenanceUrl = "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";
  const isolatedTestDbUrl = `postgresql://postgres:postgres@127.0.0.1:5432/${testDbName}?schema=public`;

  const maintenancePrisma = new PrismaClient({
    datasources: { db: { url: maintenanceUrl } },
  });

  try {
    console.log("1. Creating Empty Isolated Test Database...");
    // Terminate existing connections if any and drop old test db
    await maintenancePrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDbName}' AND pid <> pg_backend_pid();
    `).catch(() => {});

    await maintenancePrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${testDbName};`);
    await maintenancePrisma.$executeRawUnsafe(`CREATE DATABASE ${testDbName};`);
    console.log(`  ✓ Isolated database '${testDbName}' created cleanly.`);

    console.log("\n2. Executing 'prisma migrate deploy' Against Clean Database...");
    const deployOutput = execSync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: isolatedTestDbUrl },
      encoding: "utf8",
    });
    console.log("Deploy Output:\n" + deployOutput.trim());
    assert(deployOutput.includes("1 migration found") || deployOutput.includes("No pending migrations"), "Migration execution succeeded");

    console.log("\n3. Inspecting Migrated Database Schema & Metadata...");
    const testPrisma = new PrismaClient({
      datasources: { db: { url: isolatedTestDbUrl } },
    });

    try {
      // 3.1 Verify migration log table
      const migrations: any[] = await testPrisma.$queryRawUnsafe(`
        SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations;
      `);
      assert(migrations.length === 1, `Exactly 1 migration recorded (Found: ${migrations.length})`);
      assert(migrations[0].migration_name.includes("0_init"), `Migration name is '0_init' (Got: ${migrations[0].migration_name})`);
      assert(migrations[0].rolled_back_at === null, "Migration has not rolled back (rolled_back_at is null)");

      // 3.2 Verify table count
      const tables: any[] = await testPrisma.$queryRawUnsafe(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != '_prisma_migrations';
      `);
      assert(tables.length === 30, `Exactly 30 application models/tables exist in clean DB (Found: ${tables.length})`);

      // 3.3 Verify composite unique indexes exist
      const indexes: any[] = await testPrisma.$queryRawUnsafe(`
        SELECT indexname FROM pg_indexes
        WHERE indexname IN ('swipe_windows_userId_windowStart_key', 'likes_fromUserId_toUserId_key', 'matches_user1Id_user2Id_key');
      `);
      assert(indexes.length === 3, `All 3 critical unique indexes exist on clean schema (Found: ${indexes.length})`);

      console.log("\n4. Verifying CRUD Insertion on Clean Database...");
      const freePlan = await testPrisma.plan.create({
        data: {
          code: "FREE",
          name: "Free Tier",
          priceInPaise: 0,
          durationDays: 3650,
          isPro: false,
          features: JSON.stringify(["25 swipes per 12h", "Chat with mutual matches"]),
        },
      });
      assert(Boolean(freePlan.id), "Successfully created sample plan on clean schema");

      const testUser = await testPrisma.user.create({
        data: {
          phone: "+919999900001",
          status: "ACTIVE",
          profile: {
            create: {
              name: "Clean Migration User",
              dob: new Date("2000-01-01"),
              age: 24,
              gender: "FEMALE",
              interestedIn: "MALE",
              city: "Indore",
            },
          },
        },
      });
      assert(Boolean(testUser.id), "Successfully created sample user and profile on clean schema");

    } finally {
      await testPrisma.$disconnect();
    }

  } finally {
    console.log("\n5. Cleaning Up & Dropping Isolated Test Database...");
    await maintenancePrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDbName}' AND pid <> pg_backend_pid();
    `).catch(() => {});
    await maintenancePrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${testDbName};`);
    await maintenancePrisma.$disconnect();
    console.log(`  ✓ Database '${testDbName}' cleanly destroyed. No production data modified.`);
  }

  console.log("\n=================================================================");
  console.log("🎉 CLEAN DATABASE PRISMA MIGRATION VERIFICATION COMPLETE (PASS)");
  console.log("=================================================================\n");
}

verifyCleanDatabaseMigration().catch((err) => {
  console.error("MIGRATION VERIFICATION ERROR:", err);
  process.exit(1);
});
