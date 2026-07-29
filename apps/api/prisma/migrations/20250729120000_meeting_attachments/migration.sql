ALTER TABLE "attachments" ADD COLUMN IF NOT EXISTS "meeting_id" TEXT;

CREATE INDEX IF NOT EXISTS "attachments_meeting_id_idx" ON "attachments"("meeting_id");

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_meeting_id_fkey"
  FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
