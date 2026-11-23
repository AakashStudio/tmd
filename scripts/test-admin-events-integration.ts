import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { POST as adminLogin } from "../src/app/api/admin/login/route";
import { GET as getDashboard } from "../src/app/api/admin/dashboard/route";
import { GET as getReports } from "../src/app/api/admin/reports/route";
import { PATCH as updateReport } from "../src/app/api/admin/reports/[id]/route";
import { GET as getVerifications } from "../src/app/api/admin/verifications/route";
import { PATCH as updateVerification } from "../src/app/api/admin/verifications/[id]/route";
import { GET as getAuditLogs } from "../src/app/api/admin/audit-logs/route";

import { GET as getEvents, POST as createEvent } from "../src/app/api/events/route";
import { GET as getEventDetails } from "../src/app/api/events/[id]/route";
import { POST as joinEvent } from "../src/app/api/events/[id]/join/route";
import { POST as reviewAttendee } from "../src/app/api/events/[id]/review-attendee/route";

import { hashPassword, createSessionToken } from "../src/lib/auth-crypto";
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from "../src/lib/admin-session";
import { config } from "../src/lib/config";

const prisma = new PrismaClient();

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runAdminAndEventsIntegrationSuite() {
  console.log("=================================================");
  console.log("🚀 TMD DIRECT HTTP INTEGRATION: ADMIN & EVENTS");
  console.log("=================================================\n");

  const ts = Date.now();
  let adminId: string | null = null;
  let adminToken: string = "";
  let proUserId: string | null = null;
  let proUserToken: string = "";
  let freeUserId: string | null = null;
  let freeUserToken: string = "";
  let secondaryProUserId: string | null = null;
  let secondaryProUserToken: string = "";
  let createdEventId: string | null = null;
  let testReportId: string | null = null;
  let testVerificationId: string | null = null;

  try {
    // ---------------------------------------------------
    // SETUP SEED DATA
    // ---------------------------------------------------
    console.log("0. Setting Up Isolated Test Fixtures...");
    const hashedAdminPw = await hashPassword("AdminSecretPassword123!");
    const adminUser = await prisma.adminUser.create({
      data: {
        email: `sec_admin_${ts}@thematchdate.com`,
        name: "Security Admin",
        role: "SUPER_ADMIN",
        passwordHash: hashedAdminPw,
        isActive: true,
      },
    });
    adminId = adminUser.id;
    adminToken = await createAdminSessionToken({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    // Create PRO user (Organizer)
    const proPlan = await prisma.plan.findFirst({ where: { code: "PRO_499" } });
    if (!proPlan) throw new Error("PRO_499 plan not found in database");

    const proUser = await prisma.user.create({
      data: {
        phone: `+91991${ts.toString().slice(-7)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Organizer PRO User",
            dob: new Date("1995-05-15"),
            age: 29,
            gender: "MALE",
            interestedIn: "FEMALE",
            city: "Indore",
          },
        },
        subscriptions: {
          create: {
            planId: proPlan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 86400000),
          },
        },
      },
    });
    proUserId = proUser.id;
    proUserToken = await createSessionToken({
      userId: proUser.id,
      phone: proUser.phone,
      role: "USER",
      status: "ACTIVE",
    });

    // Create Free User (Unauthorized for PRO Events)
    const freeUser = await prisma.user.create({
      data: {
        phone: `+91992${ts.toString().slice(-7)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Free Non-PRO User",
            dob: new Date("1998-01-20"),
            age: 26,
            gender: "FEMALE",
            interestedIn: "MALE",
            city: "Indore",
          },
        },
      },
    });
    freeUserId = freeUser.id;
    freeUserToken = await createSessionToken({
      userId: freeUser.id,
      phone: freeUser.phone,
      role: "USER",
      status: "ACTIVE",
    });

    // Create Secondary PRO User (Attendee / Cross-User testing)
    const secondaryProUser = await prisma.user.create({
      data: {
        phone: `+91993${ts.toString().slice(-7)}`,
        status: "ACTIVE",
        profile: {
          create: {
            name: "Secondary PRO Attendee",
            dob: new Date("1996-03-10"),
            age: 28,
            gender: "FEMALE",
            interestedIn: "MALE",
            city: "Indore",
          },
        },
        subscriptions: {
          create: {
            planId: proPlan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 86400000),
          },
        },
      },
    });
    secondaryProUserId = secondaryProUser.id;
    secondaryProUserToken = await createSessionToken({
      userId: secondaryProUser.id,
      phone: secondaryProUser.phone,
      role: "USER",
      status: "ACTIVE",
    });

    console.log("  ✓ Test users and admin fixtures initialized cleanly.");

    // ---------------------------------------------------
    // 1. ADMIN AUTHENTICATION (POST /api/admin/login)
    // ---------------------------------------------------
    console.log("\n1. Testing Admin Authentication (POST /api/admin/login)...");
    
    // 1.1 Validation failure: Missing email/password
    const emptyLoginReq = new NextRequest("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const emptyLoginRes = await adminLogin(emptyLoginReq);
    assert(emptyLoginRes.status === 400, "Missing credentials returns 400 Bad Request");

    // 1.2 Invalid password
    const wrongPwReq = new NextRequest("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminUser.email,
        password: "WrongPassword999!",
      }),
    });
    const wrongPwRes = await adminLogin(wrongPwReq);
    assert(wrongPwRes.status === 401, "Invalid password returns 401 Unauthorized");

    // 1.3 Valid credentials
    const validLoginReq = new NextRequest("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminUser.email,
        password: "AdminSecretPassword123!",
      }),
    });
    const validLoginRes = await adminLogin(validLoginReq);
    assert(validLoginRes.status === 200, "Valid admin login returns 200 OK");
    const loginData = await validLoginRes.json();
    assert(loginData.success === true && loginData.admin.id === adminUser.id, "Login response returns success and admin profile");

    // ---------------------------------------------------
    // 2. ADMIN DASHBOARD (GET /api/admin/dashboard)
    // ---------------------------------------------------
    console.log("\n2. Testing Admin Dashboard (GET /api/admin/dashboard)...");

    // 2.1 Unauthenticated access
    const unauthDashReq = new NextRequest("http://localhost:3000/api/admin/dashboard", {
      method: "GET",
    });
    const unauthDashRes = await getDashboard(unauthDashReq);
    assert(unauthDashRes.status === 401, "Unauthenticated dashboard request returns 401 Unauthorized");

    // 2.2 Tampered / invalid token
    const tamperedDashReq = new NextRequest("http://localhost:3000/api/admin/dashboard", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=invalid.jwt.token` },
    });
    const tamperedDashRes = await getDashboard(tamperedDashReq);
    assert(tamperedDashRes.status === 401, "Tampered admin token returns 401 Unauthorized");

    // 2.3 Authenticated access
    const authDashReq = new NextRequest("http://localhost:3000/api/admin/dashboard", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
    });
    const authDashRes = await getDashboard(authDashReq);
    assert(authDashRes.status === 200, "Authenticated admin receives 200 OK dashboard stats");
    const dashData = await authDashRes.json();
    assert(typeof dashData.stats.totalUsers === "number", "Dashboard returns totalUsers stat");

    // ---------------------------------------------------
    // 3. ADMIN REPORTS MANAGEMENT
    // ---------------------------------------------------
    console.log("\n3. Testing Admin Reports API...");
    // Create a sample report for moderation
    const sampleReport = await prisma.report.create({
      data: {
        reporterId: freeUserId,
        reportedUserId: proUserId,
        reason: "INAPPROPRIATE_BEHAVIOR",
        details: "Integration test report payload",
        status: "PENDING",
      },
    });
    testReportId = sampleReport.id;

    // 3.1 GET /api/admin/reports - Unauthenticated
    const unauthReportsReq = new NextRequest("http://localhost:3000/api/admin/reports", {
      method: "GET",
    });
    const unauthReportsRes = await getReports(unauthReportsReq);
    assert(unauthReportsRes.status === 401, "Unauthenticated GET /api/admin/reports returns 401");

    // 3.2 GET /api/admin/reports - Authenticated
    const authReportsReq = new NextRequest("http://localhost:3000/api/admin/reports", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
    });
    const authReportsRes = await getReports(authReportsReq);
    assert(authReportsRes.status === 200, "Authenticated GET /api/admin/reports returns 200 OK");
    const reportsList = await authReportsRes.json();
    assert(Array.isArray(reportsList.reports), "Reports endpoint returns list of reports");

    // 3.3 PATCH /api/admin/reports/[id] - Non-existent ID (404)
    const notFoundReportReq = new NextRequest(`http://localhost:3000/api/admin/reports/cmvnonexistent`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ action: "DISMISS" }),
    });
    const notFoundReportRes = await updateReport(notFoundReportReq, { params: { id: "cmvnonexistent" } });
    assert(notFoundReportRes.status === 404, "Non-existent report ID returns 404 Not Found");

    // 3.4 PATCH /api/admin/reports/[id] - Valid Dismissal
    const validDismissReq = new NextRequest(`http://localhost:3000/api/admin/reports/${testReportId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ action: "DISMISS", actionTaken: "Dismissed in test" }),
    });
    const validDismissRes = await updateReport(validDismissReq, { params: { id: testReportId } });
    assert(validDismissRes.status === 200, "Moderator action returns 200 OK");
    const updatedReport = await prisma.report.findUnique({ where: { id: testReportId } });
    assert(updatedReport?.status === "DISMISSED", "Report status updated to DISMISSED");

    // ---------------------------------------------------
    // 4. ADMIN VERIFICATION REQUESTS
    // ---------------------------------------------------
    console.log("\n4. Testing Admin Verifications API...");
    const sampleVerification = await prisma.verificationRequest.create({
      data: {
        userId: freeUserId,
        requestType: "FACE_VERIFICATION",
        payload: JSON.stringify({ selfieUrl: "https://thematchdate.com/test-selfie.jpg" }),
        status: "PENDING",
      },
    });
    testVerificationId = sampleVerification.id;

    // 4.1 GET /api/admin/verifications - Unauthenticated
    const unauthVerifReq = new NextRequest("http://localhost:3000/api/admin/verifications", {
      method: "GET",
    });
    const unauthVerifRes = await getVerifications(unauthVerifReq);
    assert(unauthVerifRes.status === 401, "Unauthenticated verifications request returns 401");

    // 4.2 GET /api/admin/verifications - Authenticated
    const authVerifReq = new NextRequest("http://localhost:3000/api/admin/verifications", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
    });
    const authVerifRes = await getVerifications(authVerifReq);
    assert(authVerifRes.status === 200, "Authenticated verifications request returns 200 OK");

    // 4.3 PATCH /api/admin/verifications/[id] - Validation failure (invalid decision)
    const invalidDecisionReq = new NextRequest(`http://localhost:3000/api/admin/verifications/${testVerificationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ decision: "INVALID_CHOICE" }),
    });
    const invalidDecisionRes = await updateVerification(invalidDecisionReq, { params: { id: testVerificationId } });
    assert(invalidDecisionRes.status === 400, "Invalid verification decision returns 400 Bad Request");

    // 4.4 PATCH /api/admin/verifications/[id] - Valid Approval
    const validApprovalReq = new NextRequest(`http://localhost:3000/api/admin/verifications/${testVerificationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
      },
      body: JSON.stringify({ decision: "APPROVE", adminNotes: "Approved face match" }),
    });
    const validApprovalRes = await updateVerification(validApprovalReq, { params: { id: testVerificationId } });
    assert(validApprovalRes.status === 200, "Admin approval returns 200 OK");
    const verifiedUser = await prisma.user.findUnique({ where: { id: freeUserId } });
    assert(verifiedUser?.isVerified === true, "User isVerified set to true upon admin approval");

    // ---------------------------------------------------
    // 5. ADMIN AUDIT LOGS
    // ---------------------------------------------------
    console.log("\n5. Testing Admin Audit Logs API...");
    const auditLogsReq = new NextRequest("http://localhost:3000/api/admin/audit-logs", {
      method: "GET",
      headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
    });
    const auditLogsRes = await getAuditLogs(auditLogsReq);
    assert(auditLogsRes.status === 200, "GET /api/admin/audit-logs returns 200 OK");
    const auditData = await auditLogsRes.json();
    assert(Array.isArray(auditData.logs) && auditData.logs.length > 0, "Audit logs contain recorded admin actions");

    // ---------------------------------------------------
    // 6. EVENTS API — ACCESS CONTROL & VALIDATION
    // ---------------------------------------------------
    console.log("\n6. Testing Events API (GET & POST /api/events)...");

    // 6.1 GET /api/events - Unauthenticated
    const unauthEventsReq = new NextRequest("http://localhost:3000/api/events", { method: "GET" });
    const unauthEventsRes = await getEvents(unauthEventsReq);
    assert(unauthEventsRes.status === 401, "Unauthenticated GET /api/events returns 401 Unauthorized");

    // 6.2 GET /api/events - Non-PRO User Gating (403 PRO_REQUIRED)
    const freeEventsReq = new NextRequest("http://localhost:3000/api/events", {
      method: "GET",
      headers: { Cookie: `${config.auth.cookieName}=${freeUserToken}` },
    });
    const freeEventsRes = await getEvents(freeEventsReq);
    assert(freeEventsRes.status === 403, "Non-PRO user is strictly denied access with 403 Forbidden");
    const freeEventsData = await freeEventsRes.json();
    assert(freeEventsData.code === "PRO_REQUIRED", "Rejection response specifies PRO_REQUIRED error code");

    // 6.3 POST /api/events - Non-PRO User Gating (403 PRO_REQUIRED)
    const freeCreateReq = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${freeUserToken}`,
      },
      body: JSON.stringify({ title: "Unauthorized Event" }),
    });
    const freeCreateRes = await createEvent(freeCreateReq);
    assert(freeCreateRes.status === 403, "Non-PRO event creation returns 403 Forbidden");

    // 6.4 POST /api/events - PRO User Schema Validation Failure (400)
    const invalidEventReq = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${proUserToken}`,
      },
      body: JSON.stringify({
        title: "Hi", // min 3 chars required
        category: "InvalidCategory",
      }),
    });
    const invalidEventRes = await createEvent(invalidEventReq);
    assert(invalidEventRes.status === 400, "Invalid schema payload returns 400 Bad Request");

    // 6.5 POST /api/events - Valid PRO User Event Creation (201)
    const validEventPayload = {
      title: "Indore Tech Founders & Designers Mixer",
      category: "Networking",
      description: "An exclusive evening mixer for startup builders, developers, and product designers in Indore.",
      startDateTime: new Date(Date.now() + 86400000).toISOString(),
      endDateTime: new Date(Date.now() + 90000000).toISOString(),
      venue: "Vijay Nagar Club",
      address: "100 Scheme 54, Vijay Nagar, Indore",
      isResidential: true,
      minAge: 21,
      capacity: 30,
      feeInPaise: 0,
      isPaid: false,
      attendanceMode: "REQUEST_APPROVAL",
    };
    const validCreateReq = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${proUserToken}`,
      },
      body: JSON.stringify(validEventPayload),
    });
    const validCreateRes = await createEvent(validCreateReq);
    assert(validCreateRes.status === 200 || validCreateRes.status === 201, "Valid event creation by PRO user returns 200/201 OK");
    const createdEventData = await validCreateRes.json();
    createdEventId = createdEventData.event.id;
    assert(Boolean(createdEventId), "Created event returns valid identifier");

    // 6.6 GET /api/events - PRO User Access & Residential Masking Verification
    const proEventsReq = new NextRequest("http://localhost:3000/api/events", {
      method: "GET",
      headers: { Cookie: `${config.auth.cookieName}=${secondaryProUserToken}` },
    });
    const proEventsRes = await getEvents(proEventsReq);
    assert(proEventsRes.status === 200, "PRO user retrieves events list with 200 OK");
    const proEventsData = await proEventsRes.json();
    const fetchedEvent = proEventsData.events.find((e: any) => e.id === createdEventId);
    assert(Boolean(fetchedEvent), "Created event appears in PRO user event feed");
    assert(
      fetchedEvent.address.includes("Residential Area"),
      "Residential address is securely masked for non-approved attendees"
    );

    // ---------------------------------------------------
    // 7. EVENT DETAILS & RSVP JOIN WORKFLOW
    // ---------------------------------------------------
    console.log("\n7. Testing Event Details & RSVP Workflow...");

    // 7.1 GET /api/events/[id] - Non-existent event (404)
    const missingEventReq = new NextRequest("http://localhost:3000/api/events/nonexistent_id", {
      method: "GET",
      headers: { Cookie: `${config.auth.cookieName}=${proUserToken}` },
    });
    const missingEventRes = await getEventDetails(missingEventReq, { params: { id: "nonexistent_id" } });
    assert(missingEventRes.status === 404, "Non-existent event ID returns 404 Not Found");

    // 7.2 POST /api/events/[id]/join - Non-existent event (404)
    const missingJoinReq = new NextRequest(`http://localhost:3000/api/events/nonexistent_id/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${secondaryProUserToken}`,
      },
      body: JSON.stringify({ note: "Joining missing event" }),
    });
    const missingJoinRes = await joinEvent(missingJoinReq, { params: { id: "nonexistent_id" } });
    assert(missingJoinRes.status === 404, "Join attempt on non-existent event returns 404 Not Found");

    // 7.3 POST /api/events/[id]/join - Secondary PRO Attendee Joining (200)
    const validJoinReq = new NextRequest(`http://localhost:3000/api/events/${createdEventId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${config.auth.cookieName}=${secondaryProUserToken}`,
      },
      body: JSON.stringify({ note: "Looking forward to meeting builders" }),
    });
    const validJoinRes = await joinEvent(validJoinReq, { params: { id: createdEventId! } });
    assert(validJoinRes.status === 200, "PRO attendee RSVP join request succeeds with 200 OK");
    const joinData = await validJoinRes.json();
    assert(joinData.status === "REQUESTED", "Join request status is REQUESTED for organizer approval");

    // ---------------------------------------------------
    // 8. CROSS-USER AUTHORIZATION & ATTENDEE REVIEW
    // ---------------------------------------------------
    console.log("\n8. Testing Cross-User Authorization & Organizer Review...");

    // Find the created attendee record ID
    const attendeeRecord = await prisma.eventAttendee.findFirst({
      where: { eventId: createdEventId!, userId: secondaryProUserId },
    });
    assert(Boolean(attendeeRecord), "Attendee record exists in database");

    // 8.1 Cross-User Access Violation: Secondary PRO user trying to approve attendee on someone else's event (403)
    const crossUserReviewReq = new NextRequest(
      `http://localhost:3000/api/events/${createdEventId}/review-attendee`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${config.auth.cookieName}=${secondaryProUserToken}`,
        },
        body: JSON.stringify({
          attendeeId: attendeeRecord!.id,
          action: "APPROVE",
        }),
      }
    );
    const crossUserReviewRes = await reviewAttendee(crossUserReviewReq, { params: { id: createdEventId! } });
    assert(
      crossUserReviewRes.status === 403,
      "Cross-user attendee review strictly blocked with 403 Forbidden (Non-organizer cannot review attendees)"
    );

    // 8.2 Legitimate Organizer Approval (200)
    const organizerReviewReq = new NextRequest(
      `http://localhost:3000/api/events/${createdEventId}/review-attendee`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${config.auth.cookieName}=${proUserToken}`,
        },
        body: JSON.stringify({
          attendeeId: attendeeRecord!.id,
          action: "APPROVE",
        }),
      }
    );
    const organizerReviewRes = await reviewAttendee(organizerReviewReq, { params: { id: createdEventId! } });
    assert(organizerReviewRes.status === 200, "Legitimate organizer attendee approval succeeds with 200 OK");
    const updatedAttendee = await prisma.eventAttendee.findUnique({
      where: { id: attendeeRecord!.id },
    });
    assert(updatedAttendee?.status === "APPROVED", "Attendee record status transitioned to APPROVED");

  } finally {
    // ---------------------------------------------------
    // CLEANUP FIXTURES
    // ---------------------------------------------------
    console.log("\n9. Cleaning Up Test Fixtures...");
    if (createdEventId) {
      await prisma.eventAttendee.deleteMany({ where: { eventId: createdEventId } });
      await prisma.event.deleteMany({ where: { id: createdEventId } });
    }
    if (testReportId) {
      await prisma.report.deleteMany({ where: { id: testReportId } });
    }
    if (testVerificationId) {
      await prisma.verificationRequest.deleteMany({ where: { id: testVerificationId } });
    }
    if (adminId) {
      await prisma.adminAuditLog.deleteMany({ where: { adminUserId: adminId } });
      await prisma.adminUser.deleteMany({ where: { id: adminId } });
    }
    if (secondaryProUserId) {
      await prisma.subscription.deleteMany({ where: { userId: secondaryProUserId } });
      await prisma.profile.deleteMany({ where: { userId: secondaryProUserId } });
      await prisma.user.deleteMany({ where: { id: secondaryProUserId } });
    }
    if (proUserId) {
      await prisma.subscription.deleteMany({ where: { userId: proUserId } });
      await prisma.profile.deleteMany({ where: { userId: proUserId } });
      await prisma.user.deleteMany({ where: { id: proUserId } });
    }
    if (freeUserId) {
      await prisma.profile.deleteMany({ where: { userId: freeUserId } });
      await prisma.user.deleteMany({ where: { id: freeUserId } });
    }
    await prisma.$disconnect();
    console.log("  ✓ All fixtures cleaned up from database.");
  }

  console.log("\n=================================================");
  console.log("🎉 ALL ADMIN & EVENTS INTEGRATION TESTS PASSED!");
  console.log("=================================================\n");
}

runAdminAndEventsIntegrationSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
