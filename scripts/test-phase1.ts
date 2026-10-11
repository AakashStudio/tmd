import { Prisma } from "@prisma/client";
import { config, validateEnv } from "../src/lib/config";
import {
  generateNumericOtp,
  hashOtp,
  verifyOtpHash,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth-crypto";
import {
  calculateAge,
  sendOtpSchema,
  verifyOtpSchema,
  registrationGateSchema,
  updateProfileSchema,
  createEventSchema,
} from "../src/lib/validation";
import {
  PLAN_ENTITLEMENT_MATRIX,
  getEntitlementsForPlan,
  resolveUserEntitlements,
} from "../src/lib/entitlements";
import { getCurrentSwipeWindow } from "../src/lib/swipe-window";
import {
  createViewOnceStreamToken,
  verifyViewOnceStreamToken,
  calculateUnopenedExpiryDate,
} from "../src/lib/view-once";
import { getCanonicalMatchPair } from "../src/lib/match-helper";
import { PlanCode } from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 TMD MVP — PHASE 1 AUTOMATED VERIFICATION SUITE");
  console.log("=================================================\n");

  // 1. CONFIGURATION LOADING
  console.log("1. Verifying Configuration Loading...");
  assert(validateEnv(), "Environment variables validate against Zod schema");
  assert(config.app.timezone === "Asia/Kolkata", "Default APP_TIMEZONE is Asia/Kolkata");
  assert(config.viewOnce.tokenTtlSeconds === 60, "Configurable VIEW_ONCE_TOKEN_TTL_SECONDS loaded");
  assert(config.viewOnce.unopenedExpiryHours === 72, "Configurable VIEW_ONCE_UNOPENED_EXPIRY_HOURS loaded");
  assert(config.auth.sessionTtlSeconds === 2592000, "Auth session TTL is 30 days");

  // 2. PRISMA SCHEMA & 30 RELATIONAL MODELS VERIFICATION
  console.log("\n2. Verifying Prisma Schema & 30 Models in DMMF Metadata...");
  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;
  const modelNames = models.map((m) => m.name);

  const expected30Models = [
    "User",
    "AuthIdentity",
    "Profile",
    "ProfilePhoto",
    "Preference",
    "Interest",
    "ProfileInterest",
    "Language",
    "ProfileLanguage",
    "Like",
    "Pass",
    "SwipeWindow",
    "Match",
    "Conversation",
    "Message",
    "MessageMedia",
    "Plan",
    "Subscription",
    "Payment",
    "PaymentEvent",
    "Event",
    "EventAttendee",
    "Organizer",
    "Report",
    "Block",
    "VerificationRequest",
    "PushToken",
    "SupportTicket",
    "AdminUser",
    "AdminAuditLog",
  ];

  assert(models.length === 30, `Expected exactly 30 models in Prisma DMMF, found ${models.length}`);

  for (const name of expected30Models) {
    assert(modelNames.includes(name), `Prisma schema contains model '${name}'`);
  }

  // Verify key foreign keys and composite unique constraints
  const swipeWindow = models.find((m) => m.name === "SwipeWindow");
  assert(
    Boolean(swipeWindow?.uniqueFields?.some((fields) => fields.includes("userId") && fields.includes("windowStart"))),
    "SwipeWindow has composite unique constraint [userId, windowStart]"
  );

  const likeModel = models.find((m) => m.name === "Like");
  assert(
    Boolean(likeModel?.uniqueFields?.some((fields) => fields.includes("fromUserId") && fields.includes("toUserId"))),
    "Like has composite unique constraint [fromUserId, toUserId]"
  );

  const matchModel = models.find((m) => m.name === "Match");
  assert(
    Boolean(matchModel?.uniqueFields?.some((fields) => fields.includes("user1Id") && fields.includes("user2Id"))),
    "Match has composite unique constraint [user1Id, user2Id]"
  );

  // Canonical Match Pair ordering verification
  const pair1 = getCanonicalMatchPair("user_alpha", "user_beta");
  const pair2 = getCanonicalMatchPair("user_beta", "user_alpha");
  assert(
    pair1.user1Id === "user_alpha" && pair1.user2Id === "user_beta",
    "getCanonicalMatchPair orders lexicographically when given (A, B)"
  );
  assert(
    pair2.user1Id === "user_alpha" && pair2.user2Id === "user_beta",
    "getCanonicalMatchPair produces identical canonical order when given (B, A)"
  );
  assert(
    pair1.user1Id === pair2.user1Id && pair1.user2Id === pair2.user2Id,
    "Match A->B and B->A resolve to the identical unique DB pair, preventing duplicate match records"
  );

  const messageMedia = models.find((m) => m.name === "MessageMedia");
  assert(
    Boolean(messageMedia?.fields.find((f) => f.name === "messageId" && f.isUnique)),
    "MessageMedia has 1:1 unique relation to Message"
  );

  // 3. AUTH CRYPTO & SESSION MANAGEMENT
  console.log("\n3. Verifying Session & Cryptographic Utilities...");
  const otp = generateNumericOtp();
  assert(otp.length === 6 && /^\d{6}$/.test(otp), `Generated OTP is 6 numeric digits: ${otp}`);

  const hashedOtp = await hashOtp(otp);
  assert(await verifyOtpHash(otp, hashedOtp), "OTP hash comparison matches with correct OTP");
  assert(!(await verifyOtpHash("000000", hashedOtp)), "OTP hash comparison fails with incorrect OTP");

  const adminPass = "TestPassword#123";
  const hashedPass = await hashPassword(adminPass);
  assert(await verifyPassword(adminPass, hashedPass), "Password hash comparison matches");

  const sessionToken = await createSessionToken({
    userId: "usr_test_123",
    role: "USER",
    status: "ACTIVE",
  });
  assert(typeof sessionToken === "string" && sessionToken.length > 50, "Session token successfully signed");

  const decodedSession = await verifySessionToken(sessionToken);
  assert(decodedSession?.userId === "usr_test_123", "Session token successfully verified and decoded");

  const invalidSession = await verifySessionToken(sessionToken + "corrupted");
  assert(invalidSession === null, "Corrupted session token returns null");

  // 4. AGE & DOB VALIDATION & 18+ ENFORCEMENT
  console.log("\n4. Verifying Age Calculation & 18+ Enforcement...");
  const adultDob = new Date("2000-01-01");
  const minorDob = new Date("2015-01-01");
  const exact18Dob = new Date();
  exact18Dob.setFullYear(exact18Dob.getFullYear() - 18);

  const calculatedAdultAge = calculateAge(adultDob);
  assert(calculatedAdultAge >= 25, `Adult age calculated accurately: ${calculatedAdultAge}`);

  const calculatedMinorAge = calculateAge(minorDob);
  assert(calculatedMinorAge < 18, `Minor age calculated accurately: ${calculatedMinorAge}`);

  const adultGateResult = registrationGateSchema.safeParse({
    dob: adultDob.toISOString(),
    is18PlusConfirmed: true,
  });
  assert(adultGateResult.success === true, "18+ adult passes registration gate");

  const minorGateResult = registrationGateSchema.safeParse({
    dob: minorDob.toISOString(),
    is18PlusConfirmed: true,
  });
  assert(minorGateResult.success === false, "Under 18 is strictly rejected by registration gate");

  const unconfirmedGateResult = registrationGateSchema.safeParse({
    dob: adultDob.toISOString(),
    is18PlusConfirmed: false,
  });
  assert(unconfirmedGateResult.success === false, "Unconfirmed 18+ checkbox is strictly rejected");

  // 5. SERVER-SIDE ENTITLEMENT CALCULATIONS (ALL 4 PLANS)
  console.log("\n5. Verifying Entitlement Calculations for all 4 Plans...");

  // FREE
  const freeEntitlements = getEntitlementsForPlan(PlanCode.FREE);
  assert(freeEntitlements.swipesLimitPerWindow === 10, "Free: Exactly 10 swipes per 12h window");
  assert(freeEntitlements.canRewind === false, "Free: Rewind is strictly false");
  assert(freeEntitlements.whoLikedYouLimit === 0, "Free: Who Liked You is locked (0)");
  assert(freeEntitlements.canSelectCity === false, "Free: City selection is false");
  assert(freeEntitlements.canUseDistanceFilter === false, "Free: Distance filter is false");
  assert(freeEntitlements.hasAds === true, "Free: Has ads is true");
  assert(freeEntitlements.canAccessEvents === false, "Free: Events access is false");
  assert(freeEntitlements.canChangeName === false, "Free: Name change is false");
  assert(freeEntitlements.canRequestDobCorrection === false, "Free: DOB correction is false");

  // TIER_49
  const tier49Entitlements = getEntitlementsForPlan(PlanCode.TIER_49);
  assert(tier49Entitlements.swipesLimitPerWindow === null, "₹49: Unlimited swipes");
  assert(tier49Entitlements.canRewind === false, "₹49: Rewind is false");
  assert(tier49Entitlements.whoLikedYouLimit === 10, "₹49: First 10 Who Liked You allowed");
  assert(tier49Entitlements.canSelectCity === false, "₹49: City selection is false");
  assert(tier49Entitlements.hasAds === true, "₹49: Has ads is true");
  assert(tier49Entitlements.canAccessEvents === false, "₹49: Events access is false");

  // TIER_149
  const tier149Entitlements = getEntitlementsForPlan(PlanCode.TIER_149);
  assert(tier149Entitlements.swipesLimitPerWindow === null, "₹149: Unlimited swipes");
  assert(tier149Entitlements.canRewind === true, "₹149: Rewind is true");
  assert(tier149Entitlements.whoLikedYouLimit === Infinity, "₹149: Unlimited Who Liked You");
  assert(tier149Entitlements.canSelectCity === true, "₹149: City selection is true");
  assert(tier149Entitlements.canUseDistanceFilter === true, "₹149: Distance filter is true");
  assert(tier149Entitlements.hasAds === false, "₹149: Ads are removed (false)");
  assert(tier149Entitlements.canAccessEvents === false, "₹149: Events access is false");
  assert(tier149Entitlements.canChangeName === false, "₹149: Name change is false");

  // PRO_499
  const pro499Entitlements = getEntitlementsForPlan(PlanCode.PRO_499);
  assert(pro499Entitlements.isPro === true, "₹499: isPro is true");
  assert(pro499Entitlements.swipesLimitPerWindow === null, "₹499: Unlimited swipes");
  assert(pro499Entitlements.canRewind === true, "₹499: Rewind is true");
  assert(pro499Entitlements.canAccessEvents === true, "₹499: Events access is true");
  assert(pro499Entitlements.canJoinEvents === true, "₹499: Can join events");
  assert(pro499Entitlements.canCreateEvents === true, "₹499: Can create events");
  assert(pro499Entitlements.canChangeName === true, "₹499: Can change name is true");
  assert(pro499Entitlements.canRequestDobCorrection === true, "₹499: Can request DOB correction is true");

  // Subscription expiration fallback to Free
  const expiredSubscription = {
    plan: { code: PlanCode.PRO_499 },
    endDate: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
    status: "ACTIVE",
  };
  const fallbackEntitlements = resolveUserEntitlements(expiredSubscription);
  assert(fallbackEntitlements.planCode === PlanCode.FREE, "Expired PRO subscription correctly falls back to Free tier");

  // 6. 12-HOUR SWIPE WINDOW CALCULATION
  console.log("\n6. Verifying 12-Hour Swipe Window Calculation...");
  // Test morning time in Asia/Kolkata (e.g. 09:30 AM local)
  const morningDate = new Date("2026-10-05T04:00:00Z"); // 04:00 UTC = 09:30 IST
  const morningWindow = getCurrentSwipeWindow(morningDate, "Asia/Kolkata");
  assert(morningWindow.timezone === "Asia/Kolkata", "Window timezone is Asia/Kolkata");
  assert(morningWindow.secondsUntilReset > 0 && morningWindow.secondsUntilReset <= 12 * 3600, "Reset seconds within valid 12h range");
  assert(
    morningWindow.windowEnd.getTime() - morningWindow.windowStart.getTime() === 12 * 3600 * 1000,
    "Window duration is exactly 12 hours"
  );

  // Test evening time in Asia/Kolkata (e.g. 19:30 local)
  const eveningDate = new Date("2026-10-05T14:00:00Z"); // 14:00 UTC = 19:30 IST
  const eveningWindow = getCurrentSwipeWindow(eveningDate, "Asia/Kolkata");
  assert(
    eveningWindow.windowStart.getTime() !== morningWindow.windowStart.getTime(),
    "Morning and evening on the same day map to two distinct 12h windows"
  );

  // 7. VIEW ONCE SECURITY PARAMETERS
  console.log("\n7. Verifying View Once Security Parameters & Streaming Tokens...");
  const streamToken = await createViewOnceStreamToken("media_xyz123", "usr_recipient456", 60);
  assert(typeof streamToken === "string", "Generated View Once stream token");

  const verifiedClaim = await verifyViewOnceStreamToken(streamToken);
  assert(verifiedClaim?.mediaId === "media_xyz123", "View Once claim verified with correct mediaId");
  assert(verifiedClaim?.recipientUserId === "usr_recipient456", "View Once claim verified with correct recipientUserId");
  assert(verifiedClaim?.scope === "VIEW_ONCE_STREAM", "View Once claim scope matches");

  const corruptedViewOnce = await verifyViewOnceStreamToken(streamToken + "bad");
  assert(corruptedViewOnce === null, "Corrupted View Once token rejected");

  const expiryDate = calculateUnopenedExpiryDate(new Date(), 72);
  const diffHours = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60);
  assert(Math.round(diffHours) === 72, "Unopened expiry calculates correctly to 72 hours");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 1 VERIFICATION CHECKS PASSED!");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
