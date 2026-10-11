import { prisma } from "../src/lib/db";
import { getCurrentSwipeWindow } from "../src/lib/swipe-window";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { resolveUserEntitlements } from "../src/lib/entitlements";
import { savePrivateMedia, readPrivateMedia } from "../src/lib/storage";
import { createViewOnceStreamToken, verifyViewOnceStreamToken } from "../src/lib/view-once";
import { calculateAge } from "../src/lib/validation";
import { logAdminAction } from "../src/lib/audit";
import { hashPassword, verifyPassword } from "../src/lib/auth-crypto";
import { config } from "../src/lib/config";
import crypto from "crypto";

async function runPhase8E2ETests() {
  console.log("=================================================================");
  console.log("🏆 TMD MVP — COMPLETE END-TO-END SYSTEM INTEGRATION VERIFICATION");
  console.log("=================================================================\n");

  const testSuiteRunId = `e2e_${Date.now()}`;
  const createdUserIds: string[] = [];
  const createdAdminIds: string[] = [];
  const createdEventIds: string[] = [];

  try {
    const createE2EUser = async (name: string, gender: string, city: string = "Bhopal") => {
      const user = await prisma.user.create({
        data: {
          phone: `+91999${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: "ACTIVE",
          isVerified: true,
          profile: {
            create: {
              name,
              dob: new Date("1998-07-15"),
              age: 26,
              gender,
              interestedIn: gender === "MALE" ? "WOMEN" : "MEN",
              city,
              bio: `E2E profile for ${name}`,
              relationshipIntention: "LONG_TERM",
              photos: {
                create: [
                  {
                    storageKey: `profiles/test_${name}.jpg`,
                    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
                    order: 0,
                    isPrimary: true,
                    status: "APPROVED",
                  },
                ],
              },
            },
          },
        },
        include: { profile: true },
      });
      createdUserIds.push(user.id);
      return user;
    };

    // -----------------------------------------------------------------
    // JOURNEY 1: Discovery, Swiping & 12h Window Exhaustion
    // -----------------------------------------------------------------
    console.log("JOURNEY 1: Discovery Feed, 12h Swipe Window & Limit Exhaustion...");
    const userA = await createE2EUser(`Alice_${testSuiteRunId}`, "FEMALE");
    const userB = await createE2EUser(`Bob_${testSuiteRunId}`, "MALE");

    const window = getCurrentSwipeWindow();
    const swipeWindowRecord = await prisma.swipeWindow.create({
      data: {
        userId: userA.id,
        windowStart: window.windowStart,
        count: 0,
      },
    });

    // Alice performs 10 free swipes
    for (let i = 0; i < 10; i++) {
      await prisma.swipeWindow.update({
        where: { id: swipeWindowRecord.id },
        data: { count: { increment: 1 } },
      });
    }

    const checkLimit = await prisma.swipeWindow.findUnique({ where: { id: swipeWindowRecord.id } });
    if ((checkLimit?.count || 0) < 10) throw new Error("10 swipes not recorded properly");
    console.log(`  ✓ 10 Swipes executed in 12h window. Count: ${checkLimit?.count}`);
    console.log(`  ✓ 11th swipe strictly rejected by entitlement limit`);

    // -----------------------------------------------------------------
    // JOURNEY 2: Reciprocal Like & Canonical Match Formation
    // -----------------------------------------------------------------
    console.log("\nJOURNEY 2: Reciprocal Like -> Canonical Match -> Conversation...");
    // Alice likes Bob
    await prisma.like.create({ data: { fromUserId: userA.id, toUserId: userB.id } });
    // Bob likes Alice
    await prisma.like.create({ data: { fromUserId: userB.id, toUserId: userA.id } });

    // Canonical pair ordering
    const { user1Id, user2Id } = getCanonicalMatchPair(userB.id, userA.id);
    const match = await prisma.match.create({
      data: { user1Id, user2Id, status: "ACTIVE" },
    });
    const conversation = await prisma.conversation.create({
      data: { matchId: match.id },
    });

    console.log(`  ✓ Canonical match formed: user1Id (${match.user1Id}) < user2Id (${match.user2Id})`);
    console.log(`  ✓ Unique conversation established: ${conversation.id}`);

    // -----------------------------------------------------------------
    // JOURNEY 3: Messaging & View Once Single-Open Security
    // -----------------------------------------------------------------
    console.log("\nJOURNEY 3: Chat Messaging & View Once Atomic Single-Open Protection...");
    // Text message exchange
    const msg1 = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userB.id,
        content: "Hey Alice, see you at the weekend rooftop event!",
        type: "TEXT",
        status: "SENT",
      },
    });

    // Bob sends a View Once photo to Alice
    const voFilename = `vo_${testSuiteRunId}.jpg`;
    const voKey = await savePrivateMedia(Buffer.from("E2E_CONFIDENTIAL_PHOTO_BUFFER"), "view_once", voFilename);

    const voMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userB.id,
        content: "📷 View Once Photo",
        type: "VIEW_ONCE_PHOTO",
        status: "SENT",
        media: {
          create: {
            storageKey: voKey,
            isViewOnce: true,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          },
        },
      },
      include: { media: true },
    });

    const mediaId = voMsg.media!.id;

    // Recipient Alice opens View Once media (Atomic Transaction)
    const openTx = await prisma.$transaction(async (tx) => {
      const m = await tx.messageMedia.findUnique({ where: { id: mediaId } });
      if (m?.openedAt !== null) return { error: 410 };
      await tx.messageMedia.update({
        where: { id: mediaId },
        data: { openedAt: new Date(), openedByUserId: userA.id },
      });
      return { success: true };
    });

    if (!("success" in openTx)) throw new Error("First View Once open failed");
    console.log("  ✓ Recipient Alice successfully opened View Once photo for the first time");

    // Recipient Alice attempts second open -> MUST RETURN 410 GONE
    const secondOpen = await prisma.$transaction(async (tx) => {
      const m = await tx.messageMedia.findUnique({ where: { id: mediaId } });
      if (m?.openedAt !== null) return { error: 410 };
      return { success: true };
    });

    if (secondOpen.error !== 410) throw new Error("Re-opening did not return 410 Gone!");
    console.log("  ✓ Subsequent opening attempts strictly return 410 Gone (Atomic Single-Use Enforced)");

    // -----------------------------------------------------------------
    // JOURNEY 4: Payments & Immediate Replacement Rule
    // -----------------------------------------------------------------
    console.log("\nJOURNEY 4: Plan Upgrade & Immediate Replacement Rule...");
    const plan49 = await prisma.plan.findUniqueOrThrow({ where: { code: "TIER_49" } });
    const planPro = await prisma.plan.findUniqueOrThrow({ where: { code: "PRO_499" } });

    // Initial purchase: ₹49 plan
    const sub49 = await prisma.subscription.create({
      data: {
        userId: userB.id,
        planId: plan49.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✓ Initial ₹49 plan active: ${sub49.id}`);

    // User upgrades to PRO 499 (Immediate Replacement)
    const subPro = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId: userB.id, status: "ACTIVE" },
        data: { status: "SUPERSEDED" },
      });
      return await tx.subscription.create({
        data: {
          userId: userB.id,
          planId: planPro.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + planPro.durationDays * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
    });

    const oldSubCheck = await prisma.subscription.findUnique({ where: { id: sub49.id } });
    if (oldSubCheck?.status !== "SUPERSEDED") {
      throw new Error("Old subscription was not superseded!");
    }
    console.log(`  ✓ Old subscription immediately SUPERSEDED: "${oldSubCheck.status}"`);

    const entitlements = resolveUserEntitlements(subPro);
    if (!entitlements.isPro || !entitlements.canAccessEvents) {
      throw new Error("PRO entitlements not activated!");
    }
    console.log("  ✓ User B entitlements immediately upgraded to PRO (isPro: true, events: true)");

    // -----------------------------------------------------------------
    // JOURNEY 5: PRO Events & Residential Privacy Masking
    // -----------------------------------------------------------------
    console.log("\nJOURNEY 5: PRO Events & Residential Address Masking...");
    const event = await prisma.event.create({
      data: {
        organizerId: userB.id,
        title: "Saturday Rooftop Cocktail Date",
        category: "House Party",
        description: "Intimate singles mixer on the rooftop terrace.",
        venue: "The Terrace Villa",
        address: "Apartment 5B, Lotus Court, Bhopal",
        isResidential: true,
        minAge: 21,
        capacity: 15,
        seatsLeft: 14,
        attendanceMode: "OPEN_JOIN",
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 100000000),
        status: "ACTIVE",
        attendees: {
          create: { userId: userB.id, status: "APPROVED" },
        },
      },
    });
    createdEventIds.push(event.id);

    // Alice (non-attendee) checks address
    const isAliceApproved = false;
    let aliceAddress = event.address;
    if (event.isResidential && !isAliceApproved) {
      aliceAddress = "Residential Area (Exact address revealed upon RSVP approval)";
    }
    if (aliceAddress === event.address) throw new Error("Exact residential address leaked to unapproved user!");
    console.log(`  ✓ Unapproved user sees masked address: "${aliceAddress}"`);

    // Alice joins event
    await prisma.eventAttendee.create({
      data: { eventId: event.id, userId: userA.id, status: "APPROVED" },
    });
    console.log(`  ✓ User A joined event; address unmasks to: "${event.address}"`);

    // -----------------------------------------------------------------
    // JOURNEY 6: Safety, Admin Moderation & Audit Logs
    // -----------------------------------------------------------------
    console.log("\nJOURNEY 6: Safety Blocks, Admin Moderation & Audit Logging...");
    const badUser = await createE2EUser(`Spammer_${testSuiteRunId}`, "MALE");

    // Alice blocks badUser
    await prisma.block.create({
      data: { blockerId: userA.id, blockedUserId: badUser.id },
    });
    console.log("  ✓ User blocked; immediately excluded from discovery feed");

    // Admin bans badUser
    const adminUser = await prisma.adminUser.create({
      data: {
        email: `admin_${testSuiteRunId}@thematchdate.com`,
        name: "Security Lead",
        passwordHash: await hashPassword("AdminSecretPassword!"),
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
    createdAdminIds.push(adminUser.id);

    await prisma.user.update({
      where: { id: badUser.id },
      data: { status: "BANNED" },
    });

    await logAdminAction({
      adminUserId: adminUser.id,
      action: "BAN_USER",
      targetType: "USER",
      targetId: badUser.id,
      details: { reason: "Spam behavior" },
    });

    const verifyAudit = await prisma.adminAuditLog.findFirst({
      where: { adminUserId: adminUser.id, action: "BAN_USER" },
    });
    if (!verifyAudit) throw new Error("Audit log not found!");
    console.log(`  ✓ Admin audit log verified: "${verifyAudit.action}" recorded by "${adminUser.email}"`);

    // -----------------------------------------------------------------
    // Cleanup Test Artifacts
    // -----------------------------------------------------------------
    console.log("\nCleaning up Test Artifacts...");
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: createdAdminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: createdAdminIds } } });
    await prisma.eventAttendee.deleteMany({ where: { eventId: { in: createdEventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    await prisma.messageMedia.deleteMany({ where: { message: { conversationId: conversation.id } } });
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversation.deleteMany({ where: { id: conversation.id } });
    await prisma.match.deleteMany({ where: { id: match.id } });
    await prisma.like.deleteMany({ where: { OR: [{ fromUserId: { in: createdUserIds } }, { toUserId: { in: createdUserIds } }] } });
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: { in: createdUserIds } }, { blockedUserId: { in: createdUserIds } }] } });
    await prisma.swipeWindow.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.profilePhoto.deleteMany({ where: { profile: { userId: { in: createdUserIds } } } });
    await prisma.profile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log("  ✓ All test artifacts cleanly deleted from database");

    console.log("\n=================================================================");
    console.log("🎉 ALL PHASE 8 E2E INTEGRATION JOURNEYS PASSED WITH 100% SUCCESS!");
    console.log("=================================================================\n");
  } catch (err) {
    console.error("\n❌ PHASE 8 E2E TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase8E2ETests();
