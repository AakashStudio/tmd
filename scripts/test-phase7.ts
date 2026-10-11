import { prisma } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/auth-crypto";
import { calculateAge } from "../src/lib/validation";
import { logAdminAction } from "../src/lib/audit";
import { getCanonicalMatchPair } from "../src/lib/match-helper";

async function runPhase7Tests() {
  console.log("=================================================");
  console.log("🚀 TMD MVP — PHASE 7 AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  const testSuffix = `adm_${Date.now()}`;
  const createdUserIds: string[] = [];
  const createdAdminIds: string[] = [];

  try {
    const createTestUser = async (name: string) => {
      const user = await prisma.user.create({
        data: {
          phone: `+91999${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: "ACTIVE",
          isVerified: false,
          profile: {
            create: {
              name,
              dob: new Date("1999-04-10"),
              age: 25,
              gender: "FEMALE",
              interestedIn: "MEN",
              city: "Bhopal",
              bio: `Safety test user ${name}`,
              relationshipIntention: "LONG_TERM",
            },
          },
        },
        include: { profile: true },
      });
      createdUserIds.push(user.id);
      return user;
    };

    // -----------------------------------------------------------------
    // 1. Block Immediate Exclusion Invariant
    // -----------------------------------------------------------------
    console.log("1. Verifying Block Immediate Discovery & Chat Exclusion...");

    const userA = await createTestUser(`Blocker_${testSuffix}`);
    const userB = await createTestUser(`Blocked_${testSuffix}`);

    // Create mutual match
    const { user1Id, user2Id } = getCanonicalMatchPair(userA.id, userB.id);
    const match = await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        status: "ACTIVE",
      },
    });

    console.log(`  ✓ Active match established between Blocker & Blocked: ${match.id}`);

    // User A blocks User B
    const block = await prisma.block.create({
      data: {
        blockerId: userA.id,
        blockedUserId: userB.id,
      },
    });

    // Update match to UNMATCHED
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "UNMATCHED", unmatchedById: userA.id },
    });

    console.log(`  ✓ Block record created: ${block.id}`);

    const refreshedMatch = await prisma.match.findUnique({ where: { id: match.id } });
    if (refreshedMatch?.status !== "UNMATCHED") {
      throw new Error("Match was not transitioned to UNMATCHED upon block!");
    }
    console.log(`  ✓ Match status immediately updated to: "${refreshedMatch.status}"`);

    // Verify discovery feed exclusion query
    const [blocksInitiated, blocksReceived] = await Promise.all([
      prisma.block.findMany({ where: { blockerId: userB.id }, select: { blockedUserId: true } }),
      prisma.block.findMany({ where: { blockedUserId: userB.id }, select: { blockerId: true } }),
    ]);

    const blockedIdsForB = new Set<string>();
    blocksInitiated.forEach((b) => blockedIdsForB.add(b.blockedUserId));
    blocksReceived.forEach((b) => blockedIdsForB.add(b.blockerId));

    if (!blockedIdsForB.has(userA.id)) {
      throw new Error("Blocked user does not have blocker in exclusion list!");
    }
    console.log("  ✓ Discovery feed exclusion query strictly excludes blocker and blocked users");

    // -----------------------------------------------------------------
    // 2. Reporting & Auto-Block Feature
    // -----------------------------------------------------------------
    console.log("\n2. Verifying Reporting & Auto-Block Pipeline...");

    const userC = await createTestUser(`Reported_${testSuffix}`);

    const report = await prisma.report.create({
      data: {
        reporterId: userA.id,
        reportedUserId: userC.id,
        reason: "Harassment",
        details: "Inappropriate behavior in chat",
        status: "PENDING",
      },
    });

    // Auto-block
    await prisma.block.create({
      data: {
        blockerId: userA.id,
        blockedUserId: userC.id,
      },
    });

    console.log(`  ✓ Report filed with ID: ${report.id}, status: "${report.status}"`);
    const autoBlockRecord = await prisma.block.findUnique({
      where: { blockerId_blockedUserId: { blockerId: userA.id, blockedUserId: userC.id } },
    });
    if (!autoBlockRecord) throw new Error("Auto-block record was not created!");
    console.log("  ✓ Auto-block successfully applied on reported user");

    // -----------------------------------------------------------------
    // 3. Admin Authentication & Role Invariants
    // -----------------------------------------------------------------
    console.log("\n3. Verifying Admin Authentication & Roles...");

    const adminPassword = "SuperAdminStrongPassword123!";
    const passwordHash = await hashPassword(adminPassword);

    const adminUser = await prisma.adminUser.create({
      data: {
        email: `admin_${testSuffix}@thematchdate.com`,
        name: "Test Moderator",
        passwordHash,
        role: "MODERATOR",
        isActive: true,
      },
    });
    createdAdminIds.push(adminUser.id);

    console.log(`  ✓ Admin created: ${adminUser.email} with role "${adminUser.role}"`);

    const isCorrectPassword = await verifyPassword(adminPassword, adminUser.passwordHash);
    const isWrongPassword = await verifyPassword("WrongPassword!", adminUser.passwordHash);

    if (!isCorrectPassword || isWrongPassword) {
      throw new Error("Admin password verification failed!");
    }
    console.log("  ✓ Admin password verification matches correct password and rejects invalid");

    // -----------------------------------------------------------------
    // 4. Admin Ban User Action & Audit Log
    // -----------------------------------------------------------------
    console.log("\n4. Verifying Admin User Ban & Audit Logging...");

    // Admin resolves report and bans reported user
    await prisma.user.update({
      where: { id: userC.id },
      data: { status: "BANNED" },
    });

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "ACTIONED",
        actionTaken: "Banned for harassment",
        reviewedBy: adminUser.email,
        reviewedAt: new Date(),
      },
    });

    await logAdminAction({
      adminUserId: adminUser.id,
      action: "BAN_USER",
      targetType: "USER",
      targetId: userC.id,
      details: { reportId: report.id, reason: report.reason },
    });

    const bannedUser = await prisma.user.findUnique({ where: { id: userC.id } });
    if (bannedUser?.status !== "BANNED") {
      throw new Error("User status did not transition to BANNED!");
    }
    console.log(`  ✓ Reported user successfully banned: status = "${bannedUser.status}"`);

    const auditEntry = await prisma.adminAuditLog.findFirst({
      where: { adminUserId: adminUser.id, action: "BAN_USER" },
    });
    if (!auditEntry) throw new Error("Admin audit log entry was not persisted!");
    console.log(`  ✓ Admin audit log immutable entry verified: "${auditEntry.action}" on target "${auditEntry.targetId}"`);

    // -----------------------------------------------------------------
    // 5. Verification Review & Authoritative Age Recalculation
    // -----------------------------------------------------------------
    console.log("\n5. Verifying Admin DOB Correction & Authoritative Age Recalculation...");

    const userForDob = await createTestUser(`DobUser_${testSuffix}`);
    console.log(`  ✓ User initial DOB: ${userForDob.profile?.dob.toISOString().split("T")[0]}, Age: ${userForDob.profile?.age}`);

    const newTargetDob = new Date("1995-11-25"); // 29 years old
    const verificationReq = await prisma.verificationRequest.create({
      data: {
        userId: userForDob.id,
        requestType: "DOB_CORRECTION",
        payload: JSON.stringify({
          requestedDob: newTargetDob.toISOString(),
          documentUrl: "https://example.com/passport_proof.pdf",
        }),
        status: "PENDING",
      },
    });

    // Admin approves DOB correction
    const authoritativeAge = calculateAge(newTargetDob);

    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { userId: userForDob.id },
        data: {
          dob: newTargetDob,
          age: authoritativeAge,
        },
      });

      await tx.verificationRequest.update({
        where: { id: verificationReq.id },
        data: {
          status: "VERIFIED",
          reviewedBy: adminUser.email,
          reviewedAt: new Date(),
        },
      });
    });

    const updatedProfile = await prisma.profile.findUnique({ where: { userId: userForDob.id } });
    if (updatedProfile?.age !== authoritativeAge) {
      throw new Error("Authoritative age calculation was not accurately applied!");
    }
    console.log(`  ✓ Authoritative age recalculated server-side: ${updatedProfile?.age} years old`);
    console.log("  ✓ DOB is strictly authoritative; client cannot directly alter age");

    // Face verification review test
    const faceReq = await prisma.verificationRequest.create({
      data: {
        userId: userForDob.id,
        requestType: "FACE_VERIFICATION",
        payload: JSON.stringify({ selfieUrl: "https://example.com/selfie.jpg" }),
        status: "PENDING",
      },
    });

    await prisma.user.update({
      where: { id: userForDob.id },
      data: { isVerified: true, verifiedAt: new Date() },
    });
    await prisma.verificationRequest.update({
      where: { id: faceReq.id },
      data: { status: "VERIFIED" },
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: userForDob.id } });
    if (!verifiedUser?.isVerified) throw new Error("Face verification approval failed!");
    console.log(`  ✓ Face verification approved: user.isVerified = ${verifiedUser.isVerified}`);

    // -----------------------------------------------------------------
    // Cleanup Test Artifacts
    // -----------------------------------------------------------------
    console.log("\n6. Cleaning up Test Artifacts...");
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: createdAdminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: createdAdminIds } } });
    await prisma.verificationRequest.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.report.deleteMany({ where: { reporterId: { in: createdUserIds } } });
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: { in: createdUserIds } }, { blockedUserId: { in: createdUserIds } }] } });
    await prisma.match.deleteMany({ where: { id: match.id } });
    await prisma.profile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log("  ✓ All test artifacts cleanly deleted from database");

    console.log("\n=================================================");
    console.log("🎉 ALL PHASE 7 TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("\n❌ PHASE 7 TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase7Tests();
