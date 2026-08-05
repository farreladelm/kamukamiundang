ALTER TABLE "TemplateCatalog"
  ADD COLUMN "hasBeenVisible" BOOLEAN NOT NULL DEFAULT false;

UPDATE "TemplateCatalog"
SET "hasBeenVisible" = true
WHERE "status" IN ('VISIBLE', 'HIDDEN', 'RETIRED');
