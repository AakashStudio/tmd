import { z } from "zod";

/**
 * Calculates exact age in full completed years from a given Date of Birth.
 */
export function calculateAge(dob: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Extracts first user-friendly error message from ZodError issues.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues?.[0]?.message || "Validation failed";
}

// ----------------------------------------------------
// Auth Schemas
// ----------------------------------------------------

export const sendOtpSchema = z.object({
  provider: z.enum(["PHONE_OTP", "EMAIL_OTP"]),
  identifier: z
    .string()
    .trim()
    .min(3, "Identifier must be provided")
    .refine(
      (val) => {
        // Indian phone (10 digits with optional +91) or international E.164, OR standard email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^\+?[0-9]{10,15}$/.test(val.replace(/[\s-]/g, ""));
        return isEmail || isPhone;
      },
      { message: "Please provide a valid phone number or email address" }
    ),
});

export const verifyOtpSchema = z.object({
  provider: z.enum(["PHONE_OTP", "EMAIL_OTP"]),
  identifier: z.string().trim().min(3),
  otp: z.string().trim().length(6, "OTP must be exactly 6 digits"),
});

export const registrationGateSchema = z.object({
  dob: z.coerce.date().refine((date) => {
    const age = calculateAge(date);
    return age >= 18;
  }, {
    message: "You must be at least 18 years of age to register on TMD.",
  }),
  is18PlusConfirmed: z.literal(true, {
    message: "Explicit 18+ confirmation is required to proceed.",
  }),
});

// ----------------------------------------------------
// Profile Schemas
// ----------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  gender: z.string().trim().min(1).max(30).optional(),
  interestedIn: z.string().trim().min(1).max(30).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  profession: z.string().trim().max(100).optional().nullable(),
  education: z.string().trim().max(100).optional().nullable(),
  height: z.number().int().min(100).max(250).optional().nullable(),
  relationshipIntention: z
    .enum(["LONG_TERM", "SHORT_TERM_CASUAL", "FRIENDSHIP", "NOT_SURE_YET"])
    .optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const dobCorrectionRequestSchema = z.object({
  requestedDob: z.coerce.date().refine((date) => {
    return date < new Date();
  }, {
    message: "Requested date of birth cannot be in the future.",
  }),
  documentUrl: z.string().url("Valid proof document URL is required"),
  notes: z.string().max(300).optional(),
});

// ----------------------------------------------------
// Discovery & Swipes Schemas
// ----------------------------------------------------

export const swipeActionSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  action: z.enum(["LIKE", "PASS"]),
});

export const preferenceFilterSchema = z.object({
  minAge: z.number().int().min(18).max(99).default(18),
  maxAge: z.number().int().min(18).max(99).default(99),
  maxDistanceKm: z.number().int().min(1).max(500).default(50),
  targetCity: z.string().trim().optional().nullable(),
  preferredGenders: z.array(z.string()).default([]),
});

// ----------------------------------------------------
// Events Schemas
// ----------------------------------------------------

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.enum([
    "House Party",
    "Standup",
    "Music",
    "Sports",
    "Dinner",
    "Networking",
    "Workshop",
    "Game Night",
    "Meetup",
    "Other",
  ]),
  description: z.string().trim().min(10).max(2000),
  coverPhotoUrl: z.string().url().optional().nullable(),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  venue: z.string().trim().min(2).max(150),
  address: z.string().trim().min(5).max(250),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isResidential: z.boolean().default(false),
  minAge: z.number().int().min(18).max(99).default(18),
  capacity: z.number().int().min(2).max(1000),
  feeInPaise: z.number().int().min(0).default(0),
  attendanceMode: z.enum(["OPEN_JOIN", "REQUEST_APPROVAL"]).default("OPEN_JOIN"),
}).refine((data) => data.endDateTime > data.startDateTime, {
  message: "Event end time must be after the start time",
  path: ["endDateTime"],
});

// ----------------------------------------------------
// Safety & Moderation Schemas
// ----------------------------------------------------

export const reportSchema = z.object({
  reportedUserId: z.string().optional().nullable(),
  reportedEventId: z.string().optional().nullable(),
  reason: z.string().trim().min(3).max(100),
  details: z.string().trim().max(1000).optional().nullable(),
}).refine((data) => Boolean(data.reportedUserId || data.reportedEventId), {
  message: "Either a reported user or a reported event must be provided.",
});

export const blockSchema = z.object({
  blockedUserId: z.string().min(1, "Target user ID to block is required"),
});
