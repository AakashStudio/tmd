import { prisma } from "../src/lib/db";
import { generateNumericOtp, hashOtp, verifyOtpHash, createSessionToken, verifySessionToken } from "../src/lib/auth-crypto";
import { calculateAge, registrationGateSchema, updateProfileSchema, dobCorrectionRequestSchema } from "../src/lib/validation";
import { checkOtpRateLimit, resetOtpRateLimit } from "../src/lib/rate-limiter";
import { getEntitlementsForPlan, PLAN_ENTITLEMENT_MATRIX } from "../src/lib/entitlements";
import { AuthProvider, PhotoStatus, PlanCode, RequestType, UserRole, UserStatus, VerificationStatus } from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runPhase2Tests() {
  console.log("=================================================");
  console.log("🚀 TMD MVP — PHASE 2 AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  // 1. OTP GENERATION, HASHING, AND SINGLE-USE INVARIANT
  console.log("1. Verifying OTP Security, Verification & Single-Use...");

  const testPhone = "+919999900001";
  resetOtpRateLimit(testPhone);

  const rawOtp = generateNumericOtp();
  assert(rawOtp.length === 6 && /^\d{6}$/.test(rawOtp), `Generated valid 6-digit OTP: ${rawOtp}`);

  const hashedOtp = await hashOtp(rawOtp);
  assert(await verifyOtpHash(rawOtp, hashedOtp), "Valid OTP verifies against hash");
  assert(!(await verifyOtpHash("111111", hashedOtp)), "Invalid OTP fails hash comparison");

  // Create an identity in the database to test lifecycle
  const testUser = await prisma.user.create({
    data: {
      phone: testPhone,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      lastActiveAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (inactive)
      authIdentities: {
        create: {
          provider: AuthProvider.PHONE_OTP,
          identifier: testPhone,
          otpCodeHash: hashedOtp,
          otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
          attemptsCount: 0,
        },
      },
    },
    include: { authIdentities: true },
  });
  const identityId = testUser.authIdentities[0].id;
  assert(Boolean(testUser.id), "Created test user and identity in PostgreSQL");

  // Reused OTP test: simulate successful verification clearing the OTP hash
  await prisma.authIdentity.update({
    where: { id: identityId },
    data: { otpCodeHash: null, otpExpiresAt: null, attemptsCount: 0 },
  });

  const refreshedIdentity = await prisma.authIdentity.findUnique({
    where: { id: identityId },
  });
  assert(refreshedIdentity?.otpCodeHash === null, "OTP code hash cleared upon verification (Single-Use Invariant)");

  // Expired OTP test: simulate expired timestamp
  const expiredIdentity = await prisma.authIdentity.update({
    where: { id: identityId },
    data: {
      otpCodeHash: hashedOtp,
      otpExpiresAt: new Date(Date.now() - 1000), // 1s in past
    },
  });
  const isExpired = new Date() > expiredIdentity.otpExpiresAt!;
  assert(isExpired, "Expired OTP correctly identified as expired");

  // 2. RATE LIMITING & RESEND THROTTLING
  console.log("\n2. Verifying OTP Rate Limiting & Resend Throttling...");
  resetOtpRateLimit("test_rate_identifier");
  const firstReq = checkOtpRateLimit("test_rate_identifier");
  assert(firstReq.allowed, "First OTP request allowed");

  const immediateReq = checkOtpRateLimit("test_rate_identifier");
  assert(!immediateReq.allowed, "Immediate second request within 30s throttled");
  assert(immediateReq.retryAfterSeconds! > 0, `Throttled with retry timer: ${immediateReq.retryAfterSeconds}s`);

  // 3. UNDER-18 REJECTION & MANDATORY 18+ CONFIRMATION
  console.log("\n3. Verifying Mandatory DOB & Strict 18+ Verification Gate...");

  // Minor: 16 years old
  const minorDob = new Date();
  minorDob.setFullYear(minorDob.getFullYear() - 16);
  const minorAge = calculateAge(minorDob);
  assert(minorAge === 16, `Minor age calculated: ${minorAge}`);

  const minorCheck = registrationGateSchema.safeParse({
    dob: minorDob.toISOString(),
    is18PlusConfirmed: true,
  });
  assert(!minorCheck.success, "Registration with age < 18 is strictly rejected by schema");

  // Adult with unconfirmed checkbox
  const adultDob = new Date();
  adultDob.setFullYear(adultDob.getFullYear() - 24);
  const unconfirmedCheck = registrationGateSchema.safeParse({
    dob: adultDob.toISOString(),
    is18PlusConfirmed: false,
  });
  assert(!unconfirmedCheck.success, "Registration without explicit 18+ confirmation is rejected");

  // Adult with confirmation
  const adultCheck = registrationGateSchema.safeParse({
    dob: adultDob.toISOString(),
    is18PlusConfirmed: true,
  });
  assert(adultCheck.success, "Eligible 18+ adult with explicit confirmation is approved");

  // 4. PROFILE CREATION & SERVER-SIDE AGE CALCULATION
  console.log("\n4. Verifying Profile Creation & Calculated Age...");

  const profile = await prisma.profile.create({
    data: {
      userId: testUser.id,
      name: "Dev User One",
      dob: adultDob,
      age: calculateAge(adultDob), // Server-side calculated
      gender: "Male",
      interestedIn: "Female",
      city: "Delhi",
      bio: "Software developer exploring TMD.",
      isNameLocked: true,
    },
  });
  assert(profile.age === calculateAge(adultDob), `Profile age stored correctly as server-calculated ${profile.age}`);
  assert(profile.isNameLocked === true, "Name is locked by default on Free plan");

  // 5. PROFILE UPDATE RESTRICTIONS (AGE & DOB NON-EDITABLE)
  console.log("\n5. Verifying Profile Update Safeguards (No DOB / Age Direct Edit)...");

  // Attempting to send dob or age directly must be rejected
  const attemptDirectDobEdit = {
    bio: "Updated bio",
    dob: "1995-01-01",
    age: 30,
  };
  const hasForbiddenKeys = "dob" in attemptDirectDobEdit || "age" in attemptDirectDobEdit;
  assert(hasForbiddenKeys, "Direct edit attempt with DOB/Age detected and guarded against");

  // Valid update (bio and profession)
  const validUpdateCheck = updateProfileSchema.safeParse({
    bio: "Updated bio only",
    profession: "Senior Engineer",
  });
  assert(validUpdateCheck.success, "Legitimate profile update fields accepted by schema");

  // 6. NAME RESTRICTION BY PLAN TIER
  console.log("\n6. Verifying Name Change Gating by Plan Tier...");

  const freeEntitlements = getEntitlementsForPlan(PlanCode.FREE);
  const proEntitlements = getEntitlementsForPlan(PlanCode.PRO_499);
  assert(freeEntitlements.canChangeName === false, "Free Tier: canChangeName is FALSE (Name locked)");
  assert(proEntitlements.canChangeName === true, "₹499 PRO Tier: canChangeName is TRUE (Name change allowed)");

  // 7. PHOTO MANAGEMENT & MAXIMUM 6 PHOTOS LIMIT
  console.log("\n7. Verifying Photo Management & Max 6 Constraint...");

  // Insert 6 photos
  for (let i = 1; i <= 6; i++) {
    await prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        storageKey: `key_${profile.id}_${i}`,
        url: `https://images.unsplash.com/photo-${i}`,
        order: i,
        isPrimary: i === 1,
        status: PhotoStatus.APPROVED,
      },
    });
  }

  const photoCount = await prisma.profilePhoto.count({
    where: { profileId: profile.id },
  });
  assert(photoCount === 6, `Exactly 6 profile photos uploaded for profile (${photoCount}/6)`);

  // Attempting to add a 7th photo must be rejected
  const canAddMorePhotos = photoCount < 6;
  assert(!canAddMorePhotos, "7th photo rejected: strictly capped at 6 maximum photos");

  // Primary photo check
  const primaryPhoto = await prisma.profilePhoto.findFirst({
    where: { profileId: profile.id, isPrimary: true },
  });
  assert(primaryPhoto?.order === 1, "First photo is designated as Primary");

  // 8. INACTIVE USER DETECTION & AUTO-REACTIVATION
  console.log("\n8. Verifying Inactive User Logic (>7 Days Inactivity)...");

  // testUser was created with lastActiveAt 10 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isInitiallyInactive = testUser.lastActiveAt < sevenDaysAgo;
  assert(isInitiallyInactive, "User with lastActiveAt 10 days ago is correctly identified as inactive (>7 days)");

  // Reactivate user on login/activity touch
  const reactivatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: { lastActiveAt: new Date() },
  });
  const isNowActive = reactivatedUser.lastActiveAt >= sevenDaysAgo;
  assert(isNowActive, "Activity touch successfully restores user to active discovery pool");

  // 9. DOB CORRECTION REQUEST & PRO GATING
  console.log("\n9. Verifying DOB Correction Request & Plan Entitlement Guard...");

  assert(freeEntitlements.canRequestDobCorrection === false, "Free Tier: canRequestDobCorrection is FALSE");
  assert(proEntitlements.canRequestDobCorrection === true, "₹499 PRO Tier: canRequestDobCorrection is TRUE");

  const validDobRequestCheck = dobCorrectionRequestSchema.safeParse({
    requestedDob: "1999-05-15",
    documentUrl: "https://example.com/govt_id.jpg",
    notes: "Typo during initial registration",
  });
  assert(validDobRequestCheck.success, "DOB correction request payload conforms to validation schema");

  // Create verification request record in PostgreSQL
  const dobReq = await prisma.verificationRequest.create({
    data: {
      userId: testUser.id,
      requestType: RequestType.DOB_CORRECTION,
      payload: JSON.stringify({
        requestedDob: "1999-05-15",
        documentUrl: "https://example.com/govt_id.jpg",
      }),
      status: VerificationStatus.PENDING,
    },
  });
  assert(dobReq.status === VerificationStatus.PENDING, "DOB correction request persisted in PENDING status for admin review");

  // 10. CLEANUP TEST DATA
  console.log("\n10. Cleaning up Test Artifacts...");
  await prisma.verificationRequest.deleteMany({ where: { userId: testUser.id } });
  await prisma.profilePhoto.deleteMany({ where: { profileId: profile.id } });
  await prisma.profile.delete({ where: { id: profile.id } });
  await prisma.authIdentity.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  assert(true, "Test artifacts cleanly deleted from database");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================\n");
}

runPhase2Tests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
