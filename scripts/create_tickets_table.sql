DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPassType') THEN
    CREATE TYPE "TicketPassType" AS ENUM ('MALE_PASS', 'FEMALE_PASS', 'COUPLE_PASS', 'GENERAL_PASS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPaymentStatus') THEN
    CREATE TYPE "TicketPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
  END IF;
END
$$;

ALTER TABLE events ADD COLUMN IF NOT EXISTS "malePassPrice" INTEGER DEFAULT 499;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "femalePassPrice" INTEGER DEFAULT 199;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "couplePassPrice" INTEGER DEFAULT 799;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "generalPassPrice" INTEGER DEFAULT 399;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "fnbCoverIncluded" TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "tmdCommissionPercent" DOUBLE PRECISION DEFAULT 0.15;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "convenienceFee" INTEGER DEFAULT 39;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "hostUpiId" TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "hostPhone" TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS event_tickets (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "ticketType" "TicketPassType" NOT NULL DEFAULT 'GENERAL_PASS',
  quantity INTEGER NOT NULL DEFAULT 1,
  "basePriceInPaise" INTEGER NOT NULL,
  "convenienceFeeInPaise" INTEGER NOT NULL DEFAULT 3900,
  "totalAmountInPaise" INTEGER NOT NULL,
  "tmdCommissionInPaise" INTEGER NOT NULL DEFAULT 0,
  "organizerPayoutInPaise" INTEGER NOT NULL DEFAULT 0,
  "ticketCode" TEXT UNIQUE NOT NULL,
  "qrData" TEXT NOT NULL,
  "paymentStatus" "TicketPaymentStatus" NOT NULL DEFAULT 'PAID',
  "paymentMethod" TEXT DEFAULT 'UPI',
  "paymentTxnId" TEXT,
  "checkedIn" BOOLEAN NOT NULL DEFAULT false,
  "checkedInAt" TIMESTAMP(3),
  "attendeeName" TEXT,
  "attendeePhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS event_tickets_eventId_paymentStatus_idx ON event_tickets("eventId", "paymentStatus");
CREATE INDEX IF NOT EXISTS event_tickets_userId_idx ON event_tickets("userId");
