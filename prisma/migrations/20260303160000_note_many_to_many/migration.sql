
-- CreateTable (Prisma implicit many-to-many: Book <-> Note)
CREATE TABLE "_BookToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable (Prisma implicit many-to-many: CalendarEvent <-> Note)
CREATE TABLE "_CalendarEventToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Migrate existing relations from Note.bookId and Note.eventId
INSERT INTO "_BookToNote" ("A", "B") SELECT "bookId", "id" FROM "Note" WHERE "bookId" IS NOT NULL;
INSERT INTO "_CalendarEventToNote" ("A", "B") SELECT "eventId", "id" FROM "Note" WHERE "eventId" IS NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Note_bookId_idx";
DROP INDEX IF EXISTS "Note_eventId_idx";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN IF EXISTS "bookId";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "eventId";

-- CreateIndex
CREATE UNIQUE INDEX "_BookToNote_AB_unique" ON "_BookToNote"("A", "B");
CREATE INDEX "_BookToNote_B_index" ON "_BookToNote"("B");
CREATE UNIQUE INDEX "_CalendarEventToNote_AB_unique" ON "_CalendarEventToNote"("A", "B");
CREATE INDEX "_CalendarEventToNote_B_index" ON "_CalendarEventToNote"("B");

-- AddForeignKey
ALTER TABLE "_BookToNote" ADD CONSTRAINT "_BookToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BookToNote" ADD CONSTRAINT "_BookToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CalendarEventToNote" ADD CONSTRAINT "_CalendarEventToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CalendarEventToNote" ADD CONSTRAINT "_CalendarEventToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
