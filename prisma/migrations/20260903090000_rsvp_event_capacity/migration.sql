ALTER TABLE "Rsvp" ADD COLUMN "eventKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Rsvp"
SET "eventKeys" = ARRAY["eventKey"]::TEXT[]
WHERE "eventKey" IS NOT NULL;

ALTER TABLE "Rsvp" DROP COLUMN "eventKey";
