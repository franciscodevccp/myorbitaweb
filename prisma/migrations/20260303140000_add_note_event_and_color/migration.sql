-- AlterTable
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Note_eventId_idx" ON "Note"("eventId");

-- AddForeignKey (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Note_eventId_fkey'
  ) THEN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
