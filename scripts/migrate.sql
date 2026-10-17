ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "promptQuestion" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "promptAnswer" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemTitle" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemArtist" text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "anthemCoverUrl" text;

ALTER TABLE likes ADD COLUMN IF NOT EXISTS "comment" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "replyType" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "replyContext" text;
ALTER TABLE likes ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PENDING' NOT NULL;
