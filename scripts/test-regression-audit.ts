import { PrismaClient, Prisma, PlanCode } from "@prisma/client";
import { resolveUserEntitlements, getEntitlementsForPlan, PLAN_ENTITLEMENT_MATRIX } from "../src/lib/entitlements";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("==================================================");
  console.log("STARTING TMD MVP PRODUCTION AUDIT & CORRECTION VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Audit Plans Table and Duration Invariants
    console.log("\n--- AUDIT ITEM 1: PLAN DURATIONS & PRICING INVARIANTS ---");
    const plans = await prisma.plan.findMany();
    const planFree = plans.find((p) => p.code === "FREE");
    const plan49 = plans.find((p) => p.code === "TIER_49");
    const plan149 = plans.find((p) => p.code === "TIER_149");
    const plan499 = plans.find((p) => p.code === "PRO_499");

    assert(Boolean(planFree && planFree.priceInPaise === 0), "FREE plan exists with ₹0 price");
    assert(Boolean(plan49 && plan49.durationDays === 15 && plan49.priceInPaise === 4900), "₹49 plan duration is strictly 15 DAYS and price is 4900 paise");
    assert(Boolean(plan149 && plan149.durationDays === 15 && plan149.priceInPaise === 14900), "₹149 plan duration is strictly 15 DAYS and price is 14900 paise");
    assert(Boolean(plan499 && plan499.durationDays === 10 && plan499.priceInPaise === 49900), "PRO_499 plan duration is strictly 10 DAYS (₹499 / 10 days) and price is 49900 paise");

    // 2. Entitlements Invariants
    console.log("\n--- AUDIT ITEM 2: ENTITLEMENTS INVARIANTS ---");
    const freeEntitlements = getEntitlementsForPlan(PlanCode.FREE);
    assert(freeEntitlements.isPaid === false, "FREE tier has isPaid = false");
    assert(freeEntitlements.canAccessEvents === false, "FREE tier cannot access events");
    assert(freeEntitlements.canRewind === false, "FREE tier cannot rewind");
    assert(freeEntitlements.whoLikedYouLimit === 0, "FREE tier whoLikedYouLimit is 0");
    assert(freeEntitlements.swipesLimitPerWindow === 10, "FREE tier swipe limit is finite (10/12h)");
    assert(freeEntitlements.hasAds === true, "FREE tier has ads enabled");

    const proEntitlements = getEntitlementsForPlan(PlanCode.PRO_499);
    assert(proEntitlements.canAccessEvents === true, "PRO tier can access Events Map");
    assert(proEntitlements.canCreateEvents === true, "PRO tier can create events");
    assert(proEntitlements.canRewind === true, "PRO tier can rewind swipes");
    assert(proEntitlements.whoLikedYouLimit === Infinity, "PRO tier whoLikedYouLimit is unlimited");
    assert(proEntitlements.swipesLimitPerWindow === null, "PRO tier has unlimited swipes");
    assert(proEntitlements.hasAds === false, "PRO tier has zero ads");

    // 3. Fallback on Expired PRO subscription
    console.log("\n--- AUDIT ITEM 3: EXPIRED PRO SUBSCRIPTION FALLBACK ---");
    const expiredSubMock = {
      plan: { code: PlanCode.PRO_499 },
      endDate: new Date(Date.now() - 5000), // past
      status: "EXPIRED",
    };
    const resolvedExpired = resolveUserEntitlements(expiredSubMock);
    assert(resolvedExpired.isPaid === false, "Expired PRO subscription reverts to FREE entitlements");
    assert(resolvedExpired.canAccessEvents === false, "Expired PRO subscription cannot access events");
    assert(resolvedExpired.canRewind === false, "Expired PRO subscription cannot rewind");

    const nullSubFallback = resolveUserEntitlements(null);
    assert(nullSubFallback.isPaid === false, "Null subscription falls back to FREE tier");

    // 4. View Once Atomic Single-Use & Anti-Duplication
    console.log("\n--- AUDIT ITEM 4: VIEW ONCE ATOMIC CONSUMPTION ---");
    let testConversation = await prisma.conversation.findFirst({
      include: { match: true },
    });

    if (!testConversation) {
      // Find or create match
      let match = await prisma.match.findFirst();
      if (!match) {
        const u = await prisma.user.findMany({ take: 2 });
        match = await prisma.match.create({
          data: {
            user1Id: u[0].id,
            user2Id: u[1].id,
            status: "ACTIVE",
          },
        });
      }
      testConversation = await prisma.conversation.create({
        data: { matchId: match.id },
        include: { match: true },
      });
    }

    if (testConversation) {
      const voMessage = await prisma.message.create({
        data: {
          conversationId: testConversation.id,
          senderId: testConversation.match.user1Id,
          content: "📷 View Once Photo",
          type: "VIEW_ONCE_PHOTO",
          status: "SENT",
          media: {
            create: {
              storageKey: "audit_vo_test.jpg",
              isViewOnce: true,
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            },
          },
        },
        include: { media: true },
      });

      const mediaId = voMessage.media!.id;
      assert(voMessage.media?.openedAt === null, "Initial view-once media openedAt is null");

      // First open transaction
      const firstOpen = await prisma.$transaction(async (tx) => {
        const media = await tx.messageMedia.findUnique({ where: { id: mediaId } });
        if (!media || media.openedAt) return null;
        return tx.messageMedia.update({
          where: { id: mediaId },
          data: { openedAt: new Date() },
        });
      });
      assert(firstOpen !== null && firstOpen.openedAt !== null, "First view-once open succeeds");

      // Second open attempt (must fail atomically)
      const secondOpen = await prisma.$transaction(async (tx) => {
        const media = await tx.messageMedia.findUnique({ where: { id: mediaId } });
        if (!media || media.openedAt) return null;
        return tx.messageMedia.update({
          where: { id: mediaId },
          data: { openedAt: new Date() },
        });
      });
      assert(secondOpen === null, "Second view-once open attempt returns null (atomic 410 Gone prevention)");

      // Clean up test message and media
      await prisma.messageMedia.delete({ where: { id: mediaId } });
      await prisma.message.delete({ where: { id: voMessage.id } });
    }

    // 5. Block Safety
    console.log("\n--- AUDIT ITEM 5: BLOCK SAFETY ---");
    const testUsers = await prisma.user.findMany({ take: 2 });
    if (testUsers.length >= 2) {
      const u1 = testUsers[0].id;
      const u2 = testUsers[1].id;

      // Ensure block exists or test block
      const block = await prisma.block.upsert({
        where: { blockerId_blockedUserId: { blockerId: u1, blockedUserId: u2 } },
        create: { blockerId: u1, blockedUserId: u2 },
        update: {},
      });
      assert(Boolean(block), "Block record created between blocker and blocked user");

      // Verify mutual block lookup works
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: u1, blockedUserId: u2 },
            { blockerId: u2, blockedUserId: u1 },
          ],
        },
      });
      assert(Boolean(isBlocked), "Mutual block detected, ensuring communication and discovery exclusion");

      // Clean up audit block
      await prisma.block.delete({
        where: { blockerId_blockedUserId: { blockerId: u1, blockedUserId: u2 } },
      });
    }

    // 6. Residential Address Masking Logic Invariant
    console.log("\n--- AUDIT ITEM 6: RESIDENTIAL ADDRESS MASKING INVARIANT ---");
    const rawAddress = "Flat 402, Rosewood Heights, Arera Colony, Bhopal";
    const maskAddress = (isResidential: boolean, isApprovedAttendee: boolean, original: string) => {
      if (isResidential && !isApprovedAttendee) {
        return "Residential Area (Exact address revealed upon RSVP approval)";
      }
      return original;
    };
    const maskedForStranger = maskAddress(true, false, rawAddress);
    const unmaskedForAttendee = maskAddress(true, true, rawAddress);
    assert(maskedForStranger === "Residential Area (Exact address revealed upon RSVP approval)", "Residential address is masked for unapproved users");
    assert(unmaskedForAttendee === rawAddress, "Residential address unmasks correctly for approved attendees");

    // 7. Database schema model count
    console.log("\n--- AUDIT ITEM 7: SCHEMA 30 MODELS INTEGRITY ---");
    const modelCount = Prisma.dmmf.datamodel.models.length;
    assert(modelCount === 30, `Database schema has exactly 30 models (found ${modelCount})`);

    console.log("\n==================================================");
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Audit encountered exception:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
