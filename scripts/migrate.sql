ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "promptQuestion" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "promptAnswer" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemTitle" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemArtist" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemCoverUrl" text;

ALTER TABLE likes ADD COLUMN IF NOT EXISTS "comment" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "replyType" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "replyContext" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PENDING' NOT NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS "isPaid" boolean DEFAULT false NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "entryFee" integer DEFAULT 0 NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "requireLinkedin" boolean DEFAULT false NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS "isLinkedinMandatory" boolean DEFAULT false NOT NULL;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS "linkedinUrl" text;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS "note" text;
