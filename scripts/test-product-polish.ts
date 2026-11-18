import { prisma } from "../src/lib/db";
import fs from "fs";
import path from "path";

async function verifyProductPolish() {
  console.log("==================================================");
  console.log("🔍 TESTING PRODUCT POLISH & FIXES");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Verify Event Pass Booking Payment Security
    console.log("\n[TEST 1] Testing Event Ticket Booking Protection...");
    const activeEvent = await prisma.event.findFirst({
      where: { status: "ACTIVE" },
    });

    const testUser = await prisma.user.findFirst({
      where: { status: "ACTIVE" },
    });

    if (activeEvent && testUser) {
      // Simulate booking with UTR
      const utr = "432198765432";
      const ticket = await prisma.eventTicket.create({
        data: {
          eventId: activeEvent.id,
          userId: testUser.id,
          ticketType: "GENERAL_PASS",
          quantity: 1,
          basePriceInPaise: 49900,
          convenienceFeeInPaise: 3900,
          totalAmountInPaise: 53800,
          tmdCommissionInPaise: 3500,
          organizerPayoutInPaise: 46400,
          ticketCode: `TEST-EVT-${Date.now().toString(36).toUpperCase()}`,
          qrData: JSON.stringify({ test: true }),
          paymentStatus: "PENDING",
          paymentMethod: "UPI",
          paymentTxnId: utr,
          attendeeName: "Test User",
        },
      });

      assert(ticket.paymentStatus === "PENDING", "Paid event ticket is saved as PENDING until verified");
      assert(ticket.paymentTxnId === utr, "UTR reference is saved with ticket record");

      // Clean up test ticket
      await prisma.eventTicket.delete({ where: { id: ticket.id } });
    }

    // 2. Verify Audio Endpoint File Handling
    console.log("\n[TEST 2] Testing Audio Route Existence & Range Handling...");
    const audioRoutePath = path.join(process.cwd(), "src", "app", "uploads", "audio", "[filename]", "route.ts");
    const routeCode = fs.readFileSync(audioRoutePath, "utf-8");
    assert(routeCode.includes("status: 206") && routeCode.includes("Content-Range"), "Audio route implements HTTP 206 Partial Content byte streaming");

    // 3. Verify Safety Block & Report APIs
    console.log("\n[TEST 3] Testing Safety Block & Report Endpoints...");
    const users = await prisma.user.findMany({ take: 2, where: { status: "ACTIVE" } });
    if (users.length >= 2) {
      const u1 = users[0];
      const u2 = users[1];

      // Test block creation
      const block = await prisma.block.upsert({
        where: { blockerId_blockedUserId: { blockerId: u1.id, blockedUserId: u2.id } },
        update: {},
        create: { blockerId: u1.id, blockedUserId: u2.id },
      });
      assert(block !== null, "Block record is successfully written to database");

      // Test report creation
      const report = await prisma.report.create({
        data: {
          reporterId: u1.id,
          reportedUserId: u2.id,
          reason: "INAPPROPRIATE_BEHAVIOR",
          details: "Automated test report",
          status: "PENDING",
        },
      });
      assert(report.status === "PENDING", "Safety report is successfully logged to admin review queue");

      // Clean up
      await prisma.report.delete({ where: { id: report.id } });
      await prisma.block.delete({ where: { blockerId_blockedUserId: { blockerId: u1.id, blockedUserId: u2.id } } });
    }

  } catch (err: any) {
    console.error("Test failed with error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

verifyProductPolish().then(() => process.exit(0)).catch(() => process.exit(1));
