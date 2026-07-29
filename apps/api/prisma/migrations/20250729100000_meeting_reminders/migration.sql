ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEETING_REMINDER';

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "reminder_sent_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "meetings_start_time_reminder_sent_at_idx"
  ON "meetings"("start_time", "reminder_sent_at");
