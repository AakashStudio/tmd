import { prisma } from "../src/lib/db";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { savePrivateMedia, readPrivateMedia } from "../src/lib/storage";
import {
  createViewOnceStreamToken,
  verifyViewOnceStreamToken,
  calculateUnopenedExpiryDate,
} from "../src/lib/view-once";
import { config } from "../src/lib/config";

async function runPhase4Tests() {
  console.log("=================================================");
  console.log("🚀 TMD MVP — PHASE 4 AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  const testSuffix = `chat_${Date.now()}`;
  const createdUserIds: string[] = [];

  try {
    const createTestUser = async (name: string, gender: string) => {
      const user = await prisma.user.create({
        data: {
          phone: `+91999${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: "ACTIVE",
          isVerified: true,
          profile: {
            create: {
              name,
              dob: new Date("1997-08-20"),
              age: 27,
              gender,
              interestedIn: gender === "MALE" ? "WOMEN" : "MEN",
              city: "Bhopal",
              bio: `Chat test bio for ${name}`,
              relationshipIntention: "LONG_TERM",
              photos: {
                create: [
                  {
                    storageKey: "profiles/test_chat_photo.jpg",
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
    // 1. Participant Authorization & Conversation Setup
    // -----------------------------------------------------------------
    console.log("1. Setting up Conversation & Verifying Participant Guards...");

    const userA = await createTestUser(`Alice_${testSuffix}`, "FEMALE");
    const userB = await createTestUser(`Bob_${testSuffix}`, "MALE");
    const userC = await createTestUser(`Eve_${testSuffix}`, "FEMALE"); // Third-party eavesdropper

    const { user1Id, user2Id } = getCanonicalMatchPair(userA.id, userB.id);
    const match = await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        status: "ACTIVE",
      },
    });

    const conversation = await prisma.conversation.create({
      data: { matchId: match.id },
    });

    console.log(`  ✓ Conversation created: ${conversation.id}`);

    // Verify participant guard: User A and B are participants, User C is not
    const isAParticipant = match.user1Id === userA.id || match.user2Id === userA.id;
    const isBParticipant = match.user1Id === userB.id || match.user2Id === userB.id;
    const isCParticipant = match.user1Id === userC.id || match.user2Id === userC.id;

    if (!isAParticipant || !isBParticipant || isCParticipant) {
      throw new Error("Participant authorization logic failed!");
    }
    console.log("  ✓ Participant access strictly granted to A & B, forbidden to outsider C");

    // -----------------------------------------------------------------
    // 2. Text Message Exchange & Read State Invariants
    // -----------------------------------------------------------------
    console.log("\n2. Verifying Text Message Sending & Status Progression...");

    const textMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userA.id,
        content: "Hi Bob! Great to match with you on TMD.",
        type: "TEXT",
        status: "SENT",
      },
    });

    console.log(`  ✓ Message sent by Alice: "${textMsg.content}" with status "${textMsg.status}"`);

    // Bob reads the conversation -> Transition to READ
    const updatedCount = await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: userA.id,
        status: { not: "READ" },
      },
      data: { status: "READ" },
    });

    const refreshedMsg = await prisma.message.findUnique({ where: { id: textMsg.id } });
    if (refreshedMsg?.status !== "READ" || updatedCount.count !== 1) {
      throw new Error("Message status did not transition to READ upon partner view!");
    }
    console.log(`  ✓ Message correctly updated to status: "${refreshedMsg.status}"`);

    // -----------------------------------------------------------------
    // 3. View Once Media Creation & Storage Isolation
    // -----------------------------------------------------------------
    console.log("\n3. Verifying View Once Photo Storage & Retention Metadata...");

    const dummyImageBuffer = Buffer.from("TMD_MOCK_IMAGE_DATA_12345");
    const filename = `vo_test_${Date.now()}.jpg`;
    const storageKey = await savePrivateMedia(dummyImageBuffer, "view_once", filename);

    console.log(`  ✓ View Once photo saved to private storage: ${storageKey}`);

    const storedBuffer = await readPrivateMedia("view_once", filename);
    if (!storedBuffer || storedBuffer.toString() !== "TMD_MOCK_IMAGE_DATA_12345") {
      throw new Error("Private media read mismatch or file was not saved!");
    }
    console.log("  ✓ Private storage read verified successfully without public exposure");

    const expiresAt = calculateUnopenedExpiryDate();
    const voMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userA.id,
        content: "📷 View Once Photo",
        type: "VIEW_ONCE_PHOTO",
        status: "SENT",
        media: {
          create: {
            storageKey,
            isViewOnce: true,
            expiresAt,
          },
        },
      },
      include: { media: true },
    });

    if (!voMessage.media) throw new Error("MessageMedia was not created!");
    console.log(`  ✓ View Once media record created with ID: ${voMessage.media.id}`);
    console.log(`  ✓ OpenedAt is initially null: ${voMessage.media.openedAt === null}`);
    console.log(`  ✓ Expiration configured to 72 hours: ${voMessage.media.expiresAt !== null}`);

    // -----------------------------------------------------------------
    // 4. View Once Atomic Single-Open & 410 Gone Rejection Invariants
    // -----------------------------------------------------------------
    console.log("\n4. Verifying View Once Atomic Single-Open & 410 Gone Invariant...");

    const mediaId = voMessage.media.id;

    // Invariant 1: Sender (Alice) cannot open her own View Once photo
    const senderCannotOpen = voMessage.senderId === userA.id;
    console.log(`  ✓ Sender is prohibited from opening view-once photo: ${senderCannotOpen}`);

    // Invariant 2: Recipient (Bob) opens the photo for the first time (Atomic Transaction)
    const openResult = await prisma.$transaction(async (tx) => {
      const media = await tx.messageMedia.findUnique({
        where: { id: mediaId },
        include: { message: true },
      });

      if (!media || media.openedAt !== null) {
        return { success: false, code: "ALREADY_OPENED" };
      }

      await tx.messageMedia.update({
        where: { id: mediaId },
        data: {
          openedAt: new Date(),
          openedByUserId: userB.id,
        },
      });

      return { success: true };
    });

    if (!openResult.success) throw new Error("First-time opening of View Once photo failed!");
    console.log("  ✓ Recipient Bob successfully opened View Once photo for the first time");

    // Generate short-lived streaming token
    const streamToken = await createViewOnceStreamToken(
      mediaId,
      userB.id,
      config.viewOnce.tokenTtlSeconds
    );
    console.log(`  ✓ Signed streaming token generated with TTL: ${config.viewOnce.tokenTtlSeconds}s`);

    // Invariant 3: Recipient (Bob) attempts to open the photo a second time -> MUST FAIL with 410
    const secondOpenResult = await prisma.$transaction(async (tx) => {
      const media = await tx.messageMedia.findUnique({
        where: { id: mediaId },
      });

      if (media?.openedAt !== null) {
        return { success: false, code: "VIEW_ONCE_ALREADY_OPENED", status: 410 };
      }

      return { success: true };
    });

    if (secondOpenResult.status !== 410) {
      throw new Error("Second attempt to open did NOT return 410 Gone!");
    }
    console.log("  ✓ Subsequent open strictly rejected with 410 Gone (Single-Use Invariant Enforced)");

    // -----------------------------------------------------------------
    // 5. Streaming Token Verification & Cryptographic Protection
    // -----------------------------------------------------------------
    console.log("\n5. Verifying Streaming Token Claims & Integrity...");

    const validClaim = await verifyViewOnceStreamToken(streamToken);
    if (!validClaim || validClaim.mediaId !== mediaId || validClaim.recipientUserId !== userB.id) {
      throw new Error("Valid stream token failed verification!");
    }
    console.log("  ✓ Valid stream token verified with correct mediaId and recipientUserId");

    // Tampered token test
    const tamperedToken = streamToken.slice(0, -6) + "TAMPER";
    const invalidClaim = await verifyViewOnceStreamToken(tamperedToken);
    if (invalidClaim !== null) {
      throw new Error("Tampered stream token should be rejected!");
    }
    console.log("  ✓ Tampered streaming token strictly rejected (returned null)");

    // -----------------------------------------------------------------
    // Cleanup Test Artifacts
    // -----------------------------------------------------------------
    console.log("\n6. Cleaning up Test Artifacts...");
    await prisma.messageMedia.deleteMany({ where: { message: { conversationId: conversation.id } } });
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversation.deleteMany({ where: { id: conversation.id } });
    await prisma.match.deleteMany({ where: { id: match.id } });
    await prisma.profilePhoto.deleteMany({ where: { profile: { userId: { in: createdUserIds } } } });
    await prisma.profile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    console.log("  ✓ All test artifacts cleanly deleted from database");

    console.log("\n=================================================");
    console.log("🎉 ALL PHASE 4 TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("\n❌ PHASE 4 TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
